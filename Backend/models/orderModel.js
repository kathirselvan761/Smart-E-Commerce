// ===== UPDATED ORDER MODEL FILE (models/orderModel.js) =====
import mongoose from "mongoose";
import Product from "./productModel.js";

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        images: [{ type: String }], // <-- multiple image URLs
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["Not Paid", "Pending Manual Approval", "Paid"],
      default: "Not Paid",
    },
    // 🆕 NEW TRACKING FIELDS
    trackingId: {
      type: String,
      default: null,
    },
    carrier: {
      type: String,
      default: null,
    },
    trackingStatus: {
      type: String,
      enum: [
        "pending",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
      ],
      default: "pending",
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    trackingUpdatedAt: {
      type: Date,
      default: null,
    },
    trackingHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        location: {
          type: String,
          default: null,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: {
          type: String,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent OverwriteModelError in ES Modules
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
