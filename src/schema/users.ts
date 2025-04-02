import {z} from 'zod'

export const SignUpSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    phoneNumber: z.string()
})



export const ForgetPasswordSchema = z.object({
    email: z.string()
})
export const AddressSchema = z.object({
    lineOne: z.string(),
    lineTwo: z.string().nullable(),
    pinCode: z.string(),
    country: z.string(),
    city: z.string()
})

export const UpdateUserSchema = z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    defaultShippingAddress: z.number().optional(), 
    defaultBillingAddress: z.number().optional() 
})