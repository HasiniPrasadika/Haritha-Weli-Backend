import express, { Express, Request, Response } from "express";
import { PORT } from "./secrets";
import rootRouter from "./routes";
import { PrismaClient } from "@prisma/client";
import { errorMiddleware } from "./middlewares/errors";
import { SignUpSchema } from "./schema/users";
import { METHODS } from "http";
import cors from "cors";

const app: Express = express();

app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api", rootRouter);

app.get("/", (req, res) => {
  res.status(200).send("Haritha Weli backend");
});



export const prismaClient = new PrismaClient({
    log: ["query"],
  }).$extends({
    result: {
      address: {
        formattedAddress: {
          needs: {
            lineOne: true,
            lineTwo: true,
            city: true,
            country: true,
            pinCode: true,
          },
          compute: (addr) => {
            return `${addr.lineOne}, ${addr.lineTwo}, ${addr.city}, ${addr.country}-${addr.pinCode}`;
          },
        },
      },
    },
  });
  
  app.use(errorMiddleware);
  app.listen(PORT, () => {
    console.log("App Working!");
  });


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


