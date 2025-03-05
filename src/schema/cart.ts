import {z} from 'zod'

export const CreateCartSchema = z.object({
    branchId: z.number(),
    productId: z.number(),
    quantity: z.number()
})

export const ChangeQuantitySchema = z.object({
    quantity: z.number()
})