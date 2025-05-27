import { Router } from "express";
import { errorHandler } from "../error-handler";
import authMiddleware from "../middlewares/auth";
import adminMiddleware from "../middlewares/admin";
import { createMasonBass, deleteMasonBass, getBassById, listMasonBass, updateMasonBass } from "../controllers/masonbass";
import adminAgentMiddleware from "../middlewares/admin-agent";

const masonBassRoutes:Router = Router()

masonBassRoutes.post('/',[authMiddleware, adminAgentMiddleware], errorHandler(createMasonBass))
masonBassRoutes.put('/:id',[authMiddleware, adminAgentMiddleware], errorHandler(updateMasonBass))
masonBassRoutes.delete('/:id',[authMiddleware, adminAgentMiddleware], errorHandler(deleteMasonBass))
masonBassRoutes.get('/', errorHandler(listMasonBass))
masonBassRoutes.get('/:id',[authMiddleware, adminAgentMiddleware], errorHandler(getBassById))

export default masonBassRoutes