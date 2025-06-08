// CommonJS version
const express = require("express");
const { supabase, supabaseAdmin } = require("../supabaseClient");
const { requireAuth, requireAdminAuth } = require("../middleware/auth");
const router = express.Router();

// POST /orders - create order
router.post("/", async (req, res) => {
  const { user_id, workshop_id, session_id, payment_method, payment_id, amount } = req.body;
  const { data, error } = await supabase
    .from("orders")
    .insert([{ user_id, workshop_id, session_id, payment_method, payment_id, amount, status: "pending" }])
    .select("*")
    .single();
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// PUT /orders/:order_id - update order status
router.put("/:order_id", async (req, res) => {
  const { order_id } = req.params;
  const { status, payment_id } = req.body;
  const { data, error } = await supabase
    .from("orders")
    .update({ status, payment_id })
    .eq("id", order_id)
    .select("*")
    .single();
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /orders/user/:user_id - get user orders
router.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { data, error } = await supabase
    .from("orders")
    .select("*, workshops(*), sessions:session_id (*)")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /orders/:order_id - get order by ID
router.get("/:order_id", async (req, res) => {
  const { order_id } = req.params;
  const { data, error } = await supabase
    .from("orders")
    .select("*, workshops(*), sessions:session_id (*)")
    .eq("id", order_id)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// PUT /orders/:order_id/cancel - cancel order
router.put("/:order_id/cancel", async (req, res) => {
  const { order_id } = req.params;
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", order_id)
    .select("*")
    .single();
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// ======== ADMIN-ONLY ORDER MANAGEMENT ENDPOINTS ========



// GET /orders/admin/all - Get all orders with filters (Admin only)
router.get("/admin/all", requireAdminAuth, async (req, res) => {
  const { status, user_id, workshop_id, payment_method, limit, offset } = req.query;
  
  try {
    // Build query with joins (simplified to match working debug query)
    let query = supabaseAdmin
      .from("orders")
      .select(`
        *,
        workshops (id, name, slug),
        users (id, email, full_name, phone)
      `);

    // Apply filters if provided
    if (status) query = query.eq("status", status);
    if (user_id) query = query.eq("user_id", user_id);
    if (workshop_id) query = query.eq("workshop_id", workshop_id);
    if (payment_method) query = query.eq("payment_method", payment_method);

    // Add ordering
    query = query.order("created_at", { ascending: false });

    // Pagination
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    if (limitNum && offsetNum >= 0) {
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ 
      success: true, 
      data: data || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: data?.length || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /orders/admin/stats - Get order statistics (Admin only)
router.get("/admin/stats", requireAdminAuth, async (req, res) => {
  try {
    // Get total orders count by status
    const { data: statusStats, error: statusError } = await supabase
      .from("orders")
      .select("status")
      .then(result => {
        if (result.error) return result;
        
        const stats = result.data.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});
        
        return { data: stats, error: null };
      });

    if (statusError) {
      return res.status(500).json({ success: false, error: statusError.message });
    }

    // Get total revenue (completed orders only)
    const { data: revenueData, error: revenueError } = await supabase
      .from("orders")
      .select("amount")
      .eq("status", "completed");

    if (revenueError) {
      return res.status(500).json({ success: false, error: revenueError.message });
    }

    const totalRevenue = revenueData.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);

    // Get orders by workshop
    const { data: workshopStats, error: workshopError } = await supabase
      .from("orders")
      .select(`
        workshop_id,
        workshops (name),
        amount
      `)
      .eq("status", "completed");

    if (workshopError) {
      return res.status(500).json({ success: false, error: workshopError.message });
    }

    const workshopRevenue = workshopStats.reduce((acc, order) => {
      const workshopName = order.workshops?.name || 'Unknown';
      if (!acc[workshopName]) {
        acc[workshopName] = { count: 0, revenue: 0 };
      }
      acc[workshopName].count += 1;
      acc[workshopName].revenue += parseFloat(order.amount || 0);
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        ordersByStatus: statusStats,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        workshopStats: workshopRevenue
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /orders/admin - Create order (Admin only)
router.post("/admin", requireAdminAuth, async (req, res) => {
  const { 
    user_id, 
    workshop_id, 
    session_id, 
    payment_method, 
    payment_id, 
    amount, 
    status,
    notes 
  } = req.body;

  // Validate required fields
  if (!user_id || !workshop_id || !session_id || !payment_method || amount === undefined) {
    return res.status(400).json({
      success: false,
      error: "user_id, workshop_id, session_id, payment_method, and amount are required"
    });
  }

  const { data, error } = await supabase
    .from("orders")
    .insert([{
      user_id,
      workshop_id,
      session_id,
      payment_method,
      payment_id: payment_id || null,
      amount: parseFloat(amount),
      status: status || "pending",
      notes: notes || null
    }])
    .select(`
      *,
      workshops (id, name, slug),
      sessions:session_id (id, date, location, price),
      users (id, email, full_name, phone)
    `)
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// PUT /orders/admin/:order_id - Update order (Admin only)
router.put("/admin/:order_id", requireAdminAuth, async (req, res) => {
  const { order_id } = req.params;
  const updates = { ...req.body };

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.created_at;
  delete updates.updated_at;

  // Parse numeric fields if provided
  if (updates.amount) updates.amount = parseFloat(updates.amount);

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", order_id)
    .select(`
      *,
      workshops (id, name, slug),
      sessions:session_id (id, date, location, price),
      users (id, email, full_name, phone)
    `)
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// DELETE /orders/admin/:order_id - Delete order (Admin only)
router.delete("/admin/:order_id", requireAdminAuth, async (req, res) => {
  const { order_id } = req.params;

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", order_id);

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: "Order deleted successfully" });
});

// PUT /orders/admin/:order_id/status - Update order status with admin notes (Admin only)
router.put("/admin/:order_id/status", requireAdminAuth, async (req, res) => {
  const { order_id } = req.params;
  const { status, admin_notes, payment_id } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: "status is required"
    });
  }

  const updateData = { status };
  if (admin_notes) updateData.admin_notes = admin_notes;
  if (payment_id) updateData.payment_id = payment_id;

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", order_id)
    .select(`
      *,
      workshops (id, name, slug),
      sessions:session_id (id, date, location, price),
      users (id, email, full_name, phone)
    `)
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// GET /orders/admin/export - Export orders as CSV (Admin only)
router.get("/admin/export", requireAdminAuth, async (req, res) => {
  const { status, start_date, end_date } = req.query;

  let query = supabase
    .from("orders")
    .select(`
      id,
      user_id,
      workshop_id,
      session_id,
      payment_method,
      payment_id,
      amount,
      status,
      created_at,
      updated_at,
      workshops (name),
      sessions:session_id (date, location),
      users (email, full_name, phone)
    `);

  // Apply filters
  if (status) query = query.eq("status", status);
  if (start_date) query = query.gte("created_at", start_date);
  if (end_date) query = query.lte("created_at", end_date);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  // Convert to CSV format
  const csvHeaders = [
    "Order ID", "User Email", "User Name", "User Phone", "Workshop", 
    "Session Date", "Session Location", "Payment Method", "Payment ID", 
    "Amount", "Status", "Created At", "Updated At"
  ];

  const csvRows = data.map(order => [
    order.id,
    order.users?.email || '',
    order.users?.full_name || '',
    order.users?.phone || '',
    order.workshops?.name || '',
    order.sessions?.date || '',
    order.sessions?.location || '',
    order.payment_method,
    order.payment_id || '',
    order.amount,
    order.status,
    order.created_at,
    order.updated_at
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
  return res.send(csvContent);
});

module.exports = router;
