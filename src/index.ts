import express, { Express, Request, Response } from "express";
import { DATABASE_URL, FRONTEND_URL, PORT } from "./secrets";
import rootRouter from "./routes";
import { PrismaClient } from "@prisma/client";
import { errorMiddleware } from "./middlewares/errors";
import cors from "cors";
import facebookRoutes from "./routes/facebookRoutes";

const app: Express = express();

app.use(
  cors({
    origin: [
    'http://localhost:3000',
    'https://harithaweli.lk',
    'https://www.harithaweli.lk'
  ],
  credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
   
  })
);
// Set COOP and COEP headers globally
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});
 // Pre-flight requests for all routes
app.use(express.json({ limit: "10mb" })); // Increase body limit
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", rootRouter);

app.get("/", (req, res) => {
  res.status(200).send("Haritha Weli backend");
});

app.use("/api/facebook", facebookRoutes);

// Test database connection before initializing Prisma client
console.log("Attempting to connect to database...");
console.log("Database URL format check:", DATABASE_URL.startsWith("mysql://") ? "Valid format" : "Invalid format");

// Declare the prisma client outside of the try block
let prismaClient;

try {
  console.log("Initializing Prisma client...");
  prismaClient = new PrismaClient({
    log: ["query", "error", "info", "warn"],
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
  
  // Test the connection immediately
  prismaClient.$connect()
    .then(() => {
      console.log("✓ Database connection successful!");
      return prismaClient.$queryRaw`SELECT 1 as test`;
    })
    .then((result) => {
      console.log("✓ Database query successful:", result);
    })
    .catch((error) => {
      console.error("✗ Database connection failed:");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      if (error.message.includes("access denied")) {
        console.error("Credentials appear to be incorrect.");
      } else if (error.message.includes("could not connect")) {
        console.error("Server might be unreachable or blocked by firewall.");
      } else if (error.message.includes("database") && error.message.includes("does not exist")) {
        console.error("The specified database does not exist.");
      }
    });
    
  console.log("Prisma client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Prisma client:", error);
}

// Export the prisma client after initialization
export { prismaClient };

app.use(errorMiddleware);
app.listen(PORT, () => {
  console.log("App Working on port:", PORT);
});