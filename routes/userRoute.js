const express = require("express");
const router = express.Router();

router.use(express.static('public/users/assets'));

const errorHandler = require("../middleware/errorHandler")
const loadSignup = require("../controllers/users/signup");
const loadHome = require("../controllers/users/home");
const loadshopList = require("../controllers/users/shop")
const userAuth = require("../middleware/userMiddleware")
const userDetail = require("../controllers/users/userProfile")
const loadCart = require("../controllers/users/cart")
const loadOrder = require("../controllers/users/order")


router.get("/", loadHome);

router.post("/google-authentication", loadSignup.googleSignin)

router.get("/signup", userAuth.isUnAuthenticated, loadSignup.loadSignup);
router.post("/signup", userAuth.isUnAuthenticated, loadSignup.insertUser);

router.get("/otp", loadSignup.loadOtp);
router.post("/resendOTP", loadSignup.resendOTP);
router.post("/otp", loadSignup.checkotp);

router.get("/login", userAuth.isUnAuthenticated, loadSignup.loadLogin);
router.post("/login", userAuth.isUnAuthenticated, loadSignup.verifyLogin);
router.get('/logout', loadSignup.logout);

router.get("/shopList", loadshopList.viewshopList)
router.get("/productDetail", loadshopList.productDetail);

router.get("/userProfile", userAuth.isAuthenticated,userDetail.viewUserProfile)
router.post("/updateUserProfile", userAuth.isAuthenticated,userDetail.updateUserProfile)
router.post("/insertAddress", userAuth.isAuthenticated,userDetail.insertAddress)
router.delete("/deleteAddress/:id", userAuth.isAuthenticated,userDetail.deleteAddress);
router.patch("/editAddress/:id", userAuth.isAuthenticated,userDetail.editAddress)
router.post("/changePassword", userAuth.isAuthenticated,userDetail.changePassword)
router.post("/applyCoupon", userAuth.isAuthenticated,userDetail.applyCoupon)
router.post('/cancelOrder',userAuth.isAuthenticated, userDetail.cancelOrder);
router.get("/transactions", userAuth.isAuthenticated, userDetail.getWalletTransactions)
router.post('/returnOrder',userAuth.isAuthenticated, userDetail.returnOrder);


router.post('/cart-add', userAuth.isAuthenticated, loadCart.addToCart);
router.get("/cart", userAuth.isAuthenticated, loadCart.viewCart);
router.delete("/cart-remove",userAuth.isAuthenticated , loadCart.removeCart)
router.post("/cart-update-quantity",userAuth.isAuthenticated , loadCart.updateCartQuantity)
router.get("/wishList", userAuth.isAuthenticated , loadCart.viewWishList)
router.post("/addWishList" ,userAuth.isAuthenticated ,loadCart.addWishList)
router.delete("/wishList-remove" ,userAuth.isAuthenticated, loadCart.removeWishList)
router.post('/addFromWishlist' , userAuth.isAuthenticated, loadCart.addToCartFromWishList)

router.get("/checkOut", userAuth.isAuthenticated , loadCart.viewCheckOut)

router.get("/order",userAuth.isAuthenticated , loadOrder.viewOrder)
router.get('/check-wallet-balance', userAuth.isAuthenticated, loadOrder.checkWalletBalance)
router.post('/place-order',userAuth.isAuthenticated , loadOrder.placeOrder)
router.post("/rePayment", userAuth.isAuthenticated, loadOrder.rePayment)
router.post("/payment-success", userAuth.isAuthenticated ,loadOrder.verifyPayment)
router.get("/userInvoice",userAuth.isAuthenticated, loadOrder.invoice)

router.use(errorHandler)

module.exports = router;

