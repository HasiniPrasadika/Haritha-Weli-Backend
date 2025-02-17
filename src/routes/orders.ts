import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { errorHandler } from "../error-handler";
import { cancelOrder, changeStatus, createOrder, getOrderById, listAllOrders, listOrders, listUserOrders } from "../controllers/orders";
import adminMiddleware from "../middlewares/admin";
import { error } from "console";

const orderRoutes: Router = Router()

orderRoutes.post('/', [authMiddleware], errorHandler(createOrder))
orderRoutes.get('/', [authMiddleware], errorHandler(listOrders))
orderRoutes.put('/:id/cancel', [authMiddleware], errorHandler(cancelOrder))
orderRoutes.get('/index', [authMiddleware, adminMiddleware], errorHandler(listAllOrders))
orderRoutes.get('/users/:id', [authMiddleware, adminMiddleware], errorHandler(listUserOrders))
orderRoutes.put('/:id/status', [authMiddleware, adminMiddleware], errorHandler(changeStatus))
orderRoutes.get('/:id', [authMiddleware], errorHandler(getOrderById))

export default orderRoutes