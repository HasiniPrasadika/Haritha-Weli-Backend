import {NextFunction, Request, Response} from 'express'
import { UnauthorizedException } from '../exceptions/unauthorized';
import { ErrorCode } from '../exceptions/root';

const adminAgentRepMiddleware = (req: Request, res:Response, next: NextFunction) => {

    const user = req.user
    

    if (user.role === "ADMIN" || user.role === "AGENT" || user.role === "REP") {
        next() // Allow access
    }
    else{
        next(new UnauthorizedException('Unauthorized', ErrorCode.UNAUTHORIZED))
    }
    

};

export default adminAgentRepMiddleware;