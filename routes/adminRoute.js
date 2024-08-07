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
const loadOffer = require("../controllers/admin/offer")


const generateStorage = require("../utils/multer")
const { route } = require("./userRoute")
const upload = generateStorage('category');

router.get("/signin",adminAuth.isUnAuthenticated,loadSignin.signin)
router.post("/signin",adminAuth.isUnAuthenticated,loadSignin.verifySignin)

router.get("/dashboard" ,adminAuth.isAuthenticated ,loadDashboard.Dashboard)
router.get('/chart-data', adminAuth.isAuthenticated, loadDashboard.getChartData);

router.get("/userList",adminAuth.isAuthenticated,loadUserList.user)

router.post("/blockUser",loadUserList.blockUser)

router.get("/addCategory",adminAuth.isAuthenticated ,loadCategory.viewAddCategory)
router.post("/addCategory",adminAuth.isAuthenticated ,upload.single("image"),loadCategory.addCategory)

router.get("/categoryList" ,adminAuth.isAuthenticated ,loadCategory.viewCategoryList)
router.post("/deleteCategory",adminAuth.isAuthenticated ,loadCategory.deleteCategory)

router.get("/editCategory" ,adminAuth.isAuthenticated ,loadCategory.viewEditCategory)
router.post("/editCategory" ,adminAuth.isAuthenticated , upload.single("image"), loadCategory.editCategory);

router.get("/productList",adminAuth.isAuthenticated ,loadProduct.productList)
router.post("/deleteProduct" ,adminAuth.isAuthenticated ,loadProduct.deleteProduct)

router.get("/addProduct" ,adminAuth.isAuthenticated ,loadProduct.addProduct)
router.post("/addProduct" ,adminAuth.isAuthenticated ,upload.single("image"),loadProduct.insertProduct)

router.get("/editProduct" ,adminAuth.isAuthenticated ,loadProduct.viewEditProduct);
router.post("/editProduct" ,adminAuth.isAuthenticated ,upload.single("image"),loadProduct.editProduct)

router.get("/loadVarients/:productId" ,adminAuth.isAuthenticated , varient.loadvarients);
router.post("/loadVarients/:productId" ,adminAuth.isAuthenticated , upload.any(), varient.addVarients);

router.get("/editVariant" ,adminAuth.isAuthenticated ,varient.viewEditVariant)
router.post("/editVariant" ,adminAuth.isAuthenticated ,upload.any(),varient.editVariant)
router.post("/deleteVariant" ,adminAuth.isAuthenticated ,varient.deleteVariant)

router.get("/productDetail" ,adminAuth.isAuthenticated ,loadProduct.viewProductDetails)

router.get("/order" ,adminAuth.isAuthenticated ,loadOrder.loadOrder)
router.get("/orderDetail", adminAuth.isAuthenticated, loadOrder.loadOrderDetails)
router.post('/updateOrderStatus', adminAuth.isAuthenticated, loadOrder.updateOrderStatus)

router.get("/coupons" ,adminAuth.isAuthenticated ,loadCoupon.couponsList)
router.get("/addCoupon" ,adminAuth.isAuthenticated , loadCoupon.viewAddCoupons)
router.post('/addCoupon' ,adminAuth.isAuthenticated , loadCoupon.addCoupon)

router.get("/editCoupon" ,adminAuth.isAuthenticated ,loadCoupon.viewEditCoupon )
router.post("/editCoupon" ,adminAuth.isAuthenticated ,loadCoupon.editCoupon)
router.patch("/deleteCoupon" ,adminAuth.isAuthenticated ,loadCoupon.deleteCoupon)

router.get("/offer", adminAuth.isAuthenticated, loadOffer.viewOfferList)
router.get("/addOffer", adminAuth.isAuthenticated, loadOffer.viewAddOffer)
router.post("/addOffer", adminAuth.isAuthenticated, loadOffer.addOffer)

router.get("/editOffer", adminAuth.isAuthenticated, loadOffer.viewEditOffer)
router.post("/editOffer", adminAuth.isAuthenticated, loadOffer.editOffer)
router.patch("/deleteOffer", adminAuth.isAuthenticated, loadOffer.deleteOffer)

router.get("/salesReport", adminAuth.isAuthenticated, loadOrder.viewSalesReport)
router.get('/salesReport/download-excel', adminAuth.isAuthenticated, loadOrder.downloadExcel);
router.get("/pdfDownload", adminAuth.isAuthenticated, loadOrder.downloadPdf);

module.exports = router;