import { NextFunction, Request, Response } from "express";
import {
  AssignAgentSchema,
  AssignRepSchema,
  CreateBranchSchema,
  UpdateBranchSchema,
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
      address: validatedData.address
      
    },
  });
  res.json(branch);
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const validatedData = UpdateBranchSchema.parse(req.body); // Allow partial updates

    if (isNaN(branchId)) {
      throw new BadRequestsException("Invalid branch ID", ErrorCode.INVALID_BRANCH_ID);
    }

    const branch = await prismaClient.branch.findUnique({ where: { id: branchId } });

    if (!branch) {
      throw new NotFoundException("Branch not found", ErrorCode.BRANCH_NOT_FOUND);
    }

    const updatedBranch = await prismaClient.branch.update({
      where: { id: branchId },
      data: {
        name: validatedData.name ?? branch.name,
        phoneNumber: validatedData.phoneNumber ?? branch.phoneNumber,
        address: validatedData.address ?? branch.address
        
      },
    });

    res.json({ message: "Branch updated successfully", updatedBranch });
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = parseInt(req.params.branchId);

    if (isNaN(branchId)) {
      throw new BadRequestsException("Invalid branch ID", ErrorCode.INVALID_BRANCH_ID);
    }

    const branch = await prismaClient.branch.findUnique({ where: { id: branchId } });

    if (!branch) {
      throw new NotFoundException("Branch not found", ErrorCode.BRANCH_NOT_FOUND);
    }

    await prismaClient.branch.delete({ where: { id: branchId } });

    res.json({ message: "Branch deleted successfully" });
  } catch (error) {
    next(error);
  }
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
        products: {
          include: {
            product: true
          }
        }, // Optionally include products assigned to the branch
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

    // Get all products assigned to the branch and include quantity from branchProduct
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
      include: {
        branches: {
          where: { branchId },
          select: { quantity: true },
        },
      },
    });

    // Map the products and add quantity information
    const productsWithQuantity = assignedProducts.map((product) => {
      // Assuming branches returns an array, we take the first item (as there should only be one per branch)
      const branchProduct = product.branches[0];

      return {
        ...product,
        price: product.price.toNumber(),
        quantity: branchProduct ? branchProduct.quantity : 0, // Default to 0 if no quantity is found
      };
    });

    res.json({ count: productsWithQuantity.length, data: productsWithQuantity });
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

export const removeProductFromBranch = async (req: Request, res: Response) => {
  const { branchId, productId } = req.body;

  let stockItem: BranchProduct;
  let product: Product;

  try {
    stockItem = await prismaClient.branchProduct.findFirstOrThrow({
      where: {
        branchId,
        productId,
      },
    });
  } catch (err) {
    throw new NotFoundException(
      "Product not found in branch",
      ErrorCode.PRODUCT_NOT_FOUND_IN_BRANCH
    );
  }

  try {
    product = await prismaClient.product.findFirstOrThrow({
      where: {
        id: productId,
      },
    });
  } catch (err) {
    throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
  }

  // Remove product from branch stock
  await prismaClient.branchProduct.delete({
    where: {
      id: stockItem.id,
    },
  });

  // Update admin stock by adding back the removed quantity
  await prismaClient.product.update({
    where: {
      id: productId,
    },
    data: {
      adminStock: product.adminStock + stockItem.quantity,
    },
  });

  res.json({ message: "Product removed from branch successfully" });
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
  const validatedData = AssignRepSchema.parse(req.body);

  const rep = await prismaClient.user.findUnique({
    where: { id: validatedData.repId },
  });

  if (!rep) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }

  if (rep.role !== "REP") {
    throw new BadRequestsException(
      "User is not a sales rep",
      ErrorCode.USER_IS_NOT_AN_REP
    );
  }

  const branch = await prismaClient.branch.findUnique({
    where: { id: validatedData.branchId },
  });

  if (!branch) {
    throw new NotFoundException("Branch not found", ErrorCode.BRANCH_NOT_FOUND);
  }

  if (branch.salesRepId) {
    throw new BadRequestsException(
      "This branch is already assigned to a rep",
      ErrorCode.BRANCH_ALREADY_ASSIGNED
    );
  }

  const updatedBranch = await prismaClient.branch.update({
    where: { id: validatedData.branchId },
    data: { salesRepId: validatedData.repId },
  });

  res.json(updatedBranch);
};


// Remove Sales Representative from Branch
export const removeRepFromBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branchId } = req.params;

    // Find the branch with the assigned sales representative
    const branch = await prismaClient.branch.findUnique({
      where: { id: parseInt(branchId, 10) },
      include: { salesRep: true },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found", ErrorCode.BRANCH_NOT_FOUND);
    }

    if (!branch.salesRep) {
      throw new BadRequestsException("No sales rep assigned to this branch", ErrorCode.NO_REP_ASSIGNED);
    }

    // Update the branch to remove the assigned sales representative
    const updatedBranch = await prismaClient.branch.update({
      where: { id: branch.id },
      data: { salesRepId: null },
    });

    res.json({ message: "Sales Representative removed successfully", updatedBranch });
  } catch (err) {
    next(err);
  }
};

// Remove Agent from Branch
export const removeAgentFromBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branchId } = req.params;

    // Find the branch with the assigned agent
    const branch = await prismaClient.branch.findUnique({
      where: { id: parseInt(branchId, 10) },
      include: { agent: true },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found", ErrorCode.BRANCH_NOT_FOUND);
    }

    if (!branch.agent) {
      throw new BadRequestsException("No agent assigned to this branch", ErrorCode.NO_AGENT_ASSIGNED);
    }

    // Update the branch to remove the assigned agent
    const updatedBranch = await prismaClient.branch.update({
      where: { id: branch.id },
      data: { agentId: null },
    });

    res.json({ message: "Agent removed successfully", updatedBranch });
  } catch (err) {
    next(err);
  }
};

