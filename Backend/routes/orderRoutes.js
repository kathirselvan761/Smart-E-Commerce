// ===== UPDATED ORDER ROUTES FILE (routes/orderRoutes.js) =====
import express from "express";
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  markAsCODPending,
  approveCODPayment, // Added missing function
  updateOrderTracking, // NEW: Import tracking function
  getOrderTracking, // NEW: Import get tracking function
  getAllTrackingInfo, // NEW: Import all tracking info function
  bulkUpdateTracking, // NEW: Import bulk update function
  markOrderAsDelivered, // NEW: Import mark as delivered function
  getDashboardStats, // NEW: Import dashboard stats function
} from "../controllers/orderController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

// ✅ Create order (user) / Get all orders (admin)
router
  .route("/")
  .post(protect, addOrderItems) // POST /api/orders → create order
  .get(protect, admin, getOrders); // GET /api/orders → admin all orders

// ✅ Get my orders (user)
router.route("/myorders").get(protect, getMyOrders); // GET /api/orders/myorders → logged-in user's orders

// 🆕 NEW: Get all tracking info (admin only)
router.route("/tracking/all").get(protect, admin, getAllTrackingInfo); // GET /api/orders/tracking/all → admin all tracking

// 🆕 NEW: Bulk update tracking (admin only)
router.route("/tracking/bulk").put(protect, admin, bulkUpdateTracking); // PUT /api/orders/tracking/bulk → admin bulk update

// ✅ Get single order
router.route("/:id").get(protect, getOrderById); // GET /api/orders/:id

// ✅ Update order to paid (for online payment)
router.route("/:id/pay").put(protect, updateOrderToPaid); // PUT /api/orders/:id/pay

// ✅ Approve COD payment (admin only)
router.route("/:id/pay/approve").put(protect, admin, approveCODPayment); // PUT /api/orders/:id/pay/approve → admin approve COD

// ✅ Mark COD as pending (user selecting COD)
router.route("/:id/pay/cod").put(protect, markAsCODPending); // PUT /api/orders/:id/pay/cod

// ✅ Mark as delivered (admin)
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered); // PUT /api/orders/:id/deliver

// 🆕 NEW: Update order tracking (admin only) / Get order tracking (user/admin)
router
  .route("/:id/tracking")
  .put(protect, admin, updateOrderTracking) // PUT /api/orders/:id/tracking → admin update tracking
  .get(protect, getOrderTracking); // GET /api/orders/:id/tracking → get tracking info

// markas delivered (admin)
router.put("/:id/deliver", protect, admin, markOrderAsDelivered);

// 🆕 get new dashboard 

router.route('/admin/dashboard').get(protect, admin, getDashboardStats);

export default router;
