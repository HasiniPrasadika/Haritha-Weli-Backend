import { Router } from "express";
import authRoutes from "./auth";
import productsRoutes from "./products";
import userRoutes from "./users";
import cartRoutes from "./cart";
import orderRoutes from "./orders";
import branchRoutes from "./branch";
import stockRoutes from "./stockrequest";

const rootRouter:Router = Router()

rootRouter.use('/auth', authRoutes)
rootRouter.use('/products', productsRoutes)
rootRouter.use('/users', userRoutes)
rootRouter.use('/cart', cartRoutes)
rootRouter.use('/orders', orderRoutes)
rootRouter.use('/branch', branchRoutes)
rootRouter.use('/stock', stockRoutes)

export default rootRouter;

/* 1. user management
        a. list users
        b. get user by id
        c. change user role
    2. order management
        a. list all orders (filter on status)
        b. change order status
        c. list all orders of given user
    3. products
        a. search api for products (for both users and admins) -> full text search

*/