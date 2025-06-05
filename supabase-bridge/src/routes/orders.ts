// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
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

module.exports = router;
