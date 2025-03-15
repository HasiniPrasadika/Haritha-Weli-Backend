import {Router} from 'express'
import { addAgent, addSalesRep, changePassword, deleteAgent, deleteSalesRep, editAgent, editSalesRep, forgotPassword, googleAuth, login, me, removeAccount, resetPassword, signup } from '../controllers/auth'
import { errorHandler } from '../error-handler'
import authMiddleware from '../middlewares/auth'
import adminMiddleware from '../middlewares/admin'


const authRoutes:Router = Router()

authRoutes.post('/google', errorHandler(googleAuth))
authRoutes.post('/signup', errorHandler(signup))
authRoutes.post('/login', errorHandler(login))
authRoutes.get('/me', [authMiddleware], errorHandler(me))

//admin
authRoutes.delete('/remove/:id', [authMiddleware, adminMiddleware], errorHandler(removeAccount))
authRoutes.post('/add-agent', [authMiddleware, adminMiddleware], errorHandler(addAgent))
authRoutes.post('/add-rep', [authMiddleware, adminMiddleware], errorHandler(addSalesRep))
authRoutes.post('/edit-agent/:id', [authMiddleware, adminMiddleware], errorHandler(editAgent))
authRoutes.post('/edit-rep/:id', [authMiddleware, adminMiddleware], errorHandler(editSalesRep))
authRoutes.delete('/delete-agent/:id', [authMiddleware, adminMiddleware], errorHandler(deleteAgent))
authRoutes.delete('/delete-rep/:id', [authMiddleware, adminMiddleware], errorHandler(deleteSalesRep))



//Forgot Password Functionalities
authRoutes.post('/forgot-password', errorHandler(forgotPassword))
authRoutes.post('/reset-password', errorHandler(resetPassword))

//Change Password Functionalities
authRoutes.post('/change-password', authMiddleware, errorHandler(changePassword))


export default authRoutes