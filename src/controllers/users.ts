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


export const listAgents = async (req, res) => {
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
            take: 5
        });

        res.json(agents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching agents", error: error.message });
    }
}

export const listReps = async (req, res) => {
    try {
        const reps = await prismaClient.user.findMany({
            where: {
                role: 'REP' // Filter only agent users
            },
            include: {
                salesRepBranches: {  // Fetch the branch where the agent is assigned
                    include: {
                        agent: true  // Fetch sales representative assigned to that branch
                    }
                }
            },
            skip: +req.query.skip || 0,
            take: 5
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