import express, {Express, Request, Response} from 'express'
import { PORT } from './secrets'
import rootRouter from './routes'
import { PrismaClient } from '@prisma/client'
import { errorMiddleware } from './middlewares/errors'
import { SignUpSchema } from './schema/users'

const app:Express = express()

app.use(express.json())

app.use('/api', rootRouter);

app.get("/",(req,res)=>{
    res.status(200).send("Haritha Weli backend");
  })

//   const prisma = new PrismaClient();

// async function clearDatabase() {
//   await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
//   await prisma.user.deleteMany();
//   await prisma.branch.deleteMany();
//   await prisma.order.deleteMany();
//   await prisma.cartItem.deleteMany();
//   await prisma.address.deleteMany();
//   await prisma.branchProduct.deleteMany();
//   await prisma.product.deleteMany();
//   await prisma.orderEvent.deleteMany();
//   await prisma.orderProduct.deleteMany();

//   await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

//   console.log("All data deleted!");
// }

// clearDatabase();

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