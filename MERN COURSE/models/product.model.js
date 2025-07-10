import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
});

const Product = mongoose.model("Product", productSchema);
export default Product;