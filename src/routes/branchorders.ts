import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import agentMiddleware from "../middlewares/agent";
import { errorHandler } from "../error-handler";
import { createAgentOrder, getAgentBranchProducts } from "../controllers/agentorder";


const branchOrderRoutes: Router = Router()

branchOrderRoutes.post('/orders', [authMiddleware, agentMiddleware], errorHandler(createAgentOrder))
branchOrderRoutes.get('/branch-products', [authMiddleware, agentMiddleware], errorHandler(getAgentBranchProducts))

export default branchOrderRoutes