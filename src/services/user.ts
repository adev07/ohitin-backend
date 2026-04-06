import httpStatus from "http-status";
import db from "../models";
import { TUserTypes } from "../types";
import ApiError from "../utils/ApiError";

const createUser = async (body: TUserTypes) => {
  if (!body) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please provide all the required fields");
  }

  const { name, email, password } = body;
  const existingUser = await db.user.findOne({ email });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
  }

  return db.user.create({ name, email, password });
};

const loginUser = async (body: { email: string; password: string }) => {
  const { email, password } = body;
  const user = await db.user.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const isMatch = await user.validatePassword(password);
  if (!isMatch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid credentials");
  }

  return user;
};

const forgotPassword = async (body: { email: string }) => {
  const { email } = body;
  const user = await db.user.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000);
  const existingOtp = await db.otp.findOne({ email });

  if (existingOtp) {
    existingOtp.otp = generatedOtp;
    await existingOtp.save();
    return existingOtp;
  }

  return db.otp.create({ email, otp: generatedOtp });
};

const verifyOtp = async (body: { email: string; otp: number }) => {
  const { email, otp } = body;
  const user = await db.user.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const otpRecord = await db.otp.findOne({ email, otp });
  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  return otpRecord;
};

const resetPassword = async (body: { email: string; otp: number; password: string }) => {
  const { email, otp, password } = body;
  const user = await db.user.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const otpRecord = await db.otp.findOne({ email, otp });
  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  user.password = password;
  await user.save();
  await db.otp.deleteOne({ _id: otpRecord._id });
  return user;
};

export default {
  createUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
