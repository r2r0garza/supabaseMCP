// CommonJS version
const express = require("express");
const { supabase, supabaseAdmin } = require("../supabaseClient");
const { requireAdminAuth } = require("../middleware/auth");
const router = express.Router();

// GET /testimonials/approved
router.get("/approved", async (_req, res) => {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*, users(full_name, email), workshops(name)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /testimonials/featured?limit=3
router.get("/featured", async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const { data, error } = await supabase
    .from("testimonials")
    .select("*, users(full_name, email), workshops(name)")
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /testimonials/workshop/:workshop_id
router.get("/workshop/:workshop_id", async (req, res) => {
  const { workshop_id } = req.params;
  const { data, error } = await supabase
    .from("testimonials")
    .select("*, users(full_name, email), workshops(name)")
    .eq("is_approved", true)
    .eq("workshop_id", workshop_id)
    .order("created_at", { ascending: false });
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// POST /testimonials
router.post("/", async (req, res) => {
  const {
    email,
    name,
    phone,
    workshopId,
    content,
    position,
    company,
    rating,
  } = req.body;

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (userError) {
    return res.status(400).json({ success: false, error: "User not found for email" });
  }

  // Insert testimonial
  const { data, error } = await supabase
    .from("testimonials")
    .insert([{
      user_id: user.id,
      workshop_id: workshopId,
      content,
      position,
      company,
      rating,
      is_approved: false,
      is_featured: false,
      created_at: new Date().toISOString(),
    }])
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// ======== ADMIN-ONLY TESTIMONIALS MANAGEMENT ENDPOINTS ========

// GET /testimonials/admin/all - Get all testimonials regardless of status (Admin only)
router.get("/admin/all", requireAdminAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*, users(full_name, email), workshops(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// PUT /testimonials/admin/:id/approve - Update is_approved status (Admin only)
router.put("/admin/:id/approve", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { is_approved } = req.body;

  // Validate is_approved is a boolean
  if (typeof is_approved !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "is_approved must be a boolean value"
    });
  }

  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .update({ is_approved })
    .eq("id", id)
    .select("*, users(full_name, email), workshops(name)")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ 
    success: true, 
    data,
    message: `Testimonial ${is_approved ? 'approved' : 'unapproved'} successfully`
  });
});

// PUT /testimonials/admin/:id/feature - Update is_featured status (Admin only)
router.put("/admin/:id/feature", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { is_featured } = req.body;

  // Validate is_featured is a boolean
  if (typeof is_featured !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "is_featured must be a boolean value"
    });
  }

  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .update({ is_featured })
    .eq("id", id)
    .select("*, users(full_name, email), workshops(name)")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ 
    success: true, 
    data,
    message: `Testimonial ${is_featured ? 'featured' : 'unfeatured'} successfully`
  });
});

module.exports = router;
