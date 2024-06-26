const Cart = require("../../models/cartModel");
const Variant = require("../../models/varientModel"); 

exports.viewCart = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const cart = await Cart.findOne({ userId }).populate({
            path: 'products.productVariantId',
            select: 'size salePrice stock colour image productName categoryName',
            populate: {
                path: 'productId',
                model: 'Product',
                select: 'categoryId'
            }
        });

        res.render('users/cart', { cart });

    } catch (error) {
        console.error("Error in viewCart", error);
        next(error);
    }
};



// exports.addToCart = async (req, res, next) => {
//     try {
//         const userId = req.session.userId;
//         const { variantId, size } = req.body;

//         if (!userId) {
//             return res.status(401).json({ error: 'User not authenticated' });
//         }

//         if (!variantId || !size) {
//             return res.status(400).json({ error: 'Variant ID and size are required' });
//         }

//         let cart = await Cart.findOne({ userId });

//         if (!cart) {
//             cart = new Cart({ userId, products: [] });
//         }

//         const existingProductIndex = cart.products.findIndex(product => product.productVariantId.toString() === variantId && product.size === size);

//         if (existingProductIndex >= 0) {
//             // If product already exists, return a message
//             return res.status(200).json({ message: 'Product is already in the cart' });
//         } else {
//             // If product does not exist, add it to the cart
//             cart.products.push({ productVariantId: variantId, size, quantity: 1 });
//         }

//         await cart.save();

//         res.status(200).json({ message: 'Item added to cart successfully' });
//     } catch (error) {
//         console.error("Error in addToCart", error);
//         next(error);
//     }
// };



exports.addToCart = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const { variantId, size } = req.body;
        const cart = await Cart.findOne({userId: userId});

        console.log(`User ID: ${userId}, Variant ID: ${variantId}, Size: ${size}`);

        if (!userId || !variantId || !size) {
            return res.status(400).json({ error: 'User ID, Variant ID, and size are required' });
        }
        const variantData = await Variant.findById(variantId);
        const sizeIndex = variantData.size.indexOf(size);
        console.log(sizeIndex)
        if (!variantData) {
            return res.status(400).json({ error: 'Variant not found' });
        }
        if (variantData.is_Delete) {
            return res.status(400).json({ error: 'Sorry, the product is unavailable!' });
        }
        if (variantData.stock[sizeIndex] <= 0) {
            return res.status(400).json({ error: 'Sorry, the product is out of stock!' });
        }

        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({ userId, products: [] });
        }
        // Check if the product variant with the specified size is already in the cart
        // const variantExist = cart.products.find(product => 
        //     product.productVariantId.toString() === variantId && product.size === size
        // );
        const variantExist = await Cart.findOne({
            'products': {
                $elemMatch: {
                    productVariantId: variantData._id
                }
            },
            userId: userId
        });
        if (variantExist) {
            return res.status(400).json({ error: "Product already exists in the cart" });
        }
        // Add new product variant to the cart
        cart.products.push({ productVariantId: variantId, size, quantity: 1 });
        await cart.save();

        console.log(`Product added to cart: ${variantId}, Size: ${size}`);
        
        return res.status(200).json({ success: "Product added to cart", cart: cart });

    } catch (error) {
        console.error("Error in addToCart", error);
        next(error);
    }
};




exports.removeCart = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ error: 'User ID and Product ID are required' });
        }
        // Find the user's cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(400).json({ error: 'Cart not found' });
        }
        // Find the index of the product to remove
        const productIndex = cart.products.findIndex(product => 
            product.productVariantId.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(400).json({ error: 'Product not found in cart' });
        }
        // Remove the product from the cart
        cart.products.splice(productIndex, 1);
        await cart.save();

        return res.status(200).json({ message: 'Product removed from cart', cart });

    } catch (error) {
        console.error("Error in removeFromCart", error);
        next(error);
    }
};








