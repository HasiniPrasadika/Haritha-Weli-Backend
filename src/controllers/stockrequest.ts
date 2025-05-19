import { NextFunction, Request, Response } from "express";
import { prismaClient } from "..";
import { BadRequestsException } from "../exceptions/bad_requests";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { z } from "zod";
import { notifyAdminAboutStockRequest } from "./whatsapp";

// Validation schemas
const CreateStockRequestSchema = z.object({
  branchId: z.number(),
  note: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number(),
      requestedQuantity: z.number().positive(),
    })
  ),
});

const ApproveStockRequestSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.number(),
      approvedQuantity: z.number().nonnegative(),
    })
  ),
  note: z.string().optional(),
});

const ReceiveStockSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.number(),
      receivedQuantity: z.number().nonnegative(),
    })
  ),
  note: z.string().optional(),
});

// Create a new stock request (by agent)
export const createStockRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id; // Assuming you have authentication middleware that sets req.user
    const validatedData = CreateStockRequestSchema.parse(req.body);

    // Check if branch exists
    const branch = await prismaClient.branch.findUnique({
      where: { id: validatedData.branchId },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found", ErrorCode.BRANCH_NOT_FOUND);
    }

    // Check if user is agent of this branch
    if (branch.agentId !== userId) {
      throw new UnauthorizedException(
        "You are not authorized to request stock for this branch",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Create stock request with items
    const stockRequest = await prismaClient.stockRequest.create({
      data: {
        branchId: validatedData.branchId,
        createdById: userId,
        note: validatedData.note,
        status: "PENDING",
        items: {
          create: await Promise.all(
            validatedData.items.map(async (item) => {
              // Check if product exists and is associated with the branch
              const branchProduct = await prismaClient.branchProduct.findFirst({
                where: {
                  branchId: validatedData.branchId,
                  productId: item.productId,
                },
                include: {
                  product: true,
                },
              });

              if (!branchProduct) {
                throw new NotFoundException(
                  `Product with ID ${item.productId} not found in branch`,
                  ErrorCode.PRODUCT_NOT_FOUND_IN_BRANCH
                );
              }

              return {
                productId: item.productId,
                requestedQuantity: item.requestedQuantity,
              };
            })
          ),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await notifyAdminAboutStockRequest(stockRequest);

    res.status(201).json({
      message: "Stock request created successfully",
      stockRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Get all stock requests (for admin)
export const getAllStockRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;

    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const stockRequests = await prismaClient.stockRequest.findMany({
      where: whereClause,
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(stockRequests);
  } catch (error) {
    next(error);
  }
};

// Get branch stock requests (for agent)
export const getBranchStockRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const status = req.query.status as string;

    // Find branches where the user is an agent
    const branch = await prismaClient.branch.findFirst({
      where: {
        agentId: userId,
      },
    });

    if (!branch) {
      throw new NotFoundException(
        "You are not assigned to any branch as an agent",
        ErrorCode.NO_BRANCH_ASSIGNED
      );
    }

    const whereClause: any = {
      branchId: branch.id,
    };

    if (status) {
      whereClause.status = status;
    }

    const stockRequests = await prismaClient.stockRequest.findMany({
      where: whereClause,
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(stockRequests);
  } catch (error) {
    next(error);
  }
};

// Get stock request details
export const getStockRequestDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestId = parseInt(req.params.requestId);

    if (isNaN(requestId)) {
      throw new BadRequestsException("Invalid request ID", ErrorCode.INVALID_REQUEST_ID);
    }

    const stockRequest = await prismaClient.stockRequest.findUnique({
      where: { id: requestId },
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!stockRequest) {
      throw new NotFoundException("Stock request not found", ErrorCode.REQUEST_NOT_FOUND);
    }

    res.json(stockRequest);
  } catch (error) {
    next(error);
  }
};

// Approve or reject a stock request (by admin)
export const approveStockRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);
    const action = req.query.action as string;
    
    if (isNaN(requestId)) {
      throw new BadRequestsException("Invalid request ID", ErrorCode.INVALID_REQUEST_ID);
    }

    if (action !== "approve" && action !== "reject") {
      throw new BadRequestsException("Invalid action", ErrorCode.INVALID_ACTION);
    }

    // Check if user is admin
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "ADMIN") {
      throw new UnauthorizedException(
        "Only admins can approve or reject stock requests",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Check if request exists and is pending
    const stockRequest = await prismaClient.stockRequest.findUnique({
      where: { id: requestId },
      include: {
        items: true,
      },
    });

    if (!stockRequest) {
      throw new NotFoundException("Stock request not found", ErrorCode.REQUEST_NOT_FOUND);
    }

    if (stockRequest.status !== "PENDING") {
      throw new BadRequestsException(
        "Stock request is not in pending state",
        ErrorCode.INVALID_REQUEST_STATUS
      );
    }

    if (action === "reject") {
      // Reject the request
      const updatedRequest = await prismaClient.stockRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          approvedById: userId,
          note: req.body.note || "Request rejected by admin",
        },
        include: {
          items: true,
          branch: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json({
        message: "Stock request rejected successfully",
        stockRequest: updatedRequest,
      });
    }

    // Approve the request
    const validatedData = ApproveStockRequestSchema.parse(req.body);

    // Check if all items in the request are included in the approval
    const requestItemIds = new Set(stockRequest.items.map((item) => item.id));
    validatedData.items.forEach((item) => {
      if (!requestItemIds.has(item.itemId)) {
        throw new BadRequestsException(
          `Item with ID ${item.itemId} is not part of this request`,
          ErrorCode.INVALID_ITEM_ID
        );
      }
    });

    // Update each item with approved quantity
    await Promise.all(
      validatedData.items.map(async (item) => {
        // Find the original request item
        const requestItem = stockRequest.items.find((ri) => ri.id === item.itemId);
        
        // Check admin stock
        const product = await prismaClient.product.findUnique({
          where: { id: requestItem.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product not found for item ${item.itemId}`,
            ErrorCode.PRODUCT_NOT_FOUND
          );
        }

        if (product.adminStock < item.approvedQuantity) {
          throw new BadRequestsException(
            `Insufficient admin stock for product ${product.name}. Available: ${product.adminStock}`,
            ErrorCode.INSUFFICIENT_STOCK
          );
        }

        // Update the request item
        await prismaClient.stockRequestItem.update({
          where: { id: item.itemId },
          data: {
            approvedQuantity: item.approvedQuantity,
          },
        });
      })
    );

    // Update the request status
    const updatedRequest = await prismaClient.stockRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: userId,
        note: validatedData.note || "Request approved by admin",
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Stock request approved successfully",
      stockRequest: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Mark stock as received (by agent)
export const receiveStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);

    if (isNaN(requestId)) {
      throw new BadRequestsException("Invalid request ID", ErrorCode.INVALID_REQUEST_ID);
    }

    // Get the stock request
    const stockRequest = await prismaClient.stockRequest.findUnique({
      where: { id: requestId },
      include: {
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!stockRequest) {
      throw new NotFoundException("Stock request not found", ErrorCode.REQUEST_NOT_FOUND);
    }

    // Check if user is the agent of this branch
    if (stockRequest.branch.agentId !== userId) {
      throw new UnauthorizedException(
        "You are not authorized to receive stock for this branch",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Check if request is in approved state
    if (stockRequest.status !== "DELIVERED") {
      throw new BadRequestsException(
        "Stock request is not in delivered state",
        ErrorCode.INVALID_REQUEST_STATUS
      );
    }

    const validatedData = ReceiveStockSchema.parse(req.body);

    // Process each item
    await Promise.all(
      validatedData.items.map(async (item) => {
        // Find the request item
        const requestItem = stockRequest.items.find((ri) => ri.id === item.itemId);
        
        if (!requestItem) {
          throw new BadRequestsException(
            `Item with ID ${item.itemId} is not part of this request`,
            ErrorCode.INVALID_ITEM_ID
          );
        }

        if (item.receivedQuantity > requestItem.approvedQuantity) {
          throw new BadRequestsException(
            `Received quantity (${item.receivedQuantity}) cannot be greater than approved quantity (${requestItem.approvedQuantity})`,
            ErrorCode.INVALID_QUANTITY
          );
        }

        // Update the request item
        await prismaClient.stockRequestItem.update({
          where: { id: item.itemId },
          data: {
            receivedQuantity: item.receivedQuantity,
          },
        });

        // Update admin stock (reduce by received quantity)
        await prismaClient.product.update({
          where: { id: requestItem.productId },
          data: {
            adminStock: {
              decrement: item.receivedQuantity,
            },
          },
        });

        // Update branch stock
        const branchProduct = await prismaClient.branchProduct.findFirst({
          where: {
            branchId: stockRequest.branchId,
            productId: requestItem.productId,
          },
        });

        if (branchProduct) {
          await prismaClient.branchProduct.update({
            where: { id: branchProduct.id },
            data: {
              quantity: {
                increment: item.receivedQuantity,
              },
            },
          });
        } else {
          // If the product was not in the branch before, create it
          await prismaClient.branchProduct.create({
            data: {
              branchId: stockRequest.branchId,
              productId: requestItem.productId,
              quantity: item.receivedQuantity,
            },
          });
        }
      })
    );

    // Update the request status
    const updatedRequest = await prismaClient.stockRequest.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        note: validatedData.note || "Stock received by agent",
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Stock received successfully",
      stockRequest: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Mark stock as delivered (by admin)
export const markStockAsDelivered = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);

    if (isNaN(requestId)) {
      throw new BadRequestsException("Invalid request ID", ErrorCode.INVALID_REQUEST_ID);
    }

    // Check if user is admin
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "ADMIN") {
      throw new UnauthorizedException(
        "Only admins can mark stock as delivered",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Get the stock request
    const stockRequest = await prismaClient.stockRequest.findUnique({
      where: { id: requestId },
    });

    if (!stockRequest) {
      throw new NotFoundException("Stock request not found", ErrorCode.REQUEST_NOT_FOUND);
    }

    // Check if request is in approved state
    if (stockRequest.status !== "APPROVED") {
      throw new BadRequestsException(
        "Stock request is not in approved state",
        ErrorCode.INVALID_REQUEST_STATUS
      );
    }

    // Update the request status
    const updatedRequest = await prismaClient.stockRequest.update({
      where: { id: requestId },
      data: {
        status: "DELIVERED",
        note: req.body.note || "Stock marked as delivered by admin",
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Stock marked as delivered successfully",
      stockRequest: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a stock request (by admin or creator)
export const deleteStockRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);

    if (isNaN(requestId)) {
      throw new BadRequestsException("Invalid request ID", ErrorCode.INVALID_REQUEST_ID);
    }

    // Get the stock request
    const stockRequest = await prismaClient.stockRequest.findUnique({
      where: { id: requestId },
      include: {
        branch: true,
      },
    });

    if (!stockRequest) {
      throw new NotFoundException("Stock request not found", ErrorCode.REQUEST_NOT_FOUND);
    }

    // Check authorization - only admin or creator can delete
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    const isAdmin = user?.role === "ADMIN";
    const isCreator = stockRequest.createdById === userId;

    if (!isAdmin && !isCreator) {
      throw new UnauthorizedException(
        "You are not authorized to delete this stock request",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Only allow deletion of requests in PENDING state
    if ((stockRequest.status !== "PENDING") && (stockRequest.status !== "COMPLETED") && (stockRequest.status !== "REJECTED")) {
      throw new BadRequestsException(
        "Only pending abd completed stock requests can be deleted",
        ErrorCode.INVALID_REQUEST_STATUS
      );
    }

    // Delete related items first
    await prismaClient.stockRequestItem.deleteMany({
      where: { requestId: requestId },
    });

    // Delete the stock request
    await prismaClient.stockRequest.delete({
      where: { id: requestId },
    });

    res.json({
      message: "Stock request deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update a stock request (by creator)
export const updateStockRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);

    if (isNaN(requestId)) {
      throw new BadRequestsException("Invalid request ID", ErrorCode.INVALID_REQUEST_ID);
    }

    // Validate request body
    const validatedData = z.object({
      note: z.string().optional(),
      items: z.array(
        z.object({
          id: z.number().optional(), // Existing item ID (if updating)
          productId: z.number(),
          requestedQuantity: z.number().positive(),
        })
      ),
    }).parse(req.body);

    // Get the stock request
    const stockRequest = await prismaClient.stockRequest.findUnique({
      where: { id: requestId },
      include: {
        items: true,
        branch: true,
      },
    });

    if (!stockRequest) {
      throw new NotFoundException("Stock request not found", ErrorCode.REQUEST_NOT_FOUND);
    }

    // Check if user is the creator
    if (stockRequest.createdById !== userId) {
      throw new UnauthorizedException(
        "You are not authorized to update this stock request",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Only allow updates to requests in PENDING state
    if (stockRequest.status !== "PENDING") {
      throw new BadRequestsException(
        "Only pending stock requests can be updated",
        ErrorCode.INVALID_REQUEST_STATUS
      );
    }

    // Process items
    const existingItemIds = new Set(stockRequest.items.map(item => item.id));
    const updatedItemIds = new Set();
    
    // Process each item in the request
    for (const item of validatedData.items) {
      // Check if product exists and is associated with the branch
      const branchProduct = await prismaClient.branchProduct.findFirst({
        where: {
          branchId: stockRequest.branchId,
          productId: item.productId,
        },
        include: {
          product: true,
        },
      });

      if (!branchProduct) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found in branch`,
          ErrorCode.PRODUCT_NOT_FOUND_IN_BRANCH
        );
      }

      if (item.id) {
        // Update existing item
        if (!existingItemIds.has(item.id)) {
          throw new BadRequestsException(
            `Item with ID ${item.id} is not part of this request`,
            ErrorCode.INVALID_ITEM_ID
          );
        }

        await prismaClient.stockRequestItem.update({
          where: { id: item.id },
          data: {
            productId: item.productId,
            requestedQuantity: item.requestedQuantity,
          },
        });
        
        updatedItemIds.add(item.id);
      } else {
        // Create new item
        const newItem = await prismaClient.stockRequestItem.create({
          data: {
            requestId: requestId,
            productId: item.productId,
            requestedQuantity: item.requestedQuantity,
          },
        });
        
        updatedItemIds.add(newItem.id);
      }
    }

    // Delete items that were not included in the update
    for (const itemId of existingItemIds) {
      if (!updatedItemIds.has(itemId)) {
        await prismaClient.stockRequestItem.delete({
          where: { id: itemId },
        });
      }
    }

    // Update the request
    const updatedRequest = await prismaClient.stockRequest.update({
      where: { id: requestId },
      data: {
        note: validatedData.note,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Stock request updated successfully",
      stockRequest: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};