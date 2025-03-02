import { Router } from "express";
import { errorHandler } from "../error-handler";
import { createProduct, deleteProduct, getProductById, listProducts, searchProducts, updateProduct } from "../controllers/products";
import authMiddleware from "../middlewares/auth";
import adminMiddleware from "../middlewares/admin";
import multer from "multer";


const upload = multer({ storage: multer.memoryStorage() });

const productsRoutes:Router = Router()

productsRoutes.post('/',[authMiddleware, adminMiddleware], errorHandler(createProduct))
// productsRoutes.post("/",[authMiddleware, adminMiddleware], upload.fields([{ name: "productImage" }, { name: "usageImage" }]), errorHandler(createProduct));

productsRoutes.put('/:id',[authMiddleware, adminMiddleware], errorHandler(updateProduct))
productsRoutes.delete('/:id',[authMiddleware, adminMiddleware], errorHandler(deleteProduct))
productsRoutes.get('/',[authMiddleware, adminMiddleware], errorHandler(listProducts))
productsRoutes.get('/search', [authMiddleware], errorHandler(searchProducts))
productsRoutes.get('/:id',[authMiddleware, adminMiddleware], errorHandler(getProductById))


// /search?q=""

export default productsRoutes