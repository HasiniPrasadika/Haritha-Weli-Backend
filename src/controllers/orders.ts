import { Request, Response } from "express";
import { prismaClient } from "..";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import md5 from "crypto-js/md5";
import { PAYHERE_MERCHANT_ID, PAYHERE_SECRET } from "../secrets";

export const checkout = async (req: Request, res: Response) => {
  const { branchId } = req.body;

  try {
    // Step 1: Fetch Cart Items for the User
    const cartItems = await prismaClient.cartItem.findMany({
      where: {
        userId: req.user.id,
        branchId: branchId,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty for this branch" });
    }

    // Step 2: Calculate total price
    const totalPrice = cartItems.reduce((prev, current) => {
      return prev + current.quantity * +current.product.price;
    }, 0);

    // Step 3: Fetch the user's default shipping address
    const address = await prismaClient.address.findFirst({
      where: {
        id: req.user.defaultShippingAddress,
      },
    });

    if (!address) {
      return res
        .status(400)
        .json({ message: "No default shipping address found" });
    }

    // Step 4: Create the order (store the order without payment initially)
    // const order = await prismaClient.order.create({
    //   data: {
    //     userId: req.user.id,
    //     branchId: branchId,
    //     netAmount: totalPrice,
    //     address: address.formattedAddress,
    //     products: {
    //       create: cartItems.map((cart) => ({
    //         productId: cart.productId,
    //         quantity: cart.quantity,
    //       })),
    //     },
    //   },
    // });

     // Generate a random order ID for the hash
     const randomOrderId = Math.floor(Math.random() * 1000000).toString();

    // hash value
    let merchantSecret = PAYHERE_SECRET;
    let merchantId = PAYHERE_MERCHANT_ID;
    let orderId = randomOrderId;
    let amount = totalPrice.toFixed();
    let hashedSecret = md5(merchantSecret).toString().toUpperCase();
    let amountFormated = parseFloat(amount)
      .toLocaleString("en-us", { minimumFractionDigits: 2 })
      .replaceAll(",", "");
    let currency = "LKR";
    let hash = md5(
      merchantId + orderId + amountFormated + currency + hashedSecret
    )
      .toString()
      .toUpperCase();

    const MD5 = require("crypto-js/md5");
    async function createHash(merchantId, orderId, amount, currency) {
      const merchantSecret = process.env.MERCHANT_SECRET;
      hash = MD5(
        merchantId +
          orderId +
          amount +
          currency +
          MD5(merchantSecret).toString().toUpperCase()
      )
        .toString()
        .toUpperCase();
      return hash;
    }

    res.status(200).json({
      totalPrice,
      orderId,
      hash,
      address,
      user: {
        name: req.user.name,
        email: req.user.email,
        phoneNumber: req.user.phoneNumber,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error processing the order", error: error.message });
  }
};

export const paymentSuccess = async (req: Request, res: Response) => {
  const { branchId } = req.body;

  try {
    // Step 1: Fetch Cart Items for the User
    const cartItems = await prismaClient.cartItem.findMany({
      where: {
        userId: req.user.id,
        branchId: branchId,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty for this branch" });
    }

    // Step 2: Calculate total price
    const totalPrice = cartItems.reduce((prev, current) => {
      return prev + current.quantity * +current.product.price;
    }, 0);

    // Step 3: Fetch the user's default shipping address
    const address = await prismaClient.address.findFirst({
      where: {
        id: req.user.defaultShippingAddress,
      },
    });

    if (!address) {
      return res
        .status(400)
        .json({ message: "No default shipping address found" });
    }

    // Step 4: Create the order (store the order without payment initially)
    const order = await prismaClient.order.create({
      data: {
        userId: req.user.id,
        branchId: branchId,
        netAmount: totalPrice,
        address: address.formattedAddress,
        status: 'PAYMENT_DONE',
        products: {
          create: cartItems.map((cart) => ({
            productId: cart.productId,
            quantity: cart.quantity,
          })),
        },
      },
    });
    // Step 5: Reduce the product quantities in branchProducts
    await Promise.all(
      cartItems.map(async (cart) => {
        await prismaClient.branchProduct.updateMany({
          where: {
            branchId: branchId,
            productId: cart.productId,
          },
          data: {
            quantity: {
              decrement: cart.quantity,
            },
          },
        });
      })
    );
     // Step 6: Remove the cart items from the user's cart for the relevant branch
     await prismaClient.cartItem.deleteMany({
      where: {
        userId: req.user.id,
        branchId: branchId,
      },
    });


    res.status(200).json(order);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error processing the order", error: error.message });
  }
};
export const handlePaymentNotification = async (req: Request, res: Response) => {
  try {
    const { order_id, payment_id, status_code } = req.body;

    if (status_code === "2") {
      // Order creation logic here
      res.status(200).json({ message: "Order created successfully" });
    } else {
      res.status(400).json({ message: "Payment not successful" });
    }
  } catch (error) {
    console.error("Payment notification handling failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Payment failure callback (if the user cancels the payment)
export const paymentCancel = (req: Request, res: Response) => {
  return res.status(400).json({ message: "Payment canceled" });
};

// Payment notification callback (PayHere sends this when the payment is completed)
export const paymentNotify = async (req: Request, res: Response) => {
  const { order_id, payment_status, payment_id } = req.body;

  if (payment_status === "Completed") {
    try {
      // Find the order
      const order = await prismaClient.order.update({
        where: { id: +order_id },
        data: {
          status: "PAYMENT_DONE", // Mark order as paid
        },
      });

      // Record payment event
      await prismaClient.orderEvent.create({
        data: {
          orderId: order.id,
          status: "PAYMENT_DONE",
        },
      });

      return res
        .status(200)
        .json({ message: "Payment successfully processed" });
    } catch (error) {
      return res.status(500).json({
        message: "Error processing payment notification",
        error: error.message,
      });
    }
  } else {
    return res.status(400).json({ message: "Payment failed or was canceled" });
  }
};

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
    skip: +req.query.skip || 0,
    include: {
      products: {
        include: {
          product: true
        }
      },
      user: true,
      branch: {
        include: {
          agent: true,
          salesRep: true
        }
      }
    }
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
