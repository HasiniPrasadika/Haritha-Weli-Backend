import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";

const salesRepMiddleware = async(req: Request, res: Response, next: NextFunction) => {

    const user = req.user
    if(user.role == 'REP'){
        next()
    }
    else{
        next(new UnauthorizedException('Unauthorized', ErrorCode.UNAUTHORIZED))
    }
   

}

export default salesRepMiddleware