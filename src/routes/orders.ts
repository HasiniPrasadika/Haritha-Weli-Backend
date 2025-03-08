import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { errorHandler } from "../error-handler";
import { cancelOrder, changeStatus, checkout, createOrder, getOrderById, getOrdersByBranch, handlePaymentNotification, listAllOrders, listOrders, listUserOrders, paymentSuccess } from "../controllers/orders";
import adminMiddleware from "../middlewares/admin";
import { error } from "console";
import adminAgentMiddleware from "../middlewares/admin-agent";
import adminAgentRepMiddleware from "../middlewares/admin-agent-rep";

const orderRoutes: Router = Router()

orderRoutes.post('/', [authMiddleware], errorHandler(checkout))
orderRoutes.post('/payment-success-notification', [authMiddleware], errorHandler(paymentSuccess))
orderRoutes.get('/', [authMiddleware], errorHandler(listOrders)) // orders belong to user
orderRoutes.get('/:id/branch', [authMiddleware], errorHandler(getOrdersByBranch)) // orders belong to branch
orderRoutes.put('/:id/cancel', [authMiddleware], errorHandler(cancelOrder))
orderRoutes.get('/index', [authMiddleware, adminMiddleware], errorHandler(listAllOrders)) // all orders of all branches
orderRoutes.get('/users/:id', [authMiddleware, adminMiddleware], errorHandler(listUserOrders)) // Orders of users
orderRoutes.put('/:id/status', [authMiddleware, adminAgentRepMiddleware], errorHandler(changeStatus))
orderRoutes.get('/:id', [authMiddleware], errorHandler(getOrderById)) // details of the order

export default orderRoutes