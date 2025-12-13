import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { exec } from 'child_process';

// 🔁 Trigger WhatsApp message (COD only)
const sendClientWhatsApp = (order) => {
  const phone = order.shippingAddress?.phoneNumber || '8778719449';
  const userName = order.user?.name || 'Customer';
  const orderId = order._id;
  const total = order.totalPrice;

  const cmd = `python3 backend/whatsapp_sender.py "${phone}" "${orderId}" "${userName}" "${total}"`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ WhatsApp error: ${err.message}`);
    } else {
      console.log(stdout);
    }
  });
};

// 🔁 Send WhatsApp notification for tracking updates
const sendTrackingWhatsApp = (order, trackingInfo) => {
  const phone = order.shippingAddress?.phoneNumber || '8778719449';
  const userName = order.user?.name || 'Customer';
  const orderId = order._id;
  const trackingId = trackingInfo.trackingId;
  const carrier = trackingInfo.carrier || 'Courier';
  const status = trackingInfo.status || 'In Transit';

  const cmd = `python3 backend/tracking_whatsapp.py "${phone}" "${orderId}" "${userName}" "${trackingId}" "${carrier}" "${status}"`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ Tracking WhatsApp error: ${err.message}`);
    } else {
      console.log(`✅ Tracking notification sent: ${stdout}`);
    }
  });
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    totalPrice,
  } = req.body;


  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const order = new Order({
    orderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    totalPrice,
    isPaid: paymentMethod !== 'Cash on Delivery',
    paidAt: paymentMethod === 'Cash on Delivery' ? null : Date.now(),
  });

  const createdOrder = await order.save();

  if (paymentMethod === 'Cash on Delivery') {
    sendClientWhatsApp(createdOrder);
  }

  res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid (Online)
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Mark order as COD - pending approval
// @route   PUT /api/orders/:id/pay/cod
// @access  Private
const markAsCODPending = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) {
    order.isPaid = false;
    order.paymentMethod = 'Cash on Delivery';
    order.paymentResult = {
      status: 'Pending Admin Approval',
      update_time: Date.now(),
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Approve COD payment (Admin)
// @route   PUT /api/orders/:id/pay/approve
// @access  Private/Admin
const approveCODPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      status: 'Approved by Admin',
      update_time: Date.now(),
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Mark as Delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    // Update tracking status to delivered if tracking exists
    if (order.trackingId) {
      order.trackingStatus = 'delivered';
      order.trackingUpdatedAt = Date.now();

      // Add to tracking history
      order.trackingHistory.push({
        status: 'delivered',
        timestamp: new Date(),
        description: 'Package has been delivered successfully',
      });
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});

// 🆕 @desc    Update order tracking information
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
const updateOrderTracking = asyncHandler(async (req, res) => {
  const { trackingId, carrier, status, estimatedDelivery, location, description } = req.body;

  // Validate required fields
  if (!trackingId) {
    res.status(400);
    throw new Error('Tracking ID is required');
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update tracking information
  order.trackingId = trackingId;
  order.carrier = carrier || order.carrier;
  order.trackingStatus = status || order.trackingStatus || 'in_transit';
  order.estimatedDelivery = estimatedDelivery || order.estimatedDelivery;
  order.trackingUpdatedAt = Date.now();

  // Add to tracking history
  const historyEntry = {
    status: status || 'in_transit',
    location: location || null,
    timestamp: new Date(),
    description: description || `Tracking updated with ID: ${trackingId}`
  };

  order.trackingHistory.push(historyEntry);

  // If status is delivered, also mark order as delivered
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();

  // Send WhatsApp notification
  try {
    sendTrackingWhatsApp(updatedOrder, {
      trackingId,
      carrier: carrier || 'Courier',
      status: status || 'in_transit'
    });
  } catch (error) {
    console.error('WhatsApp notification failed:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Tracking information updated successfully',
    data: {
      orderId: updatedOrder._id,
      trackingId: updatedOrder.trackingId,
      carrier: updatedOrder.carrier,
      status: updatedOrder.trackingStatus,
      estimatedDelivery: updatedOrder.estimatedDelivery,
      trackingHistory: updatedOrder.trackingHistory,
      updatedAt: updatedOrder.trackingUpdatedAt
    }
  });
});

// 🆕 @desc    Get order tracking information
// @route   GET /api/orders/:id/tracking
// @access  Private
const getOrderTracking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .select('trackingId carrier trackingStatus estimatedDelivery trackingHistory trackingUpdatedAt user')
    .populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns this order (unless admin)
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this order tracking');
  }

  if (!order.trackingId) {
    res.status(404);
    throw new Error('No tracking information available for this order');
  }

  res.status(200).json({
    success: true,
    data: {
      orderId: req.params.id,
      trackingId: order.trackingId,
      carrier: order.carrier,
      status: order.trackingStatus,
      estimatedDelivery: order.estimatedDelivery,
      trackingHistory: order.trackingHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      updatedAt: order.trackingUpdatedAt
    }
  });
});

// 🆕 @desc    Get all tracking updates for admin dashboard
// @route   GET /api/orders/tracking/all
// @access  Private/Admin
const getAllTrackingInfo = asyncHandler(async (req, res) => {
  const orders = await Order.find({ trackingId: { $exists: true, $ne: null } })
    .select('_id trackingId carrier trackingStatus estimatedDelivery trackingUpdatedAt user orderItems totalPrice')
    .populate('user', 'name email')
    .sort({ trackingUpdatedAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// 🆕 @desc    Bulk update tracking status
// @route   PUT /api/orders/tracking/bulk
// @access  Private/Admin
const bulkUpdateTracking = asyncHandler(async (req, res) => {
  const { orders } = req.body; // Array of { orderId, trackingId, carrier, status }

  if (!orders || !Array.isArray(orders)) {
    res.status(400);
    throw new Error('Orders array is required');
  }

  const updatePromises = orders.map(async (orderData) => {
    const { orderId, trackingId, carrier, status, location, description } = orderData;

    if (!orderId || !trackingId) {
      throw new Error(`Order ID and Tracking ID are required for all orders`);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Update tracking information
    order.trackingId = trackingId;
    order.carrier = carrier || order.carrier;
    order.trackingStatus = status || 'in_transit';
    order.trackingUpdatedAt = Date.now();

    // Add to tracking history
    order.trackingHistory.push({
      status: status || 'in_transit',
      location: location || null,
      timestamp: new Date(),
      description: description || `Bulk update - Tracking ID: ${trackingId}`
    });

    // If status is delivered, mark order as delivered
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    return await order.save();
  });

  try {
    const updatedOrders = await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `${updatedOrders.length} orders updated successfully`,
      data: updatedOrders.map(order => ({
        orderId: order._id,
        trackingId: order.trackingId,
        status: order.trackingStatus
      }))
    });
  } catch (error) {
    res.status(400);
    throw new Error(`Bulk update failed: ${error.message}`);
  }
});
const markOrderAsDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get Dashboard Stats (Admin)
// @route   GET /api/orders/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments({});
  const deliveredOrders = await Order.countDocuments({ isDelivered: true });
  const pendingOrders = await Order.countDocuments({ isDelivered: false });
  const totalRevenueResult = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = totalRevenueResult[0]?.total || 0;

  const totalUsers = await User.countDocuments({});
  const totalProducts = await Product.countDocuments({});

  res.json({
    totalOrders,
    deliveredOrders,
    pendingOrders,
    totalRevenue,
    totalUsers,
    totalProducts,
  });
});


export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  markAsCODPending,
  approveCODPayment,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderTracking,      // 🆕 New function
  getOrderTracking,         // 🆕 New function
  getAllTrackingInfo,       // 🆕 New function
  bulkUpdateTracking,       // 🆕 New function
  markOrderAsDelivered,     // 🆕 New function
  getDashboardStats,        // 🆕 New function
};