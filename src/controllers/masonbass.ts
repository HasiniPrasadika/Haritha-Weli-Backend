import { prismaClient } from "..";
import { Request, Response } from "express";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { BadRequestsException } from "../exceptions/bad_requests";

export const createMasonBass = async (req: Request, res: Response) => {
  try {
    console.log(req.body)
    const {
      bassName,
      location,
      phoneNumber,
      description,
      code,
      bassDiscount,
    } = req.body;

   
    const bass = await prismaClient.masonBass.findFirst({
      where: {
        code: code,
      },
    });
    if (bass) {
      throw new BadRequestsException(
        "Code already exists!",
        ErrorCode.CODE_ALREADY_EXISTS
      );
    }

    const masonbass = await prismaClient.masonBass.create({
      data: {
        bassName,
        location,
        phoneNumber,
        description,
        code,
        bassDiscount,
      },
    });

    res.status(201).json(masonbass);
  } catch (error: any) {
    console.error("Error creating mason bass:", error);
    if (error instanceof BadRequestsException) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

export const updateMasonBass = async (req: Request, res: Response) => {
  try {
    const {
      bassName,
      location,
      phoneNumber,
      description,
      code,
      bassDiscount,
    } = req.body;

    const bassId = +req.params.id;

    const existingBass = await prismaClient.masonBass.findUnique({
      where: { id: bassId },
    });

    if (!existingBass) {
      throw new NotFoundException(
        "Mason Bass Not Found",
        ErrorCode.BASS_NOT_FOUND
      );
    }

    // Check if the code already exists for a different mason bass
    const duplicateCodeBass = await prismaClient.masonBass.findFirst({
      where: {
        code: code,
        id: {
          not: bassId, // Exclude the current record being updated
        },
      },
    });

    if (duplicateCodeBass) {
      throw new BadRequestsException(
        "Code already exists!",
        ErrorCode.CODE_ALREADY_EXISTS
      );
    }

    const updatedBass = await prismaClient.masonBass.update({
      where: { id: bassId },
      data: {
        bassName,
        location,
        phoneNumber,
        description,
        code,
        bassDiscount,
      },
    });

    res.json(updatedBass);
  } catch (error: any) {
    console.error("Error updating mason bass:", error);
    if (error instanceof NotFoundException) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof BadRequestsException) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const deleteMasonBass = async (req: Request, res: Response) => {
  try {
    const deletedBass = await prismaClient.masonBass.delete({
      where: {
        id: +req.params.id,
      },
    });
    res.json(deletedBass);
  } catch (err) {
    throw new NotFoundException(
      "Mason Bass Not Found",
      ErrorCode.BASS_NOT_FOUND
    );
  }
};

export const listMasonBass = async (req: Request, res: Response) => {
  const count = await prismaClient.masonBass.count();
  const masonbass = await prismaClient.masonBass.findMany({
    skip: +req.query.skip || 0,
  });
  res.json({
    count,
    data: masonbass,
  });
};