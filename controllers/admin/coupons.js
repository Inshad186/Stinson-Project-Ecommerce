
const Coupons = require("../../models/couponModel")

exports.viewAddCoupons = async(req,res)=>{
    try {
        res.render("admin/addCoupon")
    } catch (error) {
        console.log("Error in addCoupons", error);
        res.status(500).send("Server Error")
    }
}


exports.addCoupon = async (req, res) => {
    try {

        const { couponName, couponCode, discountPercentage, minPurchaseAmount, maxRedeemAmount, expiryDate } = req.body;
        console.log(req.body);

        const newCoupon = new Coupons({
            couponName: couponName,
            couponCode: couponCode,
            discountPercentage: discountPercentage,
            minPurchaseAmount: minPurchaseAmount,
            maxRedeemAmount: maxRedeemAmount,
            expiryDate: expiryDate,
            listed: true
        });
        const saveCoupon = await newCoupon.save();

        res.status(200).json({success:true , couponId: saveCoupon._id })
    } catch (error) {
        console.log("Error in createCoupon", error);
        res.status(500).send("Server Error");
    }
}


exports.couponsList = async(req,res)=>{
    try {
        const couponList = await Coupons.find({})
        console.log("Coupon List   :  ",couponList);
        res.render("admin/coupons", {couponList} )
    } catch (error) {
        console.log("Error in viewCoupons", error);
        res.status(500).send("Server Error")
    }
}


exports.viewEditCoupon = async(req,res)=>{
    try {
        const couponId = req.query.couponId;
        const couponToEdit = await Coupons.findById(couponId)
        res.render("admin/editCoupon" , {couponToEdit})
    } catch (error) {
        console.log("Error in editCoupon", error);
        res.status(500).send("Server Error")
    }
}


exports.editCoupon = async (req, res) => {
    try {
        console.log("Edit Coupon: ", req.query.couponId);
        const couponId = req.query.couponId; 
        const oldCoupon = await Coupons.findById(couponId);
        
        if (!oldCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        const { couponName, couponCode, discountPercentage, minPurchaseAmount, maxRedeemAmount, expiryDate } = req.body;
        const updateData = {};
        let isUpdated = false;

        if (couponName && couponName.trim() !== oldCoupon.couponName.trim()) {
            updateData.couponName = couponName.trim();
            isUpdated = true;
        }

        if (couponCode && couponCode.trim() !== oldCoupon.couponCode.trim()) {
            updateData.couponCode = couponCode.trim();
            isUpdated = true;
        }

        if (discountPercentage && discountPercentage !== oldCoupon.discountPercentage) {
            updateData.discountPercentage = discountPercentage;
            isUpdated = true;
        }

        if (minPurchaseAmount && minPurchaseAmount !== oldCoupon.minPurchaseAmount) {
            updateData.minPurchaseAmount = minPurchaseAmount;
            isUpdated = true;
        }

        if (maxRedeemAmount && maxRedeemAmount !== oldCoupon.maxRedeemAmount) {
            updateData.maxRedeemAmount = maxRedeemAmount;
            isUpdated = true;
        }

        if (expiryDate && expiryDate !== oldCoupon.expiryDate) {
            updateData.expiryDate = expiryDate;
            isUpdated = true;
        }

        if (!isUpdated) {
            return res.status(400).json({ success: false, message: "You need to update at least one field." });
        }

        const updatedCoupon = await Coupons.findByIdAndUpdate(couponId, { $set: updateData }, { new: true });

        res.json({ success: true, coupon: updatedCoupon });

    } catch (error) {
        console.log("Error in editCoupon", error);
        res.status(500).send("Server Error");
    }
};


exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupons.findOne({ _id: req.body.couponId });
        console.log("Coupon ID  : ", coupon);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        coupon.listed = !coupon.listed;
        const saveData = await coupon.save();
        return res.status(200).json({ success: true, couponState: saveData.listed });
        
    } catch (error) {
        console.log("Error in deleteCoupon", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};




