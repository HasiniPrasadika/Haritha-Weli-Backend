import { Request, Response } from "express";
import { prismaClient } from "..";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";

export const createOrder = async (req: Request, res: Response) => {
  return await prismaClient.$transaction(async (tx) => {
    const { branchId } = req.body; // Get branch ID from request

    // Ensure branch is valid
    const branch = await tx.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return res.status(400).json({ message: "Invalid branch selected" });
    }

    // Fetch cart items for the user
    const cartItems = await tx.cartItem.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return res.json({ message: "Cart is empty" });
    }
    
    // Calculate total price
    const totalPrice = cartItems.reduce((prev, current) => {
      return prev + current.quantity * +current.product.price;
    }, 0);

    // Fetch user's default shipping address
    const address = await tx.address.findFirst({
      where: {
        id: req.user.defaultShippingAddress,
      },
    });

    if (!address) {
      return res
        .status(400)
        .json({ message: "No default shipping address found" });
    }

    // Create order with branch association
    const order = await tx.order.create({
      data: {
        userId: req.user.id,        
        branchId: branchId, // Associate order with branch
        netAmount: totalPrice,
        address: address.formattedAddress,
        products: {
          create: cartItems.map((cart) => ({
            productId: cart.productId,
            quantity: cart.quantity,
          })),
        },
      },
    });

    // Create an order event
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
      },
    });

    // Empty user's cart after order is placed
    await tx.cartItem.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    return res.json(order);
  });
};

// export const createOrder = async(req:Request, res:Response) => {
//     // 1. to create a transaction
//     // 2. to list all the cart items and proceed if cart is not empty
//     // 3. calculate the total amount
//     // 4. fetch address of user
//     // 5. to define computed field for formatted address on address model
//     // 6. we will create a order and order products
//     // 7. create event
//     // 8. empty the cart
//     return await prismaClient.$transaction(async(tx) => {
//         const cartItems = await tx.cartItem.findMany({
//             where: {
//                 userId: req.user.id
//             },
//             include: {
//                 product: true
//             }
//         })
//         if(cartItems.length == 0){
//             return res.json({message: 'cart is empty'})
//         }
//         const price = cartItems.reduce((prev, current) => {
//             return prev + (current.quantity * +current.product.price)
//         },0)
//         const address = await tx.address.findFirst({
//             where:{
//                 id: req.user.defaultShippingAddress
//             }
//         })

//         const order = await tx.order.create({
//             data: {
//                 userId: req.user.id,
//                 netAmount: price,
//                 address: address.formattedAddress,
//                 products: {
//                     create: cartItems.map((cart) => {
//                         return {
//                             productId: cart.productId,
//                             quantity: cart.quantity
//                         }
//                     })
//                 }
//             }
//         })

//         const orderEvent = await tx.orderEvent.create({
//             data: {
//                 orderId: order.id,
//             }
//         })
//         await tx.cartItem.deleteMany({
//             where: {
//                 userId: req.user.id
//             }
//         })
//         return res.json(order)
//     })
// }

export const listOrders = async (req: Request, res: Response) => {
  const orders = await prismaClient.order.findMany({
    where: {
      userId: req.user.id,
    },
  });
  res.json(orders);
};
export const getOrdersByBranch = async (req: Request, res: Response) => {
    try {
      const { branchId } = req.params; // Get branchId from request parameters
  
      const orders = await prismaClient.order.findMany({
        where: { branchId: Number(branchId) }, // Convert branchId to a number
        include: {
          user: true, // Include user details
          products: true, // Include ordered products
        },
      });
  
      return res.json(orders);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching orders" });
    }
  };
  
export const cancelOrder = async (req: Request, res: Response) => {
  // 1. wrap it inside transaction
  // 2. check if the user is cancelling its own order
  try {
    const order = await prismaClient.order.update({
      where: {
        id: +req.params.id,
      },
      data: {
        status: "CANCELLED",
      },
    });
    await prismaClient.orderEvent.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
      },
    });
    res.json(order);
  } catch (err) {
    throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await prismaClient.order.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
      include: {
        products: true,
        events: true,
      },
    });
    res.json(order);
  } catch (err) {
    throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
  }
};

export const listAllOrders = async (req: Request, res: Response) => {
  let whereClause = {};
  const status = req.query.status;
  if (status) {
    whereClause = {
      status,
    };
  }
  const orders = await prismaClient.order.findMany({
    where: whereClause,
    skip: +req.query.skip || 0
  
  });
  res.json(orders);
};

export const changeStatus = async (req: Request, res: Response) => {
  // wrap it inside transaction
  try {
    const order = await prismaClient.order.update({
      where: {
        id: +req.params.id,
      },
      data: {
        status: req.body.status,
      },
    });
    await prismaClient.orderEvent.create({
      data: {
        orderId: order.id,
        status: req.body.status,
      },
    });
    res.json(order);
  } catch (err) {
    throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
  }
};

export const listUserOrders = async (req: Request, res: Response) => {
  let whereClause: any = {
    userId: +req.params.id,
  };
  const status = req.params.status;
  if (status) {
    whereClause = {
      ...whereClause,
      status,
    };
  }
  const orders = await prismaClient.order.findMany({
    where: whereClause,
    skip: +req.query.skip || 0,
   
  });
  res.json(orders);
};
