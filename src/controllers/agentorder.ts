import { Request, Response } from "express";
import { z } from "zod";
import { generatePDF } from "../utils/pdf-generator";
import { prismaClient } from "..";
import { notifyAdminAboutOrder } from "./whatsapp";

const CreateAgentOrderSchema = z.object({
  customerId: z.number().optional(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
  address: z.string(),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().positive(),
    })
  ),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER"]),
  amountPaid: z.number().nonnegative(),
  sendWhatsApp: z.boolean().default(false),
  discountPercentage: z.number().min(0).max(100).default(0), // Add discount percentage
  bassCode: z.string().optional(),
});

export const createAgentOrder = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateAgentOrderSchema.parse(req.body);
    console.log("validated data:", validatedData);

    // Get the agent's branch (assuming agent is logged in)
    const agent = await prismaClient.user.findUnique({
      where: { id: req.user.id },
      include: { agentBranches: true },
    });
    console.log("agent:", agent);

    if (!agent || !agent.agentBranches) {
      return res
        .status(403)
        .json({ message: "User is not an agent or not assigned to a branch" });
    }

    const branchId = agent.agentBranches.id;

    // Fetch the branch to ensure it exists
    const branch = await prismaClient.branch.findUnique({
      where: { id: branchId },
    });
    console.log("branch:", branch);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Fetch products to validate and calculate total
    const productIds = validatedData.items.map((item) => item.productId);
    const products = await prismaClient.product.findMany({
      where: { id: { in: productIds } },
    });
    console.log("products:", products);

    if (products.length !== productIds.length) {
      return res
        .status(400)
        .json({ message: "One or more products not found" });
    }

    // Create a product map for easier access
    const productMap = products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});

    // Calculate total amount
    const totalAmount = validatedData.items.reduce((total, item) => {
      const product = productMap[item.productId];
      return total + Number(product.price) * item.quantity;
    }, 0);

    // Create or get the customer
    let userId = validatedData.customerId;
    if (!userId) {
      // Check if user exists with this email
      const existingUser = await prismaClient.user.findUnique({
        where: { email: validatedData.customerEmail },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create a new user with a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        console.log("tempPassword:", tempPassword);
        console.log("phone number:", validatedData.customerPhone);
        const newUser = await prismaClient.user.create({
          data: {
            name: validatedData.customerName,
            email: validatedData.customerEmail,
            password: tempPassword, // Should be hashed in production
            phoneNumber: validatedData.customerPhone,
            role: "USER",
          },
        });
        userId = newUser.id;
      }
    }

    // Calculate subtotal (before discount)
    const subtotalAmount = validatedData.items.reduce((total, item) => {
      const product = productMap[item.productId];
      return total + Number(product.price) * item.quantity;
    }, 0);

    // Calculate discount amount
    const discountAmount =
      subtotalAmount * (validatedData.discountPercentage / 100);

    // Calculate final total after discount
    const finalAmount = subtotalAmount - discountAmount;

    // Create the order
    const order = await prismaClient.order.create({
      data: {
        userId: userId,
        branchId: branchId,
        subtotalAmount: subtotalAmount, // Store original subtotal
        discountPercentage: validatedData.discountPercentage, // Store discount percentage
        discountAmount: discountAmount, // Store calculated discount amount
        netAmount: finalAmount, // Store final amount after discount
        address: validatedData.address,
        status: "DELIVERED",
        products: {
          create: validatedData.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
        events: {
          create: [
            {
              status: "DELIVERED",
            },
          ],
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        user: true,
        branch: true,
      },
    });

    // Update branch product quantities
    await Promise.all(
      validatedData.items.map(async (item) => {
        await prismaClient.branchProduct.updateMany({
          where: {
            branchId: branchId,
            productId: item.productId,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      })
    );

    // Generate receipt PDF
    const pdfBuffer = await generatePDF({
      order,
      paymentMethod: validatedData.paymentMethod,
      amountPaid: validatedData.amountPaid,
    });

    // Convert buffer to base64 for frontend
    const pdfBase64 = (pdfBuffer as Buffer).toString("base64");
 await notifyAdminAboutOrder(order);
    res.status(201).json({
      message: "Order created successfully",
      order,
      receiptPdf: pdfBase64,
      sendWhatsApp: validatedData.sendWhatsApp,
    });
  } catch (error) {
    console.error("Error creating agent order:", error);
    return res.status(500).json({
      message: "Error processing the order",
      error: error.message,
    });
  }
};

export const getAgentBranchProducts = async (req: Request, res: Response) => {
  try {
    // Get the agent's branch (assuming agent is logged in)
    const agent = await prismaClient.user.findUnique({
      where: { id: req.user.id },
      include: { agentBranches: true },
    });

    if (!agent || !agent.agentBranches) {
      return res
        .status(403)
        .json({ message: "User is not an agent or not assigned to a branch" });
    }

    const branchId = agent.agentBranches.id; // Assuming agent's branchId is stored in the user object

    const products = await prismaClient.branchProduct.findMany({
      where: {
        branchId: branchId,
        quantity: {
          gt: 0, // Only get products with stock
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        product: {
          name: "asc",
        },
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching branch products:", error);
    return res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};
