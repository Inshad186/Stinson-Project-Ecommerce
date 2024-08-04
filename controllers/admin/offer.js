const Offer = require("../../models/offerModel")
const Category = require("../../models/categoryModel")
const Variant = require("../../models/varientModel")

exports.viewAddOffer = async(req, res)=>{
    try {
        const categories = await Category.find({is_Delete: false})
        const variants = await Variant.find({is_Delete: false})

        res.render("admin/addOffer",{categories, variants})
    } catch (error) {
        console.log("Error in viewAddOffer",error);
        res.status(500).send("Server Error")
    }
}

exports.addOffer = async(req, res)=>{
    try {
        const { offerName, offerType, discountPercentage, expiryDate, selectProduct, selectCategory } = req.body;
        console.log("REQ BODY",req.body);

        if(offerType==='Product Offer'){

        const authChek = await Variant.findById(selectProduct); 
        console.log("Selectedd  PRODUCTS   :  ",authChek);

        if (authChek) {      
        const existingOffer = await Offer.findOne({productID:selectProduct}).select('_id');

        if (existingOffer) {
        return res.status(400).json({error: 'Product have existing offer'});
        }else{

        const newOffer = new Offer({
        offerName : offerName,
        offerType : offerType,
        discountPercentage : discountPercentage,
        expiryDate : expiryDate,
        productID : selectProduct
        });

        const saveOffer = await newOffer.save();

        //UPDATE IN VARIANT FIELD
        await Variant.findByIdAndUpdate(selectProduct,
        {$set: {offerDiscount:discountPercentage, offerId:newOffer._id }},
       );
        return res.status(200).json({success: 'Offer added successfully'});            

        }
    }else{
    return res.status(404).json({error: 'Validation failed'});
     }
    }
    } catch (error) {
        console.log("Error in addOffer",error);
        res.status(500).send("Server Error")
    }
}



exports.viewOfferList = async(req, res)=>{
    try {
        const offerList = await Offer.find({})
        res.render("admin/offerList", {offerList})
    } catch (error) {
        console.log("Error in viewOfferList",error);
        res.status(500).send("Server Error")
    }
}


exports.viewEditOffer = async(req,res)=>{
    try {
        const offerId = req.query.offerId;
        const offerToEdit = await Offer.findById(offerId)
        res.render("admin/editOffer" , {offerToEdit})
    } catch (error) {
        console.log("Error in editCoupon", error);
        res.status(500).send("Server Error")
    }
}


exports.editOffer = async (req, res) => {
    try {
        console.log("Edit Offer: ", req.query.offerId);
        const offerId = req.query.offerId;
        const oldOffer = await Offer.findById(offerId);

        if (!oldOffer) {
            return res.status(404).json({ success: false, message: "Offer not found." });
        }

        const { offerName, offerType, discountPercentage, expiryDate } = req.body;
        const updateData = {};
        let isUpdated = false;

        if (offerName && offerName.trim() !== oldOffer.offerName.trim()) {
            updateData.offerName = offerName.trim();
            isUpdated = true;
        }

        if (offerType && offerType.trim() !== oldOffer.offerType.trim()) {
            updateData.offerType = offerType.trim();
            isUpdated = true;
        }

        if (discountPercentage && discountPercentage !== oldOffer.discountPercentage) {
            updateData.discountPercentage = discountPercentage;
            isUpdated = true;
        }

        if (expiryDate && expiryDate !== oldOffer.expiryDate) {
            updateData.expiryDate = expiryDate;
            isUpdated = true;
        }

        if (!isUpdated) {
            return res.status(400).json({ success: false, message: "You need to update at least one field." });
        }

        const updatedOffer = await Offer.findByIdAndUpdate(offerId, { $set: updateData }, { new: true });

        // UPDATE IN VARIANT FIELD if the discountPercentage is updated
        if (updateData.discountPercentage) {
            await Variant.findByIdAndUpdate(oldOffer.productId, {
                $set: { offerDiscount: updateData.discountPercentage }
            });
        }

        res.json({ success: true, offer: updatedOffer });
    } catch (error) {
        console.log("Error in editOffer", error);
        res.status(500).send("Server Error");
    }
};



exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findOne({ _id: req.body.offerId });
        console.log("Offer ID  : ", offer);

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        offer.listed = !offer.listed;
        const saveData = await offer.save();
        return res.status(200).json({ success: true, offerState: saveData.listed });
        
    } catch (error) {
        console.log("Error in deleteOffer", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};