import { Router } from "express";
import { errorHandler } from "../error-handler";
import authMiddleware from "../middlewares/auth";
import adminMiddleware from "../middlewares/admin";
import { addAddress, changeUserRole, deleteAddress, getAgentBranch, getUserById, listAddress, listAgents, listReps, listUsers, updateUser } from "../controllers/users";

const userRoutes:Router = Router()

userRoutes.post('/address', [authMiddleware], errorHandler(addAddress))
userRoutes.delete('/address/:id', [authMiddleware], errorHandler(deleteAddress))
userRoutes.get('/address', [authMiddleware], errorHandler(listAddress))
userRoutes.put('/', [authMiddleware], errorHandler(updateUser))
userRoutes.put('/:id/role', [authMiddleware, adminMiddleware], errorHandler(changeUserRole))
userRoutes.get('/', [authMiddleware, adminMiddleware], errorHandler(listUsers))
userRoutes.get('/agent', [authMiddleware, adminMiddleware], errorHandler(listAgents))
userRoutes.get('/rep', [authMiddleware, adminMiddleware], errorHandler(listReps))
userRoutes.get('/:id', [authMiddleware], errorHandler(getUserById))
userRoutes.get('/agent-branch/:userId', [authMiddleware], errorHandler(getAgentBranch))

export default userRoutes