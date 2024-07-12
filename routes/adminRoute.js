const express = require("express")
const router = express.Router()

const loadSignin = require("../controllers/admin/signin")
const loadDashboard = require("../controllers/admin/dashboard")
const loadProduct = require("../controllers/admin/product")
const loadUserList = require("../controllers/admin/user")
const loadCategory = require('../controllers/admin/category')
const varient = require("../controllers/admin/varients")
const adminAuth = require("../middleware/adminMiddleware")
const loadOrder = require("../controllers/admin/order")
const loadCoupon = require("../controllers/admin/coupons")


const generateStorage = require("../utils/multer")
const { route } = require("./userRoute")
const upload = generateStorage('category');

router.get("/signin",adminAuth.isUnAuthenticated,loadSignin.signin)
router.post("/signin",adminAuth.isUnAuthenticated,loadSignin.verifySignin)

router.get("/dashboard" ,adminAuth.isAuthenticated ,loadDashboard.Dashboard)

router.get("/userList",adminAuth.isAuthenticated,loadUserList.user)

router.post("/blockUser",loadUserList.blockUser)

router.get("/addCategory",adminAuth.isAuthenticated ,loadCategory.viewAddCategory)
router.post("/addCategory",adminAuth.isAuthenticated ,upload.single("image"),loadCategory.addCategory)

router.get("/categoryList" ,adminAuth.isAuthenticated ,loadCategory.viewCategoryList)
router.post("/deleteCategory",adminAuth.isAuthenticated ,loadCategory.deleteCategory)

router.get("/editCategory/:categoryID" ,adminAuth.isAuthenticated ,loadCategory.viewEditCategory)
router.post("/editCategory/:categoryID" ,adminAuth.isAuthenticated , upload.single("image"), loadCategory.editCategory);

router.get("/productList",adminAuth.isAuthenticated ,loadProduct.productList)
router.post("/deleteProduct" ,adminAuth.isAuthenticated ,loadProduct.deleteProduct)

router.get("/addProduct" ,adminAuth.isAuthenticated ,loadProduct.addProduct)
router.post("/addProduct" ,adminAuth.isAuthenticated ,upload.single("image"),loadProduct.insertProduct)

router.get("/editProduct/:productId" ,adminAuth.isAuthenticated ,loadProduct.viewEditProduct);
router.post("/editProduct/:productId" ,adminAuth.isAuthenticated ,upload.single("image"),loadProduct.editProduct)

router.get("/loadVarients/:productId" ,adminAuth.isAuthenticated , varient.loadvarients);
router.post("/loadVarients/:productId" ,adminAuth.isAuthenticated , upload.any(), varient.addVarients);

router.get("/editVariant/:productId" ,adminAuth.isAuthenticated ,varient.viewEditVariant)
router.post("/editVariant/:productId" ,adminAuth.isAuthenticated ,upload.any(),varient.editVariant)
router.post("/deleteVariant" ,adminAuth.isAuthenticated ,varient.deleteVariant)

router.get("/productDetail" ,adminAuth.isAuthenticated ,loadProduct.viewProductDetails)

router.get("/order" ,adminAuth.isAuthenticated ,loadOrder.loadOrder)

router.get("/coupons" ,adminAuth.isAuthenticated ,loadCoupon.couponsList)
router.get("/addCoupon" ,adminAuth.isAuthenticated , loadCoupon.viewAddCoupons)
router.post('/addCoupon' ,adminAuth.isAuthenticated , loadCoupon.addCoupon)

router.get("/editCoupon" ,adminAuth.isAuthenticated ,loadCoupon.viewEditCoupon )
router.post("/editCoupon" ,adminAuth.isAuthenticated ,loadCoupon.editCoupon)
router.patch("/deleteCoupon" ,adminAuth.isAuthenticated ,loadCoupon.deleteCoupon)

module.exports = router;