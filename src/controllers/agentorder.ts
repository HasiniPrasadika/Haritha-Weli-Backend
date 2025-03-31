import { Request, Response } from "express";

import { z } from "zod";
import { generatePDF, sendWhatsAppMessage } from "../utils/pdf-generator";

import { prismaClient } from "..";

// Validation schema for agent order creation
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
});

export const createAgentOrder = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateAgentOrderSchema.parse(req.body);
    
    // Get the agent's branch (assuming agent is logged in)
    const agent = await prismaClient.user.findUnique({
      where: { id: req.user.id },
      include: { agentBranches: true }
    });
    
    if (!agent || !agent.agentBranches) {
      return res.status(403).json({ message: "User is not an agent or not assigned to a branch" });
    }
    
    const branchId = agent.agentBranches.id;// Assuming agent's branchId is stored in the user object

    // Fetch the branch to ensure it exists
    const branch = await prismaClient.branch.findUnique({
      where: { id: branchId },
    });
    
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Fetch products to validate and calculate total
    const productIds = validatedData.items.map(item => item.productId);
    const products = await prismaClient.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: "One or more products not found" });
    }

    // Create a product map for easier access
    const productMap = products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});

    // Calculate total amount
    const totalAmount = validatedData.items.reduce((total, item) => {
      const product = productMap[item.productId];
      return total + (Number(product.price) * item.quantity);
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

    // Create the order
    const order = await prismaClient.order.create({
      data: {
        userId: userId,
        branchId: branchId,
        netAmount: totalAmount,
        address: validatedData.address,
        status: "PAYMENT_DONE", // Since payment is handled in-store
        products: {
          create: validatedData.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
        events: {
          create: [
            {
              status: "PAYMENT_DONE",
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

    // Send WhatsApp message with receipt
    await sendWhatsAppMessage({
      to: validatedData.customerPhone,
      message: `Thank you for your purchase at ${branch.name}! Here's your receipt.`,
      attachment: {
        filename: `receipt-${order.id}.pdf`,
        content: pdfBuffer,
      },
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
      receiptSent: true,
    });
  } catch (error) {
    console.error("Error creating agent order:", error);
    return res.status(500).json({ 
      message: "Error processing the order", 
      error: error.message 
    });
  }
};

export const getAgentBranchProducts = async (req: Request, res: Response) => {
  try {
    // Get the agent's branch (assuming agent is logged in)
    const agent = await prismaClient.user.findUnique({
        where: { id: req.user.id },
        include: { agentBranches: true }
      });
      
      if (!agent || !agent.agentBranches) {
        return res.status(403).json({ message: "User is not an agent or not assigned to a branch" });
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
          name: 'asc',
        },
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching branch products:", error);
    return res.status(500).json({ 
      message: "Error fetching products", 
      error: error.message 
    });
  }
};