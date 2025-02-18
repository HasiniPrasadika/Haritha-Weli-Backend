import {Router} from 'express'
import { login, me, removeAccount, signup } from '../controllers/auth'
import { errorHandler } from '../error-handler'
import authMiddleware from '../middlewares/auth'
import adminMiddleware from '../middlewares/admin'


const authRoutes:Router = Router()

authRoutes.post('/signup', errorHandler(signup))
authRoutes.post('/login', errorHandler(login))
authRoutes.get('/me', [authMiddleware], errorHandler(me))

//admin
authRoutes.delete('/remove/:id', [authMiddleware, adminMiddleware], errorHandler(removeAccount))

export default authRoutes