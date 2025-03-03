import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { prismaClient } from "..";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import cloudinary from "cloudinary";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../secrets";
import { BadRequestsException } from "../exceptions/bad_requests";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const createProduct = async (req: Request, res: Response) => {
  try {
    console.log(req.body)
    const {
      name,
      mixing,
      applicationMethod,
      storage,
      volume,
      price,
      adminStock,
      productImage,
      usageImage,
    } = req.body;

    let productImageUrl = null;
    let usageImageUrl = null;

    if (productImage) {
      let result = await cloudinary.v2.uploader.upload(productImage, {
        folder: "products",
      });
      productImageUrl = result.secure_url;
    }

    if (usageImage) {
      let result = await cloudinary.v2.uploader.upload(usageImage, {
        folder: "usageImages",
      });
      usageImageUrl = result.secure_url;
    }
    const productt = await prismaClient.product.findFirst({
      where: {
        name: name,
      },
    });
    if (productt) {
      throw new BadRequestsException(
        "Product already exists!",
        ErrorCode.PRODUCT_ALREADY_EXISTS
      );
    }
    // Create product with Cloudinary image URLs
    const product = await prismaClient.product.create({
      data: {
        name,
        productImage: productImageUrl,
        usageImage: usageImageUrl,
        mixing,
        applicationMethod,
        storage,
        volume: parseInt(volume), // Ensure numeric values are parsed correctly
        price: parseFloat(price),
        adminStock: parseInt(adminStock),
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: error.message });
  }
};



export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = req.body;

    const updatedProduct = await prismaClient.product.update({
      where: {
        id: +req.params.id,
      },
      data: product,
    });
    res.json(updatedProduct);
  } catch (err) {
    throw new NotFoundException(
      "Product Not Found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deletedProduct = await prismaClient.product.delete({
      where: {
        id: +req.params.id,
      },
    });
    res.json(deletedProduct);
  } catch (err) {
    throw new NotFoundException(
      "Product Not Found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
};

export const listProducts = async (req: Request, res: Response) => {
  // {
  //     count: 100,
  //     data: []
  // }

  const count = await prismaClient.product.count();
  const products = await prismaClient.product.findMany({
    skip: +req.query.skip || 0,
  });
  res.json({
    count,
    data: products,
  });
};




export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await prismaClient.product.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
    });
    res.json(product);
  } catch (err) {
    throw new NotFoundException(
      "Product Not Found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  console.log("searched hfjhgdhfcb djhgfcghdv dgvhg");
  const products = await prismaClient.product.findMany({
    where: {
      name: {
        search: req.query.q.toString(),
      },
    },
  });
  res.json(products);
};
