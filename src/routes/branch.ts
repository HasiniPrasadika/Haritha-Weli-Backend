import { Router } from "express";
import authRoutes from "./auth";
import authMiddleware from "../middlewares/auth";
import adminMiddleware from "../middlewares/admin";

import { errorHandler } from "../error-handler";
import { addProductsToBranch, assignAgent, assignRep, createBranch, deleteBranch, getBranchDetails, listAssignedProducts, listBranches, listUnassignedProducts, removeAgentFromBranch, removeRepFromBranch, updateBranch, updateBranchStock } from "../controllers/branch";
import agentMiddleware from "../middlewares/agent";
import adminAgentMiddleware from "../middlewares/admin-agent";


const branchRoutes:Router = Router()

branchRoutes.post('/', [authMiddleware, adminMiddleware], errorHandler(createBranch))
branchRoutes.put("/edit/:branchId", [authMiddleware, adminMiddleware], errorHandler(updateBranch));
branchRoutes.delete("/delete/:branchId", [authMiddleware, adminMiddleware], errorHandler(deleteBranch));
branchRoutes.get('/', errorHandler(listBranches));
branchRoutes.get('/unassigned-products/:branchId', [authMiddleware, adminMiddleware], errorHandler(listUnassignedProducts));
branchRoutes.get('/assigned-products/:branchId', errorHandler(listAssignedProducts));
branchRoutes.get('/details/:branchId', [authMiddleware, adminAgentMiddleware], errorHandler(getBranchDetails));
branchRoutes.post('/products', [authMiddleware, adminMiddleware], errorHandler(addProductsToBranch))
branchRoutes.post('/stock', [authMiddleware, adminAgentMiddleware], errorHandler(updateBranchStock))
branchRoutes.post('/agent', [authMiddleware, adminMiddleware], errorHandler(assignAgent))
branchRoutes.post('/rep', [authMiddleware, adminMiddleware], errorHandler(assignRep))
branchRoutes.delete("/remove-rep/:branchId", [authMiddleware, adminMiddleware], errorHandler(removeRepFromBranch));
branchRoutes.delete("/remove-agent/:branchId", [authMiddleware, adminMiddleware], errorHandler(removeAgentFromBranch));

export default branchRoutes