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

        console.log("Offer Discouhnttttttttttt   :  ",orderInfo.orderItems[0].variantId.offerDiscount); 
        console.log("SubTotalllllllll   :    ",orderInfo.orderItems[0].variantId.subTotal);
        console.log("ORDER INFOOOOOOO  :  ",orderInfo);

        if (!orderInfo) {
            return res.status(400).json({ error: 'Invalid operation' });
        }

        let subTotal = 0;
        let totalOfferDiscount = 0;

        orderInfo.orderItems.forEach(item => {
            subTotal += item.variantPrice * item.quantity;
        });

        // Calculate grandTotal
        const deliveryCharge = parseFloat(orderInfo.deliveryCharge) || 0;
        const claimedAmount = orderInfo.couponDetails?.claimedAmount || 0;
        const offerDiscount = orderInfo.orderItems[0].variantId.offerDiscount || 0;
        const grandTotal = subTotal + deliveryCharge - claimedAmount - offerDiscount;

        console.log("OFFER DISCOUNT  :  ",offerDiscount);

        // Update orderInfo
        orderInfo.subTotal = subTotal;
        orderInfo.grandTotal = grandTotal;

        const address = await Address.findOne({ userId });

        res.render('users/order', { orders: orderInfo, address ,offerDiscount});
    } catch (error) {
        next(error);
    }
};

// exports.viewOrder = async (req, res, next) => {
//     try {
//         const userId = req.session.userId;
//         const orderId = req.query.orderId;

//         const orderInfo = await Order.findOne({ userId: userId, _id: orderId }).populate({
//             path: 'orderItems.variantId',
//             model: 'Varients', 
//             populate: {
//                 path: 'productId',
//                 model: 'Product'
//             }
//         });

//         if (!orderInfo) {
//             return res.status(400).json({ error: 'Invalid operation' });
//         }

//         let subTotal = 0;
//         let totalOfferDiscount = 0;

//         orderInfo.orderItems.forEach(item => {
//             const variant = item.variantId;
//             const variantPrice = item.variantPrice;
//             const quantity = item.quantity;
//             const offerDiscountPercentage = variant.offerDiscount || 0;

//             const total = variantPrice * quantity;
//             const discountAmount = (total * offerDiscountPercentage) / 100;

//             subTotal += total;
//             totalOfferDiscount += discountAmount;
//         });

//         // Calculate grandTotal
//         const deliveryCharge = parseFloat(orderInfo.deliveryCharge) || 0;
//         const claimedAmount = orderInfo.couponDetails?.claimedAmount || 0;
//         const grandTotal = subTotal + deliveryCharge - claimedAmount - totalOfferDiscount;

//         // Update orderInfo
//         orderInfo.subTotal = subTotal;
//         orderInfo.grandTotal = grandTotal;

//         const address = await Address.findOne({ userId });

//         res.render('users/order', { orders: orderInfo, address, offerDiscount: totalOfferDiscount });
//     } catch (error) {
//         next(error);
//     }
// };


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
            select: 'size salePrice stock colour image productName categoryName',
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

        const orderItems = myCart.products.map(product => ({
            variantId: product.productVariantId._id,
            variantName: product.productVariantId.productName,
            variantPrice: product.productVariantId.salePrice,
            quantity: product.quantity,
        }));

        let subTotal = orderItems.reduce((acc, item) => acc + item.variantPrice * item.quantity, 0);
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
            paymentStatus: 'Pending',
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

            // Deduct from wallet balance and record the transaction
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

// exports.placeOrder = async (req, res) => {
//     try {
//         const userId = req.session.userId;
//         const { addressId, paymentMethod, couponId } = req.body;

//         console.log("Address ID: ", addressId);
//         console.log("Payment Method: ", paymentMethod);
//         console.log("Coupon ID: ", couponId);

//         if (!userId) {
//             return res.status(401).send("User not authenticated");
//         }

//         if (!addressId || !paymentMethod) {
//             return res.status(400).send("Missing required fields");
//         }

//         const myCart = await Cart.findOne({ userId }).populate({
//             path: 'products.productVariantId',
//             select: 'size salePrice stock colour image productName categoryName',
//             populate: {
//                 path: 'productId',
//                 model: 'Product',
//                 select: 'categoryId'
//             }
//         });

//         const address = await Address.findOne({ _id: addressId, userId });

//         if (!myCart || myCart.products.length === 0) {
//             return res.status(400).redirect('/cart');
//         }

//         if (!address) {
//             return res.status(400).send("Invalid address");
//         }

//         const orderItems = myCart.products.map(product => ({
//             variantId: product.productVariantId._id,
//             variantName: product.productVariantId.productName,
//             variantPrice: product.productVariantId.salePrice,
//             quantity: product.quantity,
//         }));

//         let subTotal = orderItems.reduce((acc, item) => acc + item.variantPrice * item.quantity, 0);
//         let deliveryCharge = 50;
//         let discountPercentage = 0;
//         let claimedAmount = 0;
//         let coupon = null;

//         if (couponId) {
//             coupon = await Coupon.findOne({ _id: couponId });

//             if (!coupon) {
//                 return res.status(400).send("Invalid coupon code");
//             }
//             if (subTotal >= coupon.minPurchaseAmount) {

//                 discountPercentage = coupon.discountPercentage;
//                 console.log("Discount Percentage  :  ",discountPercentage);

//                 claimedAmount = Math.min(subTotal * (discountPercentage / 100), coupon.maxRedeemAmount);
//                 console.log("Claimed Amount  :  ",claimedAmount);

//                 subTotal -= claimedAmount;
//             } else {
//                 return res.status(400).send(`Minimum purchase amount for this coupon is ${coupon.minPurchaseAmount}`);
//             }
//         }

//         const grandTotal = subTotal + deliveryCharge;

//         const newOrder = new Order({
//             userId,
//             orderItems,
//             orderDate: new Date(),
//             paymentMethod,
//             subTotal,
//             deliveryCharge,
//             grandTotal,
//             shippingAddress: {
//                 name: address.name,
//                 altPhone: address.mobile,
//                 pinCode: address.pincode,
//                 locality: address.locality,
//                 address: address.address,
//                 city: address.city,
//                 state: address.state,
//                 landmark: address.landMark,
//                 postoffice: address.postOffice,
//                 addressType: address.addressType
//             },
//             couponDetails: {
//                 discountPercentage,
//                 claimedAmount,
//                 couponId,
//                 minPurchaseAmount: coupon ? coupon.minPurchaseAmount : 0,
//                 maxDiscountAmount: coupon ? coupon.maxRedeemAmount : 0,
//             }
//         });

//         if (paymentMethod === 'Wallet Payment') {
//             const wallet = await Wallet.findOne({ userId });
//             if (!wallet || wallet.balance < grandTotal) {
//                 return res.status(400).json({ message: "Insufficient wallet balance" });
//             }

//             console.log(`Wallet balance before deduction: ${wallet.balance}`);

//             // Deduct from wallet balance and record the transaction
//             wallet.balance -= grandTotal;
//             wallet.transactions.push({
//                 amount: grandTotal,
//                 transactionMethod: 'Purchase'
//             });
//             await wallet.save();
//         }

//         const savedOrder = await newOrder.save();
//         // await Cart.deleteOne({ userId: userId });

//         if (paymentMethod === 'COD' || paymentMethod === 'Wallet Payment') {
//             return res.status(200).json({ orderId: savedOrder._id, success: 'Order placed successfully' });
//         }

//         // instance of Razorpay
//         const instance = new Razorpay({
//             key_id: process.env.RAZOR_KEYID,
//             key_secret: process.env.RAZOR_KEYSECRET
//         });

//         // Creating Razorpay order
//         const razorpayOrder = await instance.orders.create({
//             amount: grandTotal * 100,
//             currency: 'INR',
//             receipt: savedOrder._id.toString(),
//             payment_capture: 1
//         });

//         savedOrder.razorpayOrder_id = razorpayOrder.id;
//         await savedOrder.save();

//         // await Cart.deleteOne({ userId: userId });

//         return res.status(200).json({ success: 'Ok', orderId: savedOrder._id, razorpayOrderId: razorpayOrder.id, grandTotal });
//     } catch (error) {
//         console.log("Error in placeOrder", error);
//         res.status(500).send("Server Error");
//     }
// };


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



// exports.verifyPayment = async (req, res, next) => {
//     try {
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
//         console.log(req.body);

//         const shasum = Crypto.createHmac('sha256', process.env.RAZOR_KEYSECRET);
//         shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
//         const digest = shasum.digest('hex');

//         if (digest === razorpay_signature) {

//             const updatedOrder = await Order.findByIdAndUpdate(order_id, {
//                 'orderItems.$[].orderStatus': 'Processing',
//                 razorPayment_id: razorpay_payment_id
//             }, { new: true });

//             if (!updatedOrder) {
//                 return res.status(404).json({ error: 'Order not found' });
//             }

//             await Cart.deleteOne({ userId: updatedOrder.userId });

//             return res.status(200).json({ order_id, success: 'Payment successful and Order placed' });
//         } else {
//             await Order.findByIdAndUpdate(order_id, {
//                 paymentStatus: 'Failed'
//             });

//             return res.status(400).json({ error: 'Payment verification failed' });
//         }
//     } catch (error) {
//         next(error);
//     }
// };


exports.invoice = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        console.log("Order ID:", orderId);
        const orderDetails = await Order.findById(orderId).populate({
            path: 'orderItems.variantId',
            model: "Varients"}).populate('userId');
        console.log("ORDER DETAILS    :    ",orderDetails);

        if (!orderDetails) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument();
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdfData);
        });

        doc.fontSize(18).text(`Invoice`, { align: 'center' });
        doc.fontSize(12).text(`Order Date: ${new Date(orderDetails.orderDate).toDateString()}`, { align: 'center' });

        // Add more space between the "Invoice" text and the order details
        doc.moveDown().moveDown();

        let y = 150; // Initialize y before using it

        doc.fontSize(12)
            .text('Product', 50, y)
            .text('Quantity', 200, y)
            .text('Amount', 300, y)
            .text('Status', 400, y);
        y += 20;

        orderDetails.orderItems.forEach((item) => {
            doc.fontSize(10)
                .text(item.variantName, 50, y)
                .text(item.quantity, 200, y)
                .text(`${item.variantPrice}`, 300, y)
                .text(item.orderStatus, 400, y);
            y += 20;
        });

        // Increase y to add space between product details and order summary
        y += 20;

        doc.fontSize(16).text('Order Summary', 50, y);
        y += 20;
        doc.fontSize(12)
            .text(`Order Status: ${orderDetails.orderItems[0].orderStatus}`, 50, y)
            .text(`Payment Method: ${orderDetails.paymentMethod}`, 50, y + 20)
            .text(`Sub Total: ${orderDetails.subTotal}`, 50, y + 40)
            .text(`Shipping Charge: ${orderDetails.deliveryCharge}`, 50, y + 60)
            .text(`Total Amount: ${orderDetails.grandTotal}`, 50, y + 80);

        // Move y further down to start the user address section
        y += 120;

        doc.fontSize(16).text('User Address', 300, y);
        y += 20;
        doc.fontSize(12)
            .text(`Name: ${orderDetails.shippingAddress.name}`, 300, y)
            .text(`Mobile: ${orderDetails.shippingAddress.altPhone}`, 300, y + 20)
            .text(`City: ${orderDetails.shippingAddress.city}`, 300, y + 40)
            .text(`Address: ${orderDetails.shippingAddress.landmark}, ${orderDetails.shippingAddress.postoffice}`, 300, y + 60)
            .text(`State: ${orderDetails.shippingAddress.state}`, 300, y + 80)
            .text(`Pincode: ${orderDetails.shippingAddress.pinCode}`, 300, y + 100);

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Internal Server Error');
    }
};



