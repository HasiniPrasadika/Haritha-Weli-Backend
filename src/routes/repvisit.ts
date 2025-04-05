import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { errorHandler } from "../error-handler";
import { addItemToCart, changeQuantity, deleteItemFromCart, getCart } from "../controllers/cart";
import salesRepMiddleware from "../middlewares/rep";
import { createVisit, deleteVisit, getVisitById, getVisitsByBranch, getVisitsBySalesRep, updateVisit } from "../controllers/repvisit";
import adminAgentRepMiddleware from "../middlewares/admin-agent-rep";

const visitRoutes:Router = Router()

visitRoutes.post('/',[authMiddleware, adminAgentRepMiddleware], errorHandler(createVisit))
visitRoutes.get('/branch/:id',[authMiddleware, adminAgentRepMiddleware], errorHandler(getVisitsByBranch))
visitRoutes.get('/salesrep/:id',[authMiddleware, adminAgentRepMiddleware], errorHandler(getVisitsBySalesRep))
visitRoutes.get('/:id',[authMiddleware, adminAgentRepMiddleware], errorHandler(getVisitById))

visitRoutes.delete('/:id', [authMiddleware, adminAgentRepMiddleware], errorHandler(deleteVisit))
visitRoutes.put('/:id', [authMiddleware, adminAgentRepMiddleware], errorHandler(updateVisit))



export default visitRoutes