import { Request, Response } from 'express';
import { prismaClient } from '..';
import cloudinary from "cloudinary";
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from '../secrets';


// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Create a new visit record
export const createVisit = async (req: Request, res: Response) => {
  try {
    const {
      branchId,
      salesRepId,
      orderId,
      customerName,
      address,
      contactNumber,
      purposeOfVisit,
      customerSignature, // This will be a base64 string like product images
    } = req.body;

    let customerSignatureUrl = null;

    // Upload signature to Cloudinary if provided (using same approach as products)
    if (customerSignature) {
      const result = await cloudinary.v2.uploader.upload(customerSignature, {
        folder: "customer-signatures",
      });
      customerSignatureUrl = result.secure_url;
    }

    // Create visit record with the Cloudinary URL
    const visit = await prismaClient.visit.create({
      data: {
        branchId: Number(branchId),
        salesRepId: Number(salesRepId),
        orderId: orderId ? Number(orderId) : null,
        customerName,
        address,
        contactNumber,
        purposeOfVisit,
        customerSignature: customerSignatureUrl, // Store the Cloudinary URL
        visitDate: new Date(),
      },
    });

    return res.status(201).json(visit);
  } catch (error) {
    console.error('Error creating visit record:', error);
    return res.status(500).json({ message: 'Error creating visit record', error: error.message });
  }
};

// Get all visits by branch
export const getVisitsByBranch = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.id;

    const visits = await prismaClient.visit.findMany({
      where: { branchId: Number(branchId) },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
          },
        },
        order: true,
      },
      orderBy: {
        visitDate: 'desc',
      },
    });

    return res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return res.status(500).json({ message: 'Error fetching visits' });
  }
};

// Get all visits by sales rep
export const getVisitsBySalesRep = async (req: Request, res: Response) => {
  try {
    const salesRepId = req.params.id;

    const visits = await prismaClient.visit.findMany({
      where: { salesRepId: Number(salesRepId) },
      include: {
        branch: true,
        order: true,
      },
      orderBy: {
        visitDate: 'desc',
      },
    });

    return res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return res.status(500).json({ message: 'Error fetching visits' });
  }
};

// Get a specific visit by ID
export const getVisitById = async (req: Request, res: Response) => {
  try {
    const visitId = req.params.id;

    const visit = await prismaClient.visit.findUnique({
      where: { id: Number(visitId) },
      include: {
        salesRep: true,
        branch: true,
        order: true,
      },
    });

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    return res.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    return res.status(500).json({ message: 'Error fetching visit' });
  }
};

// Update a visit
export const updateVisit = async (req: Request, res: Response) => {
  try {
    const visitId = req.params.id;
    const {
      customerName,
      address,
      contactNumber,
      purposeOfVisit,
      customerSignature,
    } = req.body;

    const visit = await prismaClient.visit.update({
      where: { id: Number(visitId) },
      data: {
        customerName,
        address,
        contactNumber,
        purposeOfVisit,
        customerSignature,
      },
    });

    return res.json(visit);
  } catch (error) {
    console.error('Error updating visit:', error);
    return res.status(500).json({ message: 'Error updating visit' });
  }
};

// Delete a visit
export const deleteVisit = async (req: Request, res: Response) => {
  try {
    const visitId = req.params.id;

    await prismaClient.visit.delete({
      where: { id: Number(visitId) },
    });

    return res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    return res.status(500).json({ message: 'Error deleting visit' });
  }
};