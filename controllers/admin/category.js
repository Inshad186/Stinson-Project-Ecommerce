const category = require('../../models/categoryModel')

exports.viewAddCategory = async (req, res) => {
    try {
        res.render("admin/addCategory")
    } catch (error) {
        console.log(error.message);
    }
}



exports.addCategory = async (req, res) => {
    try {

        const { name,description } = req.body;

        const existingCategory = await category.findOne({ name: new RegExp('^' + name + '$', 'i') });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category already exist" })
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Image upload failed" });
        }

        const image = `/admin/uploads/category/${req.file.filename}`

        console.log(">>>>>>>>>>>>>>     image     <<<<<<<<<<<<<<<<",image);

        const categoryData = new category({
            name: name,
            image: image,
            description: description
        });
        console.log(">>>>>>>>>>>>>>     categoryData     <<<<<<<<<<<<<<<<",categoryData);

        const savedCategory = await categoryData.save();

        console.log(">>>>>>>>>>>>>>     SAVED CATEGORY     <<<<<<<<<<<<<<<<",savedCategory);

        res.status(200).json({ success: true, message: "Category added successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



exports.viewCategoryList = async (req, res) => {
    try {
        const categoryList = await category.find({})
        const showPagination = categoryList.length
        res.render("admin/categoryList", { categoryList: categoryList,showPagination })
    } catch (error) {
        console.log(error.message);
    }
}



exports.deleteCategory = async (req, res) => {
    try {
        const categories = await category.findOne({ _id: req.body.categoryId })
        if (!categories) {
            return res.status(404).json({ success: false, message: "category not found" });
        }
        categories.is_Delete = !categories.is_Delete
        const saveData = await categories.save()
        res.status(200).json({ success: true, categoryState: saveData.is_Delete })
    } catch (error) {
        console.log(error.message);
    }
}



exports.viewEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryID;
        const categoryToEdit = await category.findById(categoryId);
        res.render("admin/editCategory", { categoryToEdit })

    } catch (error) {
        console.log(error.message);
    }
}



exports.editCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryID;
        const oldCategory = await category.findById(categoryId);
        
        if (!oldCategory) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }

        const { name, description } = req.body;
        const updateData = {};
        let isUpdated = false;

        if (name && name.trim() !== '') {
            const trimmedName = name.trim();
            if (trimmedName.toLowerCase() !== oldCategory.name.toLowerCase()) {
                const existingCategory = await category.findOne({ name: new RegExp(`^${trimmedName}$`, 'i') });
                if (existingCategory && existingCategory._id.toString() !== categoryId) {
                    return res.status(400).json({ success: false, message: "A category with this name already exists." });
                } else {
                    updateData.name = trimmedName;
                    isUpdated = true;
                }
            }
        }

        if (description && description.trim() !== oldCategory.description.trim()) {
            updateData.description = description.trim();
            isUpdated = true;
        }

        if (req.file) {
            const image = `/admin/uploads/category/${req.file.filename}`;
            updateData.image = image;
            isUpdated = true;
        }

        if (!isUpdated) {
            return res.status(400).json({ success: false, message: "You need to update at least one field." });
        }

        const updatedCategory = await category.findByIdAndUpdate(categoryId, { $set: updateData }, { new: true });

        res.json({ success: true, category: updatedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};




