import httpStatus from "http-status";
import db from "../models";
import { calculateAllBusinessMetrics } from "../helpers/business";
import { TBusinessTypes } from "../types";
import ApiError from "../utils/ApiError";

const createBusiness = async (body: TBusinessTypes) => {
  if (body.user_id) {
    const existingBusiness = await db.business.findOne({
      business_name: body.business_name,
      user_id: body.user_id,
    });

    if (existingBusiness) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Business name already exists");
    }
  }

  return db.business.create(body);
};

const updateBusiness = async (id: string, body: Partial<TBusinessTypes>) => {
  const existingBusiness = await db.business.findById(id);
  if (!existingBusiness) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Business not found");
  }

  return db.business.findByIdAndUpdate(id, { $set: body }, { new: true });
};

const getBusinessById = async (id: string) => {
  const business = await db.business.findById(id);
  if (!business) {
    throw new ApiError(httpStatus.NOT_FOUND, "Business not found");
  }

  const metrics = await calculateAllBusinessMetrics(business.toObject());
  return { data: business, metrics };
};

const getAllBusinessMetrics = async (userId: string) => {
  const businesses = await db.business.find({ user_id: userId });
  return Promise.all(
    businesses.map(async (business) => {
      const metrics = await calculateAllBusinessMetrics(business.toObject());
      return { data: business, metrics };
    })
  );
};

const deleteBusiness = async (id: string) => {
  return db.business.findByIdAndDelete(id);
};

export default {
  createBusiness,
  updateBusiness,
  getBusinessById,
  getAllBusinessMetrics,
  deleteBusiness,
};
