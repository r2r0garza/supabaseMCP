// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
const router = express.Router();

// GET /coupons - Get all coupons (admin view)
router.get("/", async (req, res) => {
  const { active_only, expired_only } = req.query;
  
  let query = supabase.from("coupons").select("*");
  
  if (active_only === "true") {
    query = query.eq("is_active", true)
                 .lte("start_date", new Date().toISOString())
                 .or("end_date.is.null,end_date.gt." + new Date().toISOString());
  }
  
  if (expired_only === "true") {
    query = query.lt("end_date", new Date().toISOString());
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  
  return res.json({ success: true, data });
});

// GET /coupons/:id - Get coupon by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  
  return res.json({ success: true, data });
});

// GET /coupons/by-code/:code - Get and validate coupon by code
router.get("/by-code/:code", async (req, res) => {
  const { code } = req.params;
  const { order_amount, user_id } = req.query;
  
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
    
  if (error) {
    return res.status(404).json({ 
      success: false, 
      error: "Coupon not found",
      valid: false 
    });
  }
  
  // Validate coupon
  const validation = await validateCoupon(coupon, order_amount, user_id);
  
  return res.json({ 
    success: true, 
    data: coupon,
    valid: validation.valid,
    message: validation.message,
    discount_amount: validation.discount_amount
  });
});

// POST /coupons - Create new coupon
router.post("/", async (req, res) => {
  const { 
    name, 
    code, 
    discount_type, 
    discount_value, 
    max_discount_amount,
    min_order_amount,
    usage_limit,
    usage_limit_per_user,
    start_date,
    end_date,
    is_active 
  } = req.body;
  
  // Validate required fields
  if (!name || !code || !discount_type || !discount_value) {
    return res.status(400).json({ 
      success: false, 
      error: "Name, code, discount_type, and discount_value are required" 
    });
  }
  
  // Validate discount_type
  if (!["percentage", "fixed_amount"].includes(discount_type)) {
    return res.status(400).json({ 
      success: false, 
      error: "discount_type must be 'percentage' or 'fixed_amount'" 
    });
  }
  
  const { data, error } = await supabase
    .from("coupons")
    .insert([{
      name,
      code: code.toUpperCase(),
      discount_type,
      discount_value: parseFloat(discount_value),
      max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
      min_order_amount: min_order_amount ? parseFloat(min_order_amount) : null,
      usage_limit: usage_limit ? parseInt(usage_limit) : null,
      usage_limit_per_user: usage_limit_per_user ? parseInt(usage_limit_per_user) : null,
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || null,
      is_active: is_active !== undefined ? is_active : true
    }])
    .select("*")
    .single();
    
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  
  return res.json({ success: true, data });
});

// PUT /coupons/:id - Update coupon
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  
  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.created_at;
  delete updates.updated_at;
  
  // Convert code to uppercase if provided
  if (updates.code) {
    updates.code = updates.code.toUpperCase();
  }
  
  // Parse numeric fields
  if (updates.discount_value) updates.discount_value = parseFloat(updates.discount_value);
  if (updates.max_discount_amount) updates.max_discount_amount = parseFloat(updates.max_discount_amount);
  if (updates.min_order_amount) updates.min_order_amount = parseFloat(updates.min_order_amount);
  if (updates.usage_limit) updates.usage_limit = parseInt(updates.usage_limit);
  if (updates.usage_limit_per_user) updates.usage_limit_per_user = parseInt(updates.usage_limit_per_user);
  
  const { data, error } = await supabase
    .from("coupons")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
    
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  
  return res.json({ success: true, data });
});

// DELETE /coupons/:id - Delete coupon
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id);
    
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  
  return res.json({ success: true, message: "Coupon deleted successfully" });
});

// POST /coupons/:id/increment-usage - Increment usage count (called when coupon is used)
router.post("/:id/increment-usage", async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from("coupons")
    .update({ 
      usage_count: supabase.sql`usage_count + 1`
    })
    .eq("id", id)
    .select("*")
    .single();
    
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  
  return res.json({ success: true, data });
});

// Helper function to validate coupon
async function validateCoupon(coupon, orderAmount = 0, userId = null) {
  const now = new Date();
  const orderValue = parseFloat(orderAmount) || 0;
  
  // Check if coupon is active
  if (!coupon.is_active) {
    return { valid: false, message: "This coupon is no longer active" };
  }
  
  // Check if coupon has started
  if (new Date(coupon.start_date) > now) {
    return { valid: false, message: "This coupon is not yet active" };
  }
  
  // Check if coupon has expired
  if (coupon.end_date && new Date(coupon.end_date) < now) {
    return { valid: false, message: "This coupon has expired" };
  }
  
  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }
  
  // Check minimum order amount
  if (coupon.min_order_amount && orderValue < coupon.min_order_amount) {
    return { 
      valid: false, 
      message: `Minimum order amount of $${coupon.min_order_amount} required` 
    };
  }
  
  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    discountAmount = (orderValue * coupon.discount_value) / 100;
    
    // Apply max discount cap if set
    if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount;
    }
  } else if (coupon.discount_type === "fixed_amount") {
    discountAmount = coupon.discount_value;
    
    // Don't allow discount to exceed order amount
    if (discountAmount > orderValue) {
      discountAmount = orderValue;
    }
  }
  
  // TODO: Check per-user usage limit if userId is provided
  // This would require a separate table to track user-specific usage
  
  return { 
    valid: true, 
    message: "Coupon is valid",
    discount_amount: Math.round(discountAmount * 100) / 100 // Round to 2 decimal places
  };
}

module.exports = router; 