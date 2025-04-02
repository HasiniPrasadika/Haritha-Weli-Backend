
import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { errorHandler } from "../error-handler";
import { createReview, deleteReview, getAllReviews, getReviewsByOrder, getReviewsByProduct, updateReview } from "../controllers/review";

const reviewRoutes:Router = Router()

reviewRoutes.post('/',[authMiddleware], errorHandler(createReview))
reviewRoutes.get('/',[authMiddleware], errorHandler(getAllReviews))
reviewRoutes.put('/:id', [authMiddleware], errorHandler(updateReview))
reviewRoutes.get('/order/:orderId',[authMiddleware], errorHandler(getReviewsByOrder))
reviewRoutes.get('/product/:productId',[authMiddleware], errorHandler(getReviewsByProduct))
reviewRoutes.delete('/:id', [authMiddleware], errorHandler(deleteReview))


export default reviewRoutes

