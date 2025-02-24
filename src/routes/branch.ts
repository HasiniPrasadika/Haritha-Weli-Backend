import { Router } from "express";
import authRoutes from "./auth";
import authMiddleware from "../middlewares/auth";
import adminMiddleware from "../middlewares/admin";
import { errorHandler } from "../error-handler";
import { addProductsToBranch, assignAgent, assignRep, createBranch, listBranches } from "../controllers/branch";

const branchRoutes:Router = Router()

branchRoutes.post('/', [authMiddleware, adminMiddleware], errorHandler(createBranch))
branchRoutes.get('/', errorHandler(listBranches));
branchRoutes.post('/products', [authMiddleware, adminMiddleware], errorHandler(addProductsToBranch))
branchRoutes.post('/agent', [authMiddleware, adminMiddleware], errorHandler(assignAgent))
branchRoutes.post('/rep', [authMiddleware, adminMiddleware], errorHandler(assignRep))

export default branchRoutes