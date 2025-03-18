import { Router } from "express";
import {
  approveStockRequest,
  createStockRequest,
  deleteStockRequest,
  getAllStockRequests,
  getBranchStockRequests,
  getStockRequestDetails,
  markStockAsDelivered,
  receiveStock,
  updateStockRequest
} from "../controllers/stockrequest";
import authMiddleware from "../middlewares/auth";
import agentMiddleware from "../middlewares/agent";
import { errorHandler } from "../error-handler";
import adminMiddleware from "../middlewares/admin";
import adminAgentMiddleware from "../middlewares/admin-agent";

const stockRoutes:Router = Router()

// Routes for agents
stockRoutes.post("/create", [authMiddleware, agentMiddleware], errorHandler(createStockRequest));
stockRoutes.get("/branch", [authMiddleware, agentMiddleware],errorHandler(getBranchStockRequests));
stockRoutes.post("/:requestId/receive", [authMiddleware, agentMiddleware], errorHandler(receiveStock));
stockRoutes.put("/:requestId", [authMiddleware, agentMiddleware], errorHandler(updateStockRequest));

// Routes for admins
stockRoutes.get("/all", [authMiddleware, adminMiddleware], getAllStockRequests);
stockRoutes.post("/:requestId/approve", [authMiddleware, adminMiddleware], errorHandler(approveStockRequest));
stockRoutes.post("/:requestId/deliver", [authMiddleware, adminMiddleware], errorHandler(markStockAsDelivered));

// Routes for both agents and admins
stockRoutes.get("/:requestId", [authMiddleware, adminAgentMiddleware], errorHandler(getStockRequestDetails));
stockRoutes.delete("/:requestId", [authMiddleware, adminAgentMiddleware], errorHandler(deleteStockRequest));

export default stockRoutes;

/* How the System Works

Agent Creates Request:

When a branch product's stock is low/out, the agent creates a stock refill request
The agent specifies the products and quantities needed


Admin Receives Notification:

Admin can view all pending stock requests
Admin can approve/reject the request
When approving, admin specifies approved quantities (may differ from requested)


Admin Ships Products:

After approval, admin physically sends products to the branch
Admin marks the request as "DELIVERED" in the system


Agent Receives Products:

Agent physically receives the products
Agent confirms receipt in the system, specifying actual quantities received
System automatically updates branch stock and admin stock


Request Completed:

The process is complete, and the stock levels are updated*/