import {NextFunction, Request, Response} from 'express'
import { AssignAgentSchema, AssignRepSchema, CreateBranchSchema, UpdateStockSchema } from '../schema/branch'
import { prismaClient } from '..'
import { Branch, BranchProduct, Product } from '@prisma/client'
import { ErrorCode } from '../exceptions/root'
import { NotFoundException } from '../exceptions/not-found'
import { BadRequestsException } from '../exceptions/bad_requests'
import { updateProduct } from './products'

export const createBranch = async (req:Request, res:Response) => {

    const validatedData = CreateBranchSchema.parse(req.body)

    const branch = await prismaClient.branch.create({
        data: {
            name: validatedData.name,
            phoneNumber: validatedData.phoneNumber
        }
    })
    res.json(branch)

}
export const listBranches = async (req: Request, res: Response) => {
    try {
        const branches = await prismaClient.branch.findMany({
            include: {
                agent: true, // Include agent details if applicable
                salesRep: true, // Include sales representative details if applicable
                products: true // Include branch products if needed
                
            },
        });

        res.json(branches);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve branches", error: error.message });
    }
};

export const addProductsToBranch = async (req:Request, res: Response) =>{

    const validatedData = UpdateStockSchema.parse(req.body)
    let product: Product
    let stock: BranchProduct

    try{
        product = await prismaClient.product.findFirstOrThrow({
            where:{
                
                id: validatedData.productId
            }
        })

    }catch(err){
        throw new NotFoundException('Product not found', ErrorCode.PRODUCT_NOT_FOUND)
    }

    let stockItem = await prismaClient.branchProduct.findFirst({
        where: {
            product
        }
    })
    if(stockItem){
        stock = await prismaClient.branchProduct.update({
            where: {
                id: stockItem.id
            },
            data:{
                quantity: stockItem.quantity + validatedData.quantity
            }
        })
        product = await prismaClient.product.update({
            where:{
                id: validatedData.productId
            },
            data:{
                adminStock: product.adminStock - validatedData.quantity
            }
        })
    } else {
        stock = await prismaClient.branchProduct.create({
            data:{
                branchId: validatedData.branchId,
                productId: product.id,
                quantity: validatedData.quantity
            }
        })
        product = await prismaClient.product.update({
            where:{
                id: validatedData.productId
            },
            data:{
                adminStock: product.adminStock - validatedData.quantity
            }
        })
            
    }
    res.json(stock)

}

export const assignAgent = async (req:Request, res:Response) => {
    let updatedBranch: Branch
    const validatedData = AssignAgentSchema.parse(req.body)
  
        const agent = await prismaClient.user.findUnique({
            where: {
                id: validatedData.agentId
            }
        })
        
    
        if (!agent){
            throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND)
        } 
        if (agent.role !== 'AGENT'){
            throw new BadRequestsException('User is not an agent', ErrorCode.USER_IS_NOT_AN_AGENT)
        }
    
        updatedBranch = await prismaClient.branch.update({
          where: { id: validatedData.branchId },
          data: { agentId: validatedData.agentId },
        });
    
       
   
    res.json(updatedBranch)
    

}

export const assignRep = async (req:Request, res:Response) => {
    let updatedBranch: Branch
    const validatedData = AssignRepSchema.parse(req.body)
  
        const rep = await prismaClient.user.findUnique({
            where: {
                id: validatedData.repId
            }
        })
        
    
        if (!rep){
            throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND)
        } 
        if (rep.role !== 'REP'){
            throw new BadRequestsException('User is not an sales rep', ErrorCode.USER_IS_NOT_AN_REP)
        }
    
        updatedBranch = await prismaClient.branch.update({
          where: { id: validatedData.branchId },
          data: { salesRepId: validatedData.repId},
        });
    
    
    res.json(updatedBranch)
    

}
