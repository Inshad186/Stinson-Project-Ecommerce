const Address = require("../../models/addressModel")
const Cart = require("../../models/cartModel")
const Order = require("../../models/orderModel")
const Crypto = require("crypto")
const Razorpay = require("razorpay")



// instance.orders.create({
// amount: 50000,
// currency: "INR",
// receipt: "receipt#1",
// notes: {
//     key1: "value3",
//     key2: "value2"
// }
// })

exports.viewOrder = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const orderId = req.query.orderId;

        const authCheck = await Order.findOne({ userId: userId, _id: orderId }).select('userId');

        if (authCheck) {
            const orderInfo = await Order.findOne({ _id: orderId })

            const address = await Address.findOne({ userId: userId });

            res.render('users/order', { orders: orderInfo, address: address });
        } else {
            return res.status(400).json({ error: 'Invalid operation' });
        }
    } catch (error) {
        next(error);
    }
};



exports.placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, paymentMethod } = req.body;

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

        const subTotal = orderItems.reduce((acc, item) => acc + item.variantPrice * item.quantity, 0);
        const deliveryCharge = 50;
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
            }
        });

        const savedOrder = await newOrder.save();
        console.log("NEW  ORDER  :: ", newOrder);

        if (paymentMethod === 'COD') {
            await Cart.deleteOne({ userId: userId });
            return res.status(200).json({ orderId: savedOrder._id, success: 'Order placed successfully' });
        }

        //creating a new instance of razorpay
        const instance = new Razorpay({
            key_id: process.env.RAZOR_KEYID,
            key_secret: process.env.RAZOR_KEYSECRET
        })

        //CREATING RAZORPAY ORDER
        const razorpayOrder = await instance.orders.create({
            amount: grandTotal * 100,
            currency: 'INR',
            receipt: savedOrder._id.toString(),
            payment_capture: 1
        });
        console.log("RAZARPAY   ORDER  :",razorpayOrder);
        // Update the order with the Razorpay order ID
        savedOrder.razorpayOrder_id = razorpayOrder.id;
        await savedOrder.save();

        const deleteee = await Cart.deleteOne({ userId: userId });
        console.log("DELETE  :  ", deleteee);

        return res.status(200).json({ success: 'Ok', orderId: savedOrder._id, razorpayOrderId: razorpayOrder.id, grandTotal });
    } catch (error) {
        console.log("Error in placeOrder", error);
        res.status(500).send("Server Error");
    }
};



exports.verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
        console.log(req.body); // Log the entire request body for debugging

        const shasum = Crypto.createHmac('sha256', process.env.RAZOR_KEYSECRET);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        // CHECKING PAYMENT IS VERIFIED
        if (digest === razorpay_signature) {
            // UPDATING FIELD
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


