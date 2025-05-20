import { Router } from "express";
import { getFacebookPosts } from "../controllers/facebook";

const facebookRoutes: Router = Router();

facebookRoutes.get("/posts", getFacebookPosts);

export default facebookRoutes;
