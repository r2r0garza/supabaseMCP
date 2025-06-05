// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
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

module.exports = router;
