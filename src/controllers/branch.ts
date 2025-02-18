import {NextFunction, Request, Response} from 'express'
import { CreateBranchSchema, UpdateStockSchema } from '../schema/branch'
import { prismaClient } from '..'
import { BranchProduct, Product } from '@prisma/client'
import { ErrorCode } from '../exceptions/root'
import { NotFoundException } from '../exceptions/not-found'

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
    } else {
        stock = await prismaClient.branchProduct.create({
            data:{
                branchId: validatedData.branchId,
                productId: product.id,
                quantity: validatedData.quantity
            }
        })
            
    }
    res.json(stock)

}
