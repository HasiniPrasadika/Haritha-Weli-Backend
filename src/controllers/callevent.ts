import { Request, Response } from "express";
import { prismaClient } from "..";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";

export const createCallEvent = async (req: Request, res: Response) => {
  console.log(req.body);
  const {
    agentName,
    callerName,
    callerNumber,
    callSource,
    productOfInterest,
    customerLocation,
    reasonForCall,
    action,
    followUpNeeded,
    followUpDate,
    callStatus,
    followUpStage,
  } = req.body;

  try {
    const callEvent = await prismaClient.callEvent.create({
      data: {
        agentName,
        callerName,
        callerNumber,
        callSource,
        productOfInterest,
        customerLocation,
        reasonForCall,
        action,
        followUpNeeded,
        followUpDate,
        callStatus,
        followUpStage,
      },
    });

    res.status(200).json(callEvent);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating the call event", error: error.message });
  }
};

export const listCallEvents = async (req: Request, res: Response) => {
  const count = await prismaClient.callEvent.count();
  const callEvents = await prismaClient.callEvent.findMany({
    skip: +req.query.skip || 0,
  });
  res.json({
    count,
    data: callEvents,
  });
};

export const updateCallEvent = async (req: Request, res: Response) => {
  try {
    const {
      agentName,
      callerName,
      callerNumber,
      callSource,
      productOfInterest,
      customerLocation,
      reasonForCall,
      action,
      followUpNeeded,
      followUpDate,
      callStatus,
      followUpStage,
    } = req.body;

    const callEventId = +req.params.id;

    // Check if the product exists
    const existingCallEvent = await prismaClient.callEvent.findUnique({
      where: { id: callEventId },
    });

    if (!existingCallEvent) {
      throw new NotFoundException("Call Not Found", ErrorCode.CALL_NOT_FOUND);
    }

    // Update the product with new data
    const updatedCallEvent = await prismaClient.callEvent.update({
      where: { id: callEventId },
      data: {
        agentName,
        callerName,
        callerNumber,
        callSource,
        productOfInterest,
        customerLocation,
        reasonForCall,
        action,
        followUpNeeded,
        followUpDate,
        callStatus,
        followUpStage,
      },
    });

    res.json(updatedCallEvent);
  } catch (error: any) {
    console.error("Error updating call event:", error);
    if (error instanceof NotFoundException) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const deleteCallEvent = async (req: Request, res: Response) => {
  try {
    const deletedCallEvent = await prismaClient.callEvent.delete({
      where: {
        id: +req.params.id,
      },
    });
    res.json(deletedCallEvent);
  } catch (err) {
    throw new NotFoundException(
      "Call Not Found",
      ErrorCode.CALL_NOT_FOUND
    );
  }
};


export const changeCallStatus = async (req: Request, res: Response) => {
  
  try {
    const callEvent = await prismaClient.callEvent.update({
      where: {
        id: +req.params.id,
      },
      data: {
        callStatus: req.body.callStatus,
        

      },
    });
    res.json(callEvent);
  } catch (err) {
    throw new NotFoundException("Call not found", ErrorCode.CALL_NOT_FOUND);
  }
};


