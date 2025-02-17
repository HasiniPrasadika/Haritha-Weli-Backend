import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from "../secrets";
import { prismaClient } from "..";
import { Payload } from "@prisma/client/runtime/library";

const adminMiddleware = async(req: Request, res: Response, next: NextFunction) => {

    const user = req.user
    if(user.role == 'ADMIN'){
        next()
    }
    else{
        next(new UnauthorizedException('Unauthorized', ErrorCode.UNAUTHORIZED))
    }
   

}

export default adminMiddleware