import dotenv from 'dotenv'

dotenv.config({path:'.env'})

export const DATABASE_URL = process.env.DATABASE_URL
export const PORT = process.env.PORT
export const JWT_SECRET = process.env.JWT_SECRET!
export const  FRONTEND_URL = process.env.FRONTEND_URL
export const EMAIL_USER = process.env.EMAIL_USER
export const EMAIL_PASS = process.env.EMAIL_PASS
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
export const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID
export const PAYHERE_SECRET = process.env.PAYHERE_SECRET
export const CLIENT_ID = process.env.CLIENT_ID
export const META_WHATSAPP_ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN
export const META_WHATSAPP_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID
export const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER
// META_WHATSAPP_ACCESS_TOKEN=your_meta_access_token
// META_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
// ADMIN_WHATSAPP_NUMBER=admin_phone_with_country_code (e.g., 911234567890)