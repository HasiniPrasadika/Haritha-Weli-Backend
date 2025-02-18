import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";

const agentMiddleware = async(req: Request, res: Response, next: NextFunction) => {

    const user = req.user
    if(user.role == 'AGENT'){
        next()
    }
    else{
        next(new UnauthorizedException('Unauthorized', ErrorCode.UNAUTHORIZED))
    }
   

}

export default agentMiddleware