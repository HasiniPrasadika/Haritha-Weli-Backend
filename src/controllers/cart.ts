import { Request, Response } from "express";
import { ChangeQuantitySchema, CreateCartSchema } from "../schema/cart";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { CartItem, Product } from "@prisma/client";
import { prismaClient } from "..";
import { BadRequestsException } from "../exceptions/bad_requests";

export const addItemToCart = async (req: Request, res: Response) => {
    //Check for the existence for same product in users cart and alter the quantity as required
    // let user = await prismaClient.user.findFirst({where: {email}})
    //     if (user) {
    //         new BadRequestsException('User already exists!', ErrorCode.USER_ALREADY_EXISTS) 
    //     }
    const validatedData = CreateCartSchema.parse(req.body)
    let product: Product
    let cart: CartItem
    try{
        product = await prismaClient.product.findFirstOrThrow({
            where:{
                id: validatedData.productId
            }
        })

    }catch(err){
        throw new NotFoundException('Product not found', ErrorCode.PRODUCT_NOT_FOUND)
    }
    let cartItem = await prismaClient.cartItem.findFirst({
        where:{            
        product
        }
    })
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
       
    }else{
        cart = await prismaClient.cartItem.create({
            data: {
                userId: req.user.id,
                productId: product.id,
                quantity: validatedData.quantity
            }
        })

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