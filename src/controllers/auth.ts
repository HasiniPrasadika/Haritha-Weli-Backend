import { NextFunction, Request, Response } from "express";
import { prismaClient } from "..";
import { hashSync, compareSync } from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { CLIENT_ID, FRONTEND_URL, JWT_SECRET } from "../secrets";
import { BadRequestsException } from "../exceptions/bad_requests";
import { ErrorCode } from "../exceptions/root";
import { UnprocessableEntity } from "../exceptions/validation";
import { ForgetPasswordSchema, SignUpSchema } from "../schema/users";
import { NotFoundException } from "../exceptions/not-found";
import crypto from "crypto";
import { sendEmail } from "../utils/email";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "cloudinary";

import admin from "../utils/firebase";

// Initialize the Google OAuth client
const client = new OAuth2Client(CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    console.log(
      "Received credential:",
      credential ? "Credential exists" : "No credential"
    );

    if (!credential) {
      return res.status(400).json({ error: "No credential provided" });
    }

    try {
      console.log("Attempting to verify credential with Google...");
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      console.log("Credential verified successfully", {
        email: payload.email,
        name: payload.name,
      });

      const { email, name, picture } = payload;

      if (!email) {
        return res
          .status(400)
          .json({ error: "Email not found in token payload" });
      }

      // Check if user exists in the database
      let user = await prismaClient.user.findFirst({ where: { email } });

      // If user does not exist, create a new user
      if (!user) {
        console.log("Creating new user:", email);
        user = await prismaClient.user.create({
          data: {
            name: name || "",
            email,
            password: "", // No password for Google users
            phoneNumber: "",
          },
        });
      } else {
        console.log("User found:", user.id);
      }

      // Generate JWT token for session management
      const authToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({ user, token: authToken });
    } catch (verifyError) {
      console.error("Google verification error:", verifyError);
      return res
        .status(400)
        .json({ error: "Invalid Google Token", details: verifyError.message });
    }
  } catch (error) {
    console.error("General error in googleAuth:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  SignUpSchema.parse(req.body);
  const { email, password, name, phoneNumber } = req.body;

  let user = await prismaClient.user.findFirst({ where: { email } });
  if (user) {
    throw new BadRequestsException(
      "User already exists!",
      ErrorCode.USER_ALREADY_EXISTS
    );
  }

  user = await prismaClient.user.create({
    data: {
      name,
      email,
      phoneNumber,
      password: hashSync(password, 10),
    },
  });

  res.json(user);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  let user = await prismaClient.user.findFirst({ where: { email } });
  if (!user) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }
  if (!compareSync(password, user.password)) {
    throw new BadRequestsException(
      "Incorrect password",
      ErrorCode.INCORRECT_PASSWORD
    );
  }
  const token = jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET
  );

  res.json({ user, token });
};
export const addAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  const { email, password, name, phoneNumber, userImage } = req.body;
  let userImageUrl = null;
  if (userImage) {
    let result = await cloudinary.v2.uploader.upload(userImage, {
      folder: "users",
    });
    userImageUrl = result.secure_url;
  }
  let user = await prismaClient.user.findFirst({ where: { email } });
  if (user) {
    throw new BadRequestsException(
      "An account with this email already exists. Please use another email address.",
      ErrorCode.USER_ALREADY_EXISTS
    );
  }

  user = await prismaClient.user.create({
    data: {
      name,
      email,
      phoneNumber,
      userImage: userImageUrl,
      password: hashSync(password, 10),
      role: "AGENT",
    },
  });

  res.json(user);
};

export const addSalesRep = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
 
  const { email, password, name, phoneNumber, userImage } = req.body;
  let userImageUrl = null;
  if (userImage) {
    let result = await cloudinary.v2.uploader.upload(userImage, {
      folder: "users",
    });
    userImageUrl = result.secure_url;
  }
  let user = await prismaClient.user.findFirst({ where: { email } });
  if (user) {
    throw new BadRequestsException(
      "An account with this email already exists. Please use another email address.",
      ErrorCode.USER_ALREADY_EXISTS
    );
  }

  user = await prismaClient.user.create({
    data: {
      name,
      email,
      phoneNumber,
      userImage: userImageUrl,
      password: hashSync(password, 10),
      role: "REP",
    },
  });

  res.json(user);
};

// Edit Agent
export const editAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    
    const { name, email, phoneNumber, password, userImage } = req.body;
    const agentId = parseInt(req.params.id, 10);

    let agent = await prismaClient.user.findFirst({
      where: { id: agentId, role: "AGENT" },
    });
    if (!agent) {
      throw new NotFoundException("Agent Not Found", ErrorCode.USER_NOT_FOUND);
    }
    let userImageUrl = null;
    if (userImage && userImage !== agent.userImage) {
      let result = await cloudinary.v2.uploader.upload(userImage, {
        folder: "users",
      });
      userImageUrl = result.secure_url;
    }

    agent = await prismaClient.user.update({
      where: { id: agentId },
      data: {
        name,
        email,
        phoneNumber,
        userImage: userImageUrl,
        password: password ? hashSync(password, 10) : agent.password,
      },
    });

    res.json(agent);
  } catch (err) {
    next(err);
  }
};

// Edit Sales Representative
export const editSalesRep = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    
    const { name, email, phoneNumber, password, userImage } = req.body;
    const salesRepId = parseInt(req.params.id, 10);

    let salesRep = await prismaClient.user.findFirst({
      where: { id: salesRepId, role: "REP" },
    });
    if (!salesRep) {
      throw new NotFoundException(
        "Sales Representative Not Found",
        ErrorCode.USER_NOT_FOUND
      );
    }
    let userImageUrl = null;
    if (userImage && userImage !== salesRep.userImage) {
      let result = await cloudinary.v2.uploader.upload(userImage, {
        folder: "users",
      });
      userImageUrl = result.secure_url;
    }
    salesRep = await prismaClient.user.update({
      where: { id: salesRepId },
      data: {
        name,
        email,
        phoneNumber,
        userImage: userImageUrl,
        password: password ? hashSync(password, 10) : salesRep.password,
      },
    });

    res.json(salesRep);
  } catch (err) {
    next(err);
  }
};

// Delete Agent
export const deleteAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const agentId = parseInt(req.params.id, 10);

    const agent = await prismaClient.user.findFirst({
      where: { id: agentId, role: "AGENT" },
    });
    if (!agent) {
      throw new NotFoundException("Agent Not Found", ErrorCode.USER_NOT_FOUND);
    }

    await prismaClient.user.delete({ where: { id: agentId } });
    res.json({ message: "Agent deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Delete Sales Representative
export const deleteSalesRep = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const salesRepId = parseInt(req.params.id, 10);

    const salesRep = await prismaClient.user.findFirst({
      where: { id: salesRepId, role: "REP" },
    });
    if (!salesRep) {
      throw new NotFoundException(
        "Sales Representative Not Found",
        ErrorCode.USER_NOT_FOUND
      );
    }

    await prismaClient.user.delete({ where: { id: salesRepId } });
    res.json({ message: "Sales Representative deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const userId = req.user?.id; // Extract user ID from the authenticated request
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    throw new UnauthorizedException("Unauthorized", ErrorCode.UNAUTHORIZED);
  }

  const user = await prismaClient.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }

  // Verify current password
  if (!compareSync(currentPassword, user.password)) {
    throw new NotFoundException(
      "Current Password is Incorrect",
      ErrorCode.INCORRECT_CURRENT_PASSWORD
    );
  }

  // Update password
  await prismaClient.user.update({
    where: { id: userId },
    data: {
      password: hashSync(newPassword, 10),
    },
  });

  res.json({ success: "Password changed successfully" });
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token, email, newPassword } = req.body;

  const user = await prismaClient.user.findUnique({ where: { email } });
  if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
    throw new BadRequestsException(
      "Invalid or expired reset token!",
      ErrorCode.INVALID_OR_EXPIRED_RESET_TOKEN
    );
  }

  // Hash the provided token and compare it with the stored token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  if (
    hashedToken !== user.passwordResetToken ||
    user.passwordResetExpires < new Date()
  ) {
    throw new BadRequestsException(
      "Invalid or expired reset token!",
      ErrorCode.INVALID_OR_EXPIRED_RESET_TOKEN
    );
  }

  // Update the password and remove the reset token
  await prismaClient.user.update({
    where: { email },
    data: {
      password: hashSync(newPassword, 10),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  res.json({ success: "Password reset successfully. You can now log in." });
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;

  const user = await prismaClient.user.findUnique({ where: { email } });
  if (!user) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }

  // Generate secure token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Store the hashed token and expiration time in the database
  await prismaClient.user.update({
    where: { email },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // Token valid for 10 mins
    },
  });

  // Create password reset URL
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

  // Send email with reset link
  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset.</p>
               <p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 10 minutes.</p>`,
  });

  res.json({ success: "Password reset link sent to email" });
};

// /me -> return the logged in user

export const me = async (req: Request, res: Response) => {
  res.json(req.user);
};
export const validateResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, email } = req.query;
    
    if (!token || !email || typeof token !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ 
        message: "Invalid request parameters", 
        errorCode: ErrorCode.INTERNAL_EXCEPTION
      });
    }

    const user = await prismaClient.user.findUnique({ where: { email: email } });
    
    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token!", 
        errorCode: ErrorCode.INVALID_OR_EXPIRED_RESET_TOKEN 
      });
    }

    // Hash the provided token to compare with stored hashed token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    if (
      hashedToken !== user.passwordResetToken ||
      user.passwordResetExpires < new Date()
    ) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token!", 
        errorCode: ErrorCode.INVALID_OR_EXPIRED_RESET_TOKEN 
      });
    }
    
    return res.status(200).json({ valid: true });
  } catch (error) {
    next(error);
  }
};

export const removeAccount = async (req: Request, res: Response) => {
  try {
    await prismaClient.user.delete({
      where: {
        id: +req.params.id,
      },
    });
    res.json({ success: true });
  } catch (err) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }
};
