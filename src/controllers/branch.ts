import { NextFunction, Request, Response } from "express";
import {
  AssignAgentSchema,
  AssignRepSchema,
  CreateBranchSchema,
  UpdateStockSchema,
} from "../schema/branch";
import { prismaClient } from "..";
import { Branch, BranchProduct, Product } from "@prisma/client";
import { ErrorCode } from "../exceptions/root";
import { NotFoundException } from "../exceptions/not-found";
import { BadRequestsException } from "../exceptions/bad_requests";
import { updateProduct } from "./products";

export const createBranch = async (req: Request, res: Response) => {
  const validatedData = CreateBranchSchema.parse(req.body);

  const branch = await prismaClient.branch.create({
    data: {
      name: validatedData.name,
      phoneNumber: validatedData.phoneNumber,
    },
  });
  res.json(branch);
};

export const getBranchDetails = async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId);

    // Check if branchId is valid
    if (isNaN(branchId)) {
      throw new BadRequestsException(
        "Invalid branch ID",
        ErrorCode.INVALID_BRANCH_ID
      );
    }

    const branch = await prismaClient.branch.findUnique({
      where: { id: branchId },
      include: {
        agent: true, // Include agent details
        salesRep: true, // Include sales representative details
        products: true, // Optionally include products assigned to the branch
      },
    });

    if (!branch) {
      throw new NotFoundException(
        "Branch not found",
        ErrorCode.BRANCH_NOT_FOUND
      );
    }

    res.json(branch);
  } catch (error) {
    console.error("Error fetching branch details:", error);
    res.status(500).json({ error: error.message });
  }
};

export const listBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prismaClient.branch.findMany({
      include: {
        agent: true, // Include agent details if applicable
        salesRep: true, // Include sales representative details if applicable
        products: true, // Include branch products if needed
      },
    });

    res.json(branches);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve branches", error: error.message });
  }
};

export const listAssignedProducts = async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId);

    // Check if branchId is valid
    if (isNaN(branchId)) {
      throw new BadRequestsException(
        "Invalid branch ID",
        ErrorCode.INVALID_BRANCH_ID
      );
    }

    // Get all products that are NOT in branchProduct for the given branchId
    const assignedProducts = await prismaClient.product.findMany({
      where: {
        id: {
          in: (
            await prismaClient.branchProduct.findMany({
              where: { branchId },
              select: { productId: true },
            })
          ).map((bp) => bp.productId),
        },
      },
    });

    res.json({ count: assignedProducts.length, data: assignedProducts });
  } catch (error) {
    console.error("Error fetching assigned products:", error);
    res.status(500).json({ error: error.message });
  }
};

export const listUnassignedProducts = async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId);

    // Check if branchId is valid
    if (isNaN(branchId)) {
      throw new BadRequestsException(
        "Invalid branch ID",
        ErrorCode.INVALID_BRANCH_ID
      );
    }

    // Get all products that are NOT in branchProduct for the given branchId
    const unassignedProducts = await prismaClient.product.findMany({
      where: {
        id: {
          notIn: (
            await prismaClient.branchProduct.findMany({
              where: { branchId },
              select: { productId: true },
            })
          ).map((bp) => bp.productId),
        },
      },
    });

    res.json({ count: unassignedProducts.length, data: unassignedProducts });
  } catch (error) {
    console.error("Error fetching unassigned products:", error);
    res.status(500).json({ error: error.message });
  }
};

export const addProductsToBranch = async (req: Request, res: Response) => {
  const validatedData = UpdateStockSchema.parse(req.body);
  let product: Product;
  let stock: BranchProduct;

  try {
    product = await prismaClient.product.findFirstOrThrow({
      where: {
        id: validatedData.productId,
      },
    });
  } catch (err) {
    throw new NotFoundException(
      "Product not found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
  if (product.adminStock == 0) {
    throw new NotFoundException("Out of Stock", ErrorCode.OUT_OF_STOCK);
  }

  let stockItem = await prismaClient.branchProduct.findFirst({
    where: {
      product,
      branchId: validatedData.branchId, // Make sure you pass the correct branchId value
    },
  });

  if (stockItem) {
    throw new NotFoundException(
      "Product already added",
      ErrorCode.PRODUCT_ALREADY_ADDED
    );
    // stock = await prismaClient.branchProduct.update({
    //     where: {
    //         id: stockItem.id
    //     },
    //     data:{
    //         quantity: stockItem.quantity + validatedData.quantity
    //     }
    // })
    // product = await prismaClient.product.update({
    //     where:{
    //         id: validatedData.productId
    //     },
    //     data:{
    //         adminStock: product.adminStock - validatedData.quantity
    //     }
    // })
  } else {
    stock = await prismaClient.branchProduct.create({
      data: {
        branchId: validatedData.branchId,
        productId: product.id,
        quantity: validatedData.quantity,
      },
    });
    product = await prismaClient.product.update({
      where: {
        id: validatedData.productId,
      },
      data: {
        adminStock: product.adminStock - validatedData.quantity,
      },
    });
  }
  res.json(stock);
};

export const updateBranchStock = async (req: Request, res: Response) => {
  const validatedData = UpdateStockSchema.parse(req.body);
  let product: Product;
  let stock: BranchProduct;

  try {
    product = await prismaClient.product.findFirstOrThrow({
      where: {
        id: validatedData.productId,
      },
    });
  } catch (err) {
    throw new NotFoundException(
      "Product not found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
  if (product.adminStock == 0) {
    throw new NotFoundException("Out of Stock", ErrorCode.OUT_OF_STOCK);
  }

  let stockItem = await prismaClient.branchProduct.findFirst({
    where: {
      product,
      branchId: validatedData.branchId, // Make sure you pass the correct branchId value
    },
  });

  if (stockItem) {
    stock = await prismaClient.branchProduct.update({
      where: {
        id: stockItem.id,
      },
      data: {
        quantity: stockItem.quantity + validatedData.quantity,
      },
    });
    product = await prismaClient.product.update({
      where: {
        id: validatedData.productId,
      },
      data: {
        adminStock: product.adminStock - validatedData.quantity,
      },
    });
  } else {
    throw new NotFoundException(
      "Product not added to this branch",
      ErrorCode.PRODUCT_NOT_ADDED
    );
  }
  res.json(stock);
};

export const assignAgent = async (req: Request, res: Response) => {
  let updatedBranch: Branch;
  const validatedData = AssignAgentSchema.parse(req.body);

  const agent = await prismaClient.user.findUnique({
    where: {
      id: validatedData.agentId,
    },
  });

  if (!agent) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }
  if (agent.role !== "AGENT") {
    throw new BadRequestsException(
      "User is not an agent",
      ErrorCode.USER_IS_NOT_AN_AGENT
    );
  }

  // Check if the agent is already assigned to another branch
  const existingAssignment = await prismaClient.branch.findFirst({
    where: { agentId: validatedData.agentId },
  });

  if (existingAssignment) {
    throw new BadRequestsException(
      "Agent is already assigned to a branch",
      ErrorCode.AGENT_ALREADY_ASSIGNED
    );
  }

  updatedBranch = await prismaClient.branch.update({
    where: { id: validatedData.branchId },
    data: { agentId: validatedData.agentId },
  });

  res.json(updatedBranch);
};

export const assignRep = async (req: Request, res: Response) => {
  let updatedBranch: Branch;
  const validatedData = AssignRepSchema.parse(req.body);

  const rep = await prismaClient.user.findUnique({
    where: {
      id: validatedData.repId,
    },
  });

  if (!rep) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }
  if (rep.role !== "REP") {
    throw new BadRequestsException(
      "User is not an sales rep",
      ErrorCode.USER_IS_NOT_AN_REP
    );
  }

  // Check if the agent is already assigned to another branch
  const existingAssignment = await prismaClient.branch.findFirst({
    where: { salesRepId: validatedData.repId },
  });

  if (existingAssignment) {
    throw new BadRequestsException(
      "Sales rep is already assigned to a branch",
      ErrorCode.REP_ALREADY_ASSIGNED
    );
  }

  updatedBranch = await prismaClient.branch.update({
    where: { id: validatedData.branchId },
    data: { salesRepId: validatedData.repId },
  });

  res.json(updatedBranch);
};
