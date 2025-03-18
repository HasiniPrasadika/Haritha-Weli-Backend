import { Request, Response } from "express";
import { ChangeQuantitySchema, CreateCartSchema } from "../schema/cart";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { Branch, CartItem, Product } from "@prisma/client";
import { prismaClient } from "..";
import { BadRequestsException } from "../exceptions/bad_requests";

export const addItemToCart = async (req: Request, res: Response) => {
    const validatedData = CreateCartSchema.parse(req.body)
    let product: Product
    let cart: CartItem
    let branch: Branch
    try{
        product = await prismaClient.product.findFirstOrThrow({
            where:{
                id: validatedData.productId
            }
        })
        console.log("product : ", product)

    }catch(err){
        throw new NotFoundException('Product not found', ErrorCode.PRODUCT_NOT_FOUND)
    }
    try{
        branch = await prismaClient.branch.findFirstOrThrow({
            where:{
                id: validatedData.branchId
            }
        })
        console.log("branch : ", branch)

    }catch(err){
        throw new NotFoundException('Branch not found', ErrorCode.BRANCH_NOT_FOUND)
    }
    let cartItem = await prismaClient.cartItem.findFirst({
        where: {
            userId: req.user.id, // Important: also filter by the current user
            productId: product.id,
            branchId: branch.id
        }
    });
    console.log("existing cart item : ", cartItem)
    if(cartItem){
        // const updatedProduct = await prismaClient.product.update({
        //     where:{
        //         id: +req.params.id
        //     },
        //     data: product
        // })
        // res.json(updatedProduct)
        cart = await prismaClient.cartItem.update({
            where:{
                id: cartItem.id
            },
            data:{
                quantity: cartItem.quantity+validatedData.quantity
            }
        })
        console.log("cart : ", cart)
       
    }else{
        cart = await prismaClient.cartItem.create({
            data: {
                userId: req.user.id,
                productId: product.id,
                quantity: validatedData.quantity,
                branchId: validatedData.branchId,
                branchName: branch.name
            }
        })
        console.log("cart : ", cart)

    }
    
    res.json(cart)

}

export const deleteItemFromCart = async (req: Request, res: Response) => {
    //check if user is deleting its own cart item

    
    await prismaClient.cartItem.delete({
        where:{
            id: +req.params.id
        }
    })
    res.json({success: true})
}

export const changeQuantity = async (req: Request, res: Response) => {
     //check if user is updating its own cart item
    const validatedData = ChangeQuantitySchema.parse(req.body)
    const updatedCart = await prismaClient.cartItem.update({
        where:{
            id: +req.params.id
        },
        data:{
            quantity: validatedData.quantity
        }
    })
    res.json(updatedCart)
    
}

export const getCart = async (req: Request, res: Response) => {

    const cart = await prismaClient.cartItem.findMany({
        where:{
            userId: req.user.id
        },
        include:{
            product: true
            
        }
    })
    res.json(cart)
    
}