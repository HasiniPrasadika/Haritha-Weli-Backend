import {z} from 'zod'

export const CreateBranchSchema = z.object({
    name: z.string(),
    phoneNumber: z.string(),
    address: z.string()
})

export const UpdateBranchSchema = z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional()
})

export const UpdateStockSchema = z.object({
    productId: z.number(),
    branchId: z.number(),
    quantity: z.number()
})

export const AssignAgentSchema = z.object({
    branchId: z.number(),
    agentId: z.number()
})

export const AssignRepSchema = z.object({
    branchId: z.number(),
    repId: z.number()
})