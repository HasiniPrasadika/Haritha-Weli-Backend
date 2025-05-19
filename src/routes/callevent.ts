import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { errorHandler } from "../error-handler";
import adminMiddleware from "../middlewares/admin";
import { error } from "console";
import adminAgentMiddleware from "../middlewares/admin-agent";
import adminAgentRepMiddleware from "../middlewares/admin-agent-rep";
import { changeCallStatus, createCallEvent, deleteCallEvent, listCallEvents, updateCallEvent } from "../controllers/callevent";

const callRoutes: Router = Router()

callRoutes.post('/', [authMiddleware, adminMiddleware], errorHandler(createCallEvent))
callRoutes.get('/', [authMiddleware, adminMiddleware], errorHandler(listCallEvents))
callRoutes.put('/:id',[authMiddleware, adminMiddleware], errorHandler(updateCallEvent))
callRoutes.delete('/:id',[authMiddleware, adminMiddleware], errorHandler(deleteCallEvent))
callRoutes.put('/:id/status', [authMiddleware, adminMiddleware], errorHandler(changeCallStatus))

export default callRoutes