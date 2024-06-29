const Address = require("../../models/addressModel")
const Cart = require("../../models/cartModel")
const Order = require("../../models/orderModel")

// exports.viewOrder = async (req, res) => {
//     try {
//         console.log("gumonnnnnnndskjfksadjflaksjdfasfjdlksdjfklsajdfasjfdasjdasjdasjdkkkkkkkkkkkkkkkkkkkkkk");
//         const userId = req.session.userId;
//         const addressId = req.query.addressId;
//         console.log("viewOrder - userId:", userId, "viewOrder - - addressId:", addressId);

//         if (!userId) {
//             return res.status(401).send("User not authenticated")
//         }
//         const orders = await Order.findOne({ userId: userId }).populate('orderItems.variantId');
//         const address = await Address.findOne({ userId: userId });

//         console.log("viewOrder - orders:", orders);
//         console.log("viewOrder - address:", address);

//         res.render("users/order", { orders, address });
//     } catch (error) {
//         console.log("error in viewOrder", error);
//         res.status(500).send("Server Error");
//     }
// }

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
                addressType: address.addressType
            }
        });

        const savedOrder = await newOrder.save();
        console.log("NEW  ORDER  :: ",newOrder);

      const deleteee =  await Cart.deleteOne({ userId:userId });
      console.log("DELETE  :  ",deleteee);

      return res.status(200).json({success:'Ok',orderId:savedOrder._id})
    } catch (error) {
        console.log("Error in placeOrder", error);
        res.status(500).send("Server Error");
    }
};



