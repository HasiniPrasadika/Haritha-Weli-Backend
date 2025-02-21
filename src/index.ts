import { PrismaClient } from '@prisma/client'
import express, { Express } from 'express'
import { errorMiddleware } from './middlewares/errors'
import rootRouter from './routes'
import { PORT } from './secrets'
const cors = require("cors");

const app:Express = express()


app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));



app.use(express.json())

app.use('/api', rootRouter);

app.get("/",(req,res)=>{
    res.status(200).send("Haritha Weli backend");
  })

export const prismaClient = new PrismaClient({
    log:['query']
}).$extends({
    result:{
        address:{
            formattedAddress: {
                needs:{
                    lineOne: true,
                    lineTwo: true,
                    city: true,
                    country: true,
                    pinCode: true
                },
                compute: (addr) => {
                    return `${addr.lineOne}, ${addr.lineTwo}, ${addr.city}, ${addr.country}-${addr.pinCode}`
                }
            }
        }
    }
})

app.use(errorMiddleware)
app.listen(PORT, () =>{console.log('App Working!')})