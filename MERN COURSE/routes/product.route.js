import e from "express";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import dotenv from "dotenv";
import { getAllProducts } from "../controller/product.controller.js";
import { createProduct } from "../controller/product.controller.js";
import { updateProduct } from "../controller/product.controller.js";
import { deleteProduct } from "../controller/product.controller.js";

const router = e.Router();

router.get("/",getAllProducts);

router.post("/",createProduct); 

router.put("/:id",updateProduct);

router.delete("/:id",deleteProduct);

export default router;
