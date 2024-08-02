const Address = require("../../models/addressModel")
const Cart = require("../../models/cartModel")
const Order = require("../../models/orderModel")
const Variants = require("../../models/varientModel")
const Coupon = require("../../models/couponModel")
const Wallet = require("../../models/walletModel")
const Crypto = require("crypto")
const Razorpay = require("razorpay")
const PDFDocument = require('pdfkit');


exports.viewOrder = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const orderId = req.query.orderId;

        const orderInfo = await Order.findOne({ userId: userId, _id: orderId }).populate({
            path: 'orderItems.variantId',
            model: 'Varients',
            populate: {
                path: 'productId',
                model: 'Product'
            }
        });

        console.log("Offer Discount  :  ",orderInfo.orderItems[0].variantId.offerDiscount); 
        console.log("SubTotalllllll  :    ",orderInfo.orderItems[0].variantId.subTotal);
        console.log("ORDER INFOOOOO  :  ",orderInfo);

        if (!orderInfo) {
            return res.status(400).json({ error: 'Invalid operation' });
        }

        let subTotal = 0;
        let totalOfferDiscount = 0;
        
        orderInfo.orderItems.forEach(item => {
            subTotal += item.variantPrice * item.quantity;
            if (item.variantId.offerDiscount) {
                totalOfferDiscount += subTotal * (item.variantId.offerDiscount / 100) ;
            }
        });

        let totalAmount = subTotal - totalOfferDiscount;

        // Calculate grandTotal
        const deliveryCharge = parseFloat(orderInfo.deliveryCharge) || 0;
        const claimedAmount = orderInfo.couponDetails?.claimedAmount || 0;
        const offerDiscount = orderInfo.orderItems[0].variantId.offerDiscount || 0;
        const grandTotal = totalAmount + deliveryCharge - claimedAmount;

        console.log("TOTAL AMOUNT  :  ",totalAmount);
        console.log("SUBTOTAL  :  ",subTotal);
        console.log("DELIVERY CHARGE : ",deliveryCharge);
        console.log("CLAIMED AMOUNT  : ",claimedAmount);
        console.log("OFFER DISCOUNT  :  ",offerDiscount);
        console.log("Grand Total : ",grandTotal);

        // Update orderInfo
        orderInfo.subTotal = subTotal;
        orderInfo.grandTotal = grandTotal;

        const address = await Address.findOne({ userId });

        res.render('users/order', { orders: orderInfo, address ,offerDiscount, grandTotal});
    } catch (error) {
        next(error);
    }
};


exports.checkWalletBalance = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        return res.status(200).json({ balance: wallet.balance });
    } catch (error) {
        console.log("Error in checkWalletBalance", error);
        res.status(500).json({ message: "Server Error" });
    }
};


exports.placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, paymentMethod, couponId } = req.body;

        console.log("Address ID: ", addressId);
        console.log("Payment Method: ", paymentMethod);
        console.log("Coupon ID: ", couponId);

        if (!userId) {
            return res.status(401).send("User not authenticated");
        }

        if (!addressId || !paymentMethod) {
            return res.status(400).send("Missing required fields");
        }

        const myCart = await Cart.findOne({ userId }).populate({
            path: 'products.productVariantId',
            select: 'size salePrice stock colour image productName categoryName offerDiscount',
            populate: {
                path: 'productId',
                model: 'Product',
                select: 'categoryId'
            }
        });

        const address = await Address.findOne({ _id: addressId, userId });

        if (!myCart || myCart.products.length === 0) {
            return res.status(400).redirect('/cart');
        }

        if (!address) {
            return res.status(400).send("Invalid address");
        }

        myCart.products.forEach(product => {
            console.log("Product Variant ID Data: ", product.productVariantId);
        });

        const orderItems = myCart.products.map(product => ({
            variantId: product.productVariantId._id,
            variantName: product.productVariantId.productName,
            variantPrice: product.productVariantId.salePrice,
            quantity: product.quantity,
            offerDiscount: product.productVariantId.offerDiscount || 0,
            orderStatus : (paymentMethod == 'COD' || paymentMethod == 'Wallet Payment') ? 'Processing' : 'Pending'

            
        }));

        let subTotal = orderItems.reduce((acc, item) => {
            let price = item.variantPrice;
            if (item.offerDiscount) {
                price = price * (1 - item.offerDiscount / 100);
            }
            return acc + price * item.quantity;
        }, 0);

        let offerDiscount = myCart.products[0].productVariantId.offerDiscount || 0;
        let deliveryCharge = 50;
        let discountPercentage = 0;
        let claimedAmount = 0;
        let coupon = null;

        if (couponId) {
            coupon = await Coupon.findOne({ _id: couponId });

            if (!coupon) {
                return res.status(400).send("Invalid coupon code");
            }
            if (subTotal >= coupon.minPurchaseAmount) {
                discountPercentage = coupon.discountPercentage;
                console.log("Discount Percentage  :  ", discountPercentage);
                claimedAmount = Math.min(subTotal * (discountPercentage / 100), coupon.maxRedeemAmount);
                console.log("Claimed Amount  :  ", claimedAmount);
                subTotal -= claimedAmount;
            } else {
                return res.status(400).send(`Minimum purchase amount for this coupon is ${coupon.minPurchaseAmount}`);
            }
        }
        const grandTotal = subTotal + deliveryCharge;

        const newOrder = new Order({
            userId,
            orderItems,
            orderDate: new Date(),
            paymentMethod,
            subTotal,
            deliveryCharge,
            grandTotal,
            offerDiscount,
            paymentStatus: 'Failed',
            shippingAddress: {
                name: address.name,
                altPhone: address.mobile,
                pinCode: address.pincode,
                locality: address.locality,
                address: address.address,
                city: address.city,
                state: address.state,
                landmark: address.landMark,
                postoffice: address.postOffice,
                addressType: address.addressType
            },
            couponDetails: {
                discountPercentage,
                claimedAmount,
                couponId,
                minPurchaseAmount: coupon ? coupon.minPurchaseAmount : 0,
                maxDiscountAmount: coupon ? coupon.maxRedeemAmount : 0,
            }
        });

        if (paymentMethod === 'Wallet Payment') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < grandTotal) {
                return res.status(400).json({ message: "Insufficient wallet balance" });
            }

            console.log(`Wallet balance before deduction: ${wallet.balance}`);

            //  Wallet balance and record the transaction
            wallet.balance -= grandTotal;
            wallet.transactions.push({
                amount: grandTotal,
                transactionMethod: 'Purchase'
            });
            await wallet.save();
        }

        const savedOrder = await newOrder.save();

        if (paymentMethod === 'COD' || paymentMethod === 'Wallet Payment') {
            await Cart.deleteOne({ userId: userId });
            savedOrder.paymentStatus = 'Success';
            await savedOrder.save();
            return res.status(200).json({ orderId: savedOrder._id, success: 'Order placed successfully' });
        }

        // instance of Razorpay
        const instance = new Razorpay({
            key_id: process.env.RAZOR_KEYID,
            key_secret: process.env.RAZOR_KEYSECRET
        });

        // Creating Razorpay order
        const razorpayOrder = await instance.orders.create({
            amount: grandTotal * 100,
            currency: 'INR',
            receipt: savedOrder._id.toString(),
            payment_capture: 1
        });

        savedOrder.razorpayOrder_id = razorpayOrder.id;
        await savedOrder.save();

        return res.status(200).json({ success: 'Ok', orderId: savedOrder._id, razorpayOrderId: razorpayOrder.id, grandTotal });
    } catch (error) {
        console.log("Error in placeOrder", error);
        res.status(500).send("Server Error");
    }
};



exports.rePayment = async (req, res,next) => {
    try {
      const { orderId } = req.body
    
      const placedOrder = await Order.findById(orderId)
      if (!orderId || !placedOrder) {
        return res.status(400).json({ message: 'Order not found' })
      }
  
      const grandTotal = placedOrder.grandTotal
  
      const instance = new Razorpay({
        key_id: process.env.RAZOR_KEYID,
        key_secret: process.env.RAZOR_KEYSECRET
    });
  
        // Creating Razorpay order
        const razorpayOrder = await instance.orders.create({
            amount: grandTotal * 100,
            currency: 'INR',
            receipt: placedOrder._id.toString(),
            payment_capture: 1
        });
  
      return res.json({
        razorpayOrder,
        placedOrder,
        KEY: process.env.RAZORPAY_KEYID,
        orderId
      })
    } catch (error) {
      next(error)
    }
  }


  
exports.verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
        console.log(req.body);

        const shasum = Crypto.createHmac('sha256', process.env.RAZOR_KEYSECRET);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest === razorpay_signature) {
            const updatedOrder = await Order.findByIdAndUpdate(order_id, {
                'orderItems.$[].orderStatus': 'Processing',
                razorPayment_id: razorpay_payment_id,
                paymentStatus: 'Success'
            }, { new: true });

            if (!updatedOrder) {
                return res.status(404).json({ error: 'Order not found' });
            }

            await Cart.deleteOne({ userId: updatedOrder.userId });

            return res.status(200).json({ order_id, success: 'Payment successful and Order placed' });
        } else {
            await Order.findByIdAndUpdate(order_id, {
                paymentStatus: 'Failed'
            });

            return res.status(400).json({ error: 'Payment verification failed' });
        }
    } catch (error) {
        next(error);
    }
};



exports.invoice = async (req, res) => {
    try {
        const orderId = req.query.orderId;

        const orderDetails = await Order.findById(orderId)
            .populate({ path: 'orderItems.variantId', model: "Varients" })
            .populate('userId');

        if (!orderDetails) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument({ bufferPages: true, size: 'A4', margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${orderId}.pdf"`);
    
        doc.fontSize(16).text('STINSON', { align: 'center' });
        doc.moveDown();
    
        doc.fontSize(12);

        // Header
        doc.text('STINSON PRIVATE LIMITED');
        doc.text('4th Floor, Citycenter, Kannur, Kerala, 670642');
        doc.text('GSTIN: 01ARECG1316RT6Y');
        doc.moveDown();
        
        // Order Details
        doc.text(`Order Date: ${new Date(orderDetails.orderDate).toDateString()}`);
        doc.text(`Order ID: ${orderDetails._id}`);
        doc.text(`Payment Mode: ${orderDetails.paymentMethod}`);
        doc.moveDown();

        // Shipping Address
        doc.text('Ship To:');
        doc.moveDown();
        doc.text(`Name: ${orderDetails.shippingAddress.name}`);
        doc.text(`Address: ${orderDetails.shippingAddress.landmark}, ${orderDetails.shippingAddress.postoffice}`);
        doc.text(`City: ${orderDetails.shippingAddress.city}`);
        doc.text(`State: ${orderDetails.shippingAddress.state}`);
        doc.text(`Pincode: ${orderDetails.shippingAddress.pinCode}`);
        doc.text(`Phone: ${orderDetails.shippingAddress.altPhone}`);
        doc.moveDown();

        // Define table headers
        const tableHeaders = ['Product Name', 'Size', 'Color', 'Quantity', 'Price', 'Total'];
        const colWidths = [200, 50, 50, 50, 80, 80];
        const startX = doc.x;
        let y = doc.y;

        // table header with borders
        doc.lineWidth(0.5).rect(startX, y, colWidths.reduce((a, b) => a + b), 20).stroke();
        y += 5;
        tableHeaders.forEach((header, i) => {
            doc.text(header, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
                width: colWidths[i],
                align: 'center'
            });
        });
        y += 15;

        // product rows
        orderDetails.orderItems.forEach(item => {
            const dataRow = [
                item.variantName,
                item.variantId.size,
                item.variantId.colour,
                item.quantity,
                `${item.variantPrice.toFixed(2)}`,
                `${(item.variantPrice * item.quantity).toFixed(2)}`
            ];

            // row border
            doc.lineWidth(0.5).rect(startX, y, colWidths.reduce((a, b) => a + b), 20).stroke();
            y += 5;
            
            // data row
            dataRow.forEach((cell, i) => {
                doc.text(cell, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
                    width: colWidths[i],
                    align: 'center'
                });
            });
            y += 15;
        });

        y += 10; 

        // Add total amounts
        const deliveryCharge = parseFloat(orderDetails.deliveryCharge);
        const totals = [
            { label: 'Subtotal:', amount: `${orderDetails.subTotal.toFixed(2)}` },
            { label: 'Delivery Charge:', amount: `${deliveryCharge.toFixed(2)}` },
        ];

        if (orderDetails.couponDetails) {
            totals.push({ label: 'Coupon Discount:', amount: `${orderDetails.couponDetails.claimedAmount.toFixed(2)}` });
        }

        totals.push({ label: 'Grand Total:', amount: `${orderDetails.grandTotal.toFixed(2)}` });

        totals.forEach(total => {
            doc.text(total.label, startX + 300, y, { width: 100, align: 'right' });
            doc.text(total.amount, startX + 400, y, { width: 80, align: 'right' });
            y += 15;
        });

        doc.end();
        doc.pipe(res);
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Internal Server Error');
    }
};


