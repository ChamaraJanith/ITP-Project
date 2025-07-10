import mongoose from "mongoose";
import Product from "../models/product.model.js";
import dotenv from "dotenv";
dotenv.config();


export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while fetching products" });
    }
};

export const createProduct = async (req, res) => {
    // Destructure the fields from req.body
    const { name, price, description, imageUrl } = req.body;

    // Validate all fields
    if (!name || !price || !description || !imageUrl) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Create a new product using the Product model
    const newProduct = new Product({ name, price, description, imageUrl });

    try {
        await newProduct.save();
        res.status(201).json({ success: true, data: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const updateProduct =async (req, res) => {
    const { id } = req.params;
    const product = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Product Not found" });
    }
    try {
        const updatedProduct = await Product.findByIdAndUpdate(id,product, { new: true });
        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while updating product" });
    }
    
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while deleting product" });
    

}
};
