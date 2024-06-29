const Cart = require("../../models/cartModel");
const Variant = require("../../models/varientModel"); 
const Address = require("../../models/addressModel")

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



exports.addToCart = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const { variantId, size } = req.body;
        let cart = await Cart.findOne({userId: userId});

        console.log(`User ID: ${userId}, Variant ID: ${variantId}, Size: ${size}`);

        if (!userId || !variantId || !size) {
            return res.status(400).json({ error: 'User ID, Variant ID, and size are required' });
        }

        const variantData = await Variant.findById(variantId);
        if (!variantData) {
            return res.status(400).json({ error: 'Variant not found' });
        }

        const sizeIndex = variantData.size.indexOf(size);
        if (sizeIndex === -1) {
            return res.status(400).json({ error: 'Size not found' });
        }
        console.log("My size Index - ",sizeIndex)

        if (variantData.is_Delete) {
            return res.status(400).json({ error: 'Sorry, the product is unavailable!' });
        }

        if (variantData.stock[sizeIndex] <= 0) {
            return res.status(400).json({ error: 'Sorry, the product is out of stock!' });
        }

        if (!cart) {    
            cart = new Cart({ userId, products: [] });
        }
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
     
        cart.products.push({ productVariantId: variantId, size, quantity: 1 });
        await cart.save();

        console.log(`Product added to cart: ${variantId}, Size: ${size}`);
        
        return res.status(200).json({ success: "Product added to cart", cart: cart });

    } catch (error) {
        console.error("Error in addToCart", error);
        next(error);
    }
};



exports.updateCartQuantity = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const { variantId, size, quantity } = req.body;
        
        console.log(`Userrr ID: ${userId}, Variant ID: ${variantId}, Size: ${size}, Quantity : ${quantity} `);

        if (!userId || !variantId || !size || !quantity) {
            return res.status(400).json({ error: 'User ID, Variant ID, size, and quantity are required' });
        }

        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(400).json({ error: 'Cart not found' });
        }

        const product = cart.products.find(product => 
            product.productVariantId.equals(variantId)
        );
        if (!product) {
            return res.status(400).json({ error: 'Product not found in cart' });
        }

        product.quantity = quantity;
        await cart.save();

        return res.status(200).json({ success: 'Cart updated successfully', cart });
    } catch (error) {
        console.error("Error in updateCartQuantity", error);
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
       
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(400).json({ error: 'Cart not found' });
        }

        const productIndex = cart.products.findIndex(product => 
            product.productVariantId.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(400).json({ error: 'Product not found in cart' });
        }
     
        cart.products.splice(productIndex, 1);
        await cart.save();

        return res.status(200).json({ message: 'Product removed from cart', cart });

    } catch (error) {
        console.error("Error in removeFromCart", error);
        next(error);
    }
};



exports.viewCheckOut = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).send("User not authenticated");
        }
        const cartItem = await Cart.findOne({ userId }).populate({
            path: 'products.productVariantId',
            select: 'size salePrice stock colour image productName categoryName',
            populate: {
                path: 'productId',
                model: 'Product',
                select: 'categoryId'
            }
        });

        const addresses = await Address.find({ userId });

        if (!cartItem || cartItem.products.length === 0) {
            return res.status(400).redirect('/cart');
        }

        res.render("users/checkout", { cart: cartItem, addresses, selectedAddressId: req.query.addressId });
    } catch (error) {
        console.log("error in viewCheckOut", error);
        res.status(500).send("Server Error");
    }
};








