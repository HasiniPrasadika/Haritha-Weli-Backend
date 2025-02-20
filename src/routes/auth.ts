import {Router} from 'express'
import { addAgent, addSalesRep, changePassword, forgotPassword, login, me, removeAccount, resetPassword, signup } from '../controllers/auth'
import { errorHandler } from '../error-handler'
import authMiddleware from '../middlewares/auth'
import adminMiddleware from '../middlewares/admin'


const authRoutes:Router = Router()

authRoutes.post('/signup', errorHandler(signup))
authRoutes.post('/login', errorHandler(login))
authRoutes.get('/me', [authMiddleware], errorHandler(me))

//admin
authRoutes.delete('/remove/:id', [authMiddleware, adminMiddleware], errorHandler(removeAccount))
authRoutes.post('/add-agent', [authMiddleware, adminMiddleware], errorHandler(addAgent))
authRoutes.post('/add-rep', [authMiddleware, adminMiddleware], errorHandler(addSalesRep))

//Forgot Password Functionalities
authRoutes.post('/forgot-password', errorHandler(forgotPassword))
authRoutes.post('/reset-password', errorHandler(resetPassword))

//Change Password Functionalities
authRoutes.post('/change-password', authMiddleware, errorHandler(changePassword))


export default authRoutes