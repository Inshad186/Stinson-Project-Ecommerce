const Address = require("../../models/addressModel")
const Cart = require("../../models/cartModel")
const Order = require("../../models/orderModel")
const Coupon = require("../../models/couponModel")
const Crypto = require("crypto")
const Razorpay = require("razorpay")




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

        console.log("ORDER INFOOOOOOO  :  ",orderInfo);

        if (!orderInfo) {
            return res.status(400).json({ error: 'Invalid operation' });
        }

        let subTotal = 0;
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
                console.log("Discount Percentage  :  ",discountPercentage);

                claimedAmount = Math.min(subTotal * (discountPercentage / 100), coupon.maxRedeemAmount);
                console.log("Claimed Amount  :  ",claimedAmount);

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
        const savedOrder = await newOrder.save();

        if (paymentMethod === 'COD') {
            await Cart.deleteOne({ userId: userId });
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

        await Cart.deleteOne({ userId: userId });

        return res.status(200).json({ success: 'Ok', orderId: savedOrder._id, razorpayOrderId: razorpayOrder.id, grandTotal });
    } catch (error) {
        console.log("Error in placeOrder", error);
        res.status(500).send("Server Error");
    }
};




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
                razorPayment_id: razorpay_payment_id
            }, { new: true });

            if (!updatedOrder) {
                return res.status(404).json({ error: 'Order not found' });
            }

            return res.status(200).json({ order_id, success: 'Payment successful and Order placed' });
        } else {
            return res.status(400).json({ error: 'Payment verification failed' });
        }
    } catch (error) {
        next(error);
    }
};


