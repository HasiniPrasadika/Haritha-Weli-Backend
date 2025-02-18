import {z} from 'zod'

export const CreateBranchSchema = z.object({
    name: z.string(),
    phoneNumber: z.string()
})

export const UpdateStockSchema = z.object({
    productId: z.number(),
    branchId: z.number(),
    quantity: z.number()
})