import {NextFunction, Request, Response} from 'express'
import { prismaClient } from '..';
import {hashSync, compareSync} from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { FRONTEND_URL, JWT_SECRET } from '../secrets';
import { BadRequestsException } from '../exceptions/bad_requests';
import { ErrorCode } from '../exceptions/root';
import { UnprocessableEntity } from '../exceptions/validation';
import { ForgetPasswordSchema, SignUpSchema } from '../schema/users';
import { NotFoundException } from '../exceptions/not-found';
import crypto from "crypto";
import { sendEmail } from '../utils/email';
import { UnauthorizedException } from '../exceptions/unauthorized';

export const signup = async (req:Request, res:Response, next: NextFunction) => {
    SignUpSchema.parse(req.body)
    const {email, password, name, phoneNumber} = req.body;

    let user = await prismaClient.user.findFirst({where: {email}})
    if (user) {
        throw new BadRequestsException('User already exists!', ErrorCode.USER_ALREADY_EXISTS) 
    }

    user = await prismaClient.user.create({
        data:{
            name,
            email,
            phoneNumber,
            password:hashSync(password, 10),
           
        }
    })

    res.json(user)    

}

export const addAgent = async (req:Request, res:Response, next: NextFunction) => {
    SignUpSchema.parse(req.body)
    const {email, password, name, phoneNumber} = req.body;

    let user = await prismaClient.user.findFirst({where: {email}})
    if (user) {
        throw new BadRequestsException('User already exists!', ErrorCode.USER_ALREADY_EXISTS) 
    }

    user = await prismaClient.user.create({
        data:{
            name,
            email,
            phoneNumber,
            password:hashSync(password, 10),
            role: 'AGENT'
           
        }
    })

    res.json(user)    

}

export const addSalesRep = async (req:Request, res:Response, next: NextFunction) => {
    SignUpSchema.parse(req.body)
    const {email, password, name, phoneNumber} = req.body;

    let user = await prismaClient.user.findFirst({where: {email}})
    if (user) {
        throw new BadRequestsException('User already exists!', ErrorCode.USER_ALREADY_EXISTS) 
    }

    user = await prismaClient.user.create({
        data:{
            name,
            email,
            phoneNumber,
            password:hashSync(password, 10),
            role: 'REP'
           
        }
    })

    res.json(user)    

}

// Edit Agent
export const editAgent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        SignUpSchema.parse(req.body);
        const { name, email, phoneNumber, password } = req.body;
        const agentId = parseInt(req.params.id, 10);

        let agent = await prismaClient.user.findFirst({ where: { id: agentId, role: 'AGENT' } });
        if (!agent) {
            throw new NotFoundException("Agent Not Found", ErrorCode.USER_NOT_FOUND);
        }

        agent = await prismaClient.user.update({
            where: { id: agentId },
            data: {
                name,
                email,
                phoneNumber,
                password: password ? hashSync(password, 10) : agent.password,
            },
        });

        res.json(agent);
    } catch (err) {
        next(err);
    }
};

// Edit Sales Representative
export const editSalesRep = async (req: Request, res: Response, next: NextFunction) => {
    try {
        SignUpSchema.parse(req.body);
        const { name, email, phoneNumber, password } = req.body;
        const salesRepId = parseInt(req.params.id, 10);

        let salesRep = await prismaClient.user.findFirst({ where: { id: salesRepId, role: 'REP' } });
        if (!salesRep) {
            throw new NotFoundException("Sales Representative Not Found", ErrorCode.USER_NOT_FOUND);
        }

        salesRep = await prismaClient.user.update({
            where: { id: salesRepId },
            data: {
                name,
                email,
                phoneNumber,
                password: password ? hashSync(password, 10) : salesRep.password,
            },
        });

        res.json(salesRep);
    } catch (err) {
        next(err);
    }
};

// Delete Agent
export const deleteAgent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const agentId = parseInt(req.params.id, 10);

        const agent = await prismaClient.user.findFirst({ where: { id: agentId, role: 'AGENT' } });
        if (!agent) {
            throw new NotFoundException("Agent Not Found", ErrorCode.USER_NOT_FOUND);
        }

        await prismaClient.user.delete({ where: { id: agentId } });
        res.json({ message: "Agent deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// Delete Sales Representative
export const deleteSalesRep = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const salesRepId = parseInt(req.params.id, 10);

        const salesRep = await prismaClient.user.findFirst({ where: { id: salesRepId, role: 'REP' } });
        if (!salesRep) {
            throw new NotFoundException("Sales Representative Not Found", ErrorCode.USER_NOT_FOUND);
        }

        await prismaClient.user.delete({ where: { id: salesRepId } });
        res.json({ message: "Sales Representative deleted successfully" });
    } catch (err) {
        next(err);
    }
};



export const changePassword = async (req: Request, res: Response) => {
    const userId = req.user?.id; // Extract user ID from the authenticated request
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
        throw new UnauthorizedException('Unauthorized', ErrorCode.UNAUTHORIZED)
    }

    const user = await prismaClient.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND)
    }

    // Verify current password
    if (!compareSync(currentPassword, user.password)) {
        throw new NotFoundException('Current Password is Incorrect', ErrorCode.INCORRECT_CURRENT_PASSWORD)
    }

    // Update password
    await prismaClient.user.update({
        where: { id: userId },
        data: {
            password: hashSync(newPassword, 10),
        },
    });

    res.json({ success: "Password changed successfully" });
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { token, email, newPassword } = req.body;

    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
       throw new BadRequestsException('Invalid or expired reset token!', ErrorCode.INVALID_OR_EXPIRED_RESET_TOKEN) 
    }

    // Hash the provided token and compare it with the stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    if (hashedToken !== user.passwordResetToken || user.passwordResetExpires < new Date()) {
        throw new BadRequestsException('Invalid or expired reset token!', ErrorCode.INVALID_OR_EXPIRED_RESET_TOKEN) 
    }

    // Update the password and remove the reset token
    await prismaClient.user.update({
        where: { email },
        data: {
            password: hashSync(newPassword, 10),
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });

    res.json({ success: "Password reset successfully. You can now log in." });
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user) {
        throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND)
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store the hashed token and expiration time in the database
    await prismaClient.user.update({
        where: { email },
        data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // Token valid for 10 mins
        },
    });

    // Create password reset URL
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    // Send email with reset link
    await sendEmail({
        to: email,
        subject: "Password Reset Request",
        html: `<p>You requested a password reset.</p>
               <p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 10 minutes.</p>`,
    });

    res.json({ success: "Password reset link sent to email" });
};


export const login = async (req:Request, res:Response) => {
    const {email, password} = req.body;

    let user = await prismaClient.user.findFirst({where: {email}})
    if (!user) {
        throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND)
    }
    if(!compareSync(password, user.password)){
        throw new BadRequestsException('Incorrect password', ErrorCode.INCORRECT_PASSWORD)
    }
    const token = jwt.sign({
        userId: user.id
    }, JWT_SECRET)

    

    res.json({user, token})

}

// /me -> return the logged in user

export const me = async (req:Request, res:Response) => { 

    res.json(req.user)
}

export const removeAccount = async (req:Request, res:Response) => {
    try{
        await prismaClient.user.delete({
            where:{
                id: +req.params.id
            }
        })
        res.json({success: true})

    }catch(err){
        throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND)

    }
}

