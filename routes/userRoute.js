const express = require("express");
const router = express.Router();

router.use(express.static('public/users/assets'));

const loadSignup = require("../controllers/users/signup");
const loadHome = require("../controllers/users/home");
const loadshopList = require("../controllers/users/shop")
const userAuth = require("../middleware/userMiddleware")


router.get("/", loadHome);

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


module.exports = router;
