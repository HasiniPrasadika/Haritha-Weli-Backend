import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { prismaClient } from "..";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import exp from "constants";

export const createProduct = async(req:Request, res:Response) => {

    const product = await prismaClient.product.create({
        data: {
            ...req.body,  
        }
    })
    res.json(product)

}

export const updateProduct = async(req:Request, res:Response) => {
    try{
        const product = req.body
        
        const updatedProduct = await prismaClient.product.update({
            where:{
                id: +req.params.id
            },
            data: product
        })
        res.json(updatedProduct)


    } catch(err){
        throw new NotFoundException('Product Not Found', ErrorCode.PRODUCT_NOT_FOUND)
    }

}

export const deleteProduct = async(req:Request, res:Response) => {
    try{
        
        const deletedProduct = await prismaClient.product.delete({
            where:{
                id: +req.params.id
            },
        })
        res.json(deletedProduct)

    } catch(err){
        throw new NotFoundException('Product Not Found', ErrorCode.PRODUCT_NOT_FOUND)
    }
    
}

export const listProducts = async(req:Request, res:Response) => {
    // {
    //     count: 100,
    //     data: []
    // }

    const count = await prismaClient.product.count()
    const products = await prismaClient.product.findMany({
        skip: +req.query.skip || 0,
        take: 5
    })
    res.json({
        count, data: products
    })
    
}

export const getProductById = async(req:Request, res:Response) => {
    try{
        const product = await prismaClient.product.findFirstOrThrow({
            where:{
                id: +req.params.id
            }
        })
        res.json(product)

    }catch(err){
        throw new NotFoundException('Product Not Found', ErrorCode.PRODUCT_NOT_FOUND)

    }
    
}

export const searchProducts = async (req: Request, res: Response) => {
    console.log('searched hfjhgdhfcb djhgfcghdv dgvhg')
    const products = await prismaClient.product.findMany({
        where:{
            name:{
                search: req.query.q.toString(),
            }
        }
    })
    res.json(products)

}
