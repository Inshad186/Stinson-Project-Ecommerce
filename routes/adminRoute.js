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

router.get("/dashboard",loadDashboard.Dashboard)

router.get("/userList",loadUserList.user)

router.post("/blockUser",loadUserList.blockUser)

router.get("/addCategory",loadCategory.viewAddCategory)
router.post("/addCategory",upload.single("image"),loadCategory.addCategory)

router.get("/categoryList",loadCategory.viewCategoryList)
router.post("/deleteCategory",loadCategory.deleteCategory)

router.get("/editCategory/:categoryID",loadCategory.viewEditCategory)
router.post("/editCategory/:categoryID", upload.single("image"), loadCategory.editCategory);

router.get("/productList",loadProduct.productList)
router.post("/deleteProduct",loadProduct.deleteProduct)

router.get("/addProduct",loadProduct.addProduct)
router.post("/addProduct",upload.single("image"),loadProduct.insertProduct)

router.get("/editProduct/:productId", loadProduct.viewEditProduct);
router.post("/editProduct/:productId",upload.single("image"),loadProduct.editProduct)

router.get("/loadVarients/:productId", varient.loadvarients);
router.post("/loadVarients/:productId", upload.any(), varient.addVarients);

router.get("/editVariant/:productId",varient.viewEditVariant)
router.post("/editVariant/:productId", upload.any(),varient.editVariant)
router.post("/deleteVariant",varient.deleteVariant)

router.get("/productDetail",loadProduct.viewProductDetails)

router.get("/order",loadOrder.loadOrder)

router.get("/coupons",loadCoupon.couponsList)
router.get("/addCoupon", loadCoupon.viewAddCoupons)
router.post('/addCoupon', loadCoupon.addCoupon)

router.get("/editCoupon", loadCoupon.viewEditCoupon )
router.post("/editCoupon", loadCoupon.editCoupon)

module.exports = router;