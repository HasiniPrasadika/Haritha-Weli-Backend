import { Request, Response } from "express";
import { AddressSchema, UpdateUserSchema } from "../schema/users";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { Address, User } from "@prisma/client";
import { prismaClient } from "..";
import { BadRequestsException } from "../exceptions/bad_requests";

export const addAddress = async(req: Request, res: Response) => {
    AddressSchema.parse(req.body)

    const address = await prismaClient.address.create({
        data:{
            ...req.body,
            userId: req.user.id
        }
    })
    res.json(address)

}

export const deleteAddress = async(req: Request, res: Response) => {
    try{
        await prismaClient.address.delete({
            where:{
                id: +req.params.id
            }
        })
        res.json({success: true})

    }catch(err){
        throw new NotFoundException('Address not found', ErrorCode.ADDRESS_NOT_FOUND)

    }
}

export const listAddress = async(req: Request, res: Response) => {
    const addresses = await prismaClient.address.findMany({
        where:{
            userId: req.user.id
        }
    })
    res.json(addresses)
    
}

export const updateUser = async(req: Request, res: Response) => {

    const validatedData = UpdateUserSchema.parse(req.body)
    let shippingAddress: Address
    let billingAddress: Address
    if(validatedData.defaultShippingAddress){
        try{
            shippingAddress = await prismaClient.address.findFirstOrThrow({
                where:{
                    id: validatedData.defaultShippingAddress
                }
            })
    
        }catch(err){
            throw new NotFoundException('Address not found', ErrorCode.ADDRESS_NOT_FOUND)
        }

    }
    if(validatedData.defaultBillingAddress){
        try{
            billingAddress = await prismaClient.address.findFirstOrThrow({
                where:{
                    id: validatedData.defaultBillingAddress
                }
            })
            
    
        }catch(err){
            throw new NotFoundException('Address not found', ErrorCode.ADDRESS_NOT_FOUND)
        }

    }
    const updatedUser = await prismaClient.user.update({
        where: {
            id: req.user.id
        },
        data: validatedData
    })
    res.json(updatedUser)
    
    
    
}

export const listUsers = async(req: Request, res: Response) => {
    const users = await prismaClient.user.findMany({
        skip: +req.query.skip || 0,
        take: 5
    })
    res.json(users)

}


export const listAgents = async (req: Request, res:Response) => {
    try {
        const agents = await prismaClient.user.findMany({
            where: {
                role: 'AGENT' // Filter only agent users
            },
            include: {
                agentBranches: {  // Fetch the branch where the agent is assigned
                    include: {
                        salesRep: true  // Fetch sales representative assigned to that branch
                    }
                }
            },
            skip: +req.query.skip || 0,
          
        });

        res.json(agents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching agents", error: error.message });
    }
}

export const listReps = async (req:Request, res:Response) => {
    try {
        const reps = await prismaClient.user.findMany({
            where: {
                role: 'REP'
            },
            include: {
                salesRepBranches: {
                    include: {
                        agent: true 
                    }
                }
            },
            skip: +req.query.skip || 0,
          
        });

        res.json(reps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching reps", error: error.message });
    }
}


export const getUserById = async(req: Request, res: Response) => {
    try{
        const user = await prismaClient.user.findFirstOrThrow({
            where: {
                id: +req.params.id
            },
            include: {
                addresses: true
            }
        })
        res.json(user)

    }catch(err){
        throw new NotFoundException('user not found', ErrorCode.USER_NOT_FOUND)
    }   
}

export const changeUserRole = async(req: Request, res: Response) => {
    // validation
    try{
        const user = await prismaClient.user.update({
            where: {
                id: +req.params.id
            },
            data: {
                role: req.body.role
            }
        })
        res.json(user)

    }catch(err){
        throw new NotFoundException('user not found', ErrorCode.USER_NOT_FOUND)
    }
    
}

export const getAgentBranch = async (req: Request, res: Response) => {
    const userId = +req.params.userId; // Convert to number
    
    if (!userId || isNaN(userId)) {
        throw new BadRequestsException('Invalid user ID', ErrorCode.INVALID_USER_ID);
    }

    try {
        // First check if the user exists and is an agent
        const user = await prismaClient.user.findFirst({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);
        }

        if (user.role !== 'AGENT') {
            return res.json({ 
                success: false, 
                message: 'User is not an agent' 
            });
        }

        // Get the branch where the user is assigned as an agent
        const branch = await prismaClient.branch.findFirst({
            where: {
                agentId: userId
            },
            select: {
                id: true,
                name: true
            }
        });

        if (!branch) {
            return res.json({ 
                success: false, 
                message: 'Agent is not assigned to any branch' 
            });
        }

        return res.json({
            success: true,
            branchId: branch.id,
            branchName: branch.name
        });

    } catch (error) {
        if (error instanceof NotFoundException) {
            throw error;
        }
        console.error(error);
        throw new BadRequestsException('Error fetching agent branch', ErrorCode.INTERNAL_EXCEPTION);
    }
}

export const getRepBranches = async (req: Request, res: Response) => {
    const userId = +req.params.userId; // Convert to number

    if (!userId || isNaN(userId)) {
        throw new BadRequestsException('Invalid user ID', ErrorCode.INVALID_USER_ID);
    }

    try {
        // First check if the user exists and is a REP
        const user = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);
        }

        if (user.role !== 'REP') {
            return res.json({ 
                success: false, 
                message: 'User is not a rep' 
            });
        }

        // Fetch all branches assigned to this rep using the relation table
        const repBranches = await prismaClient.user.findUnique({
  where: { id: userId },
  include: {
    salesRepBranches: {
      select: {
        id: true,
        name: true
      }
    }
  }
});

        const branches = repBranches?.salesRepBranches.map(branch => ({
  branchId: branch.id,
  branchName: branch.name
})) || [];

        if (branches.length === 0) {
            return res.json({
                success: false,
                message: 'No branches assigned to this rep'
            });
        }

        return res.json({
            success: true,
            branches
        });

    } catch (error) {
        if (error instanceof NotFoundException) {
            throw error;
        }
        console.error(error);
        throw new BadRequestsException('Error fetching rep branches', ErrorCode.INTERNAL_EXCEPTION);
    }
};
