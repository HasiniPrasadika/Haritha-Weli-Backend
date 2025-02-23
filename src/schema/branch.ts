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

export const AssignAgentSchema = z.object({
    branchId: z.number(),
    agentId: z.number()
})

export const AssignRepSchema = z.object({
    branchId: z.number(),
    repId: z.number()
})