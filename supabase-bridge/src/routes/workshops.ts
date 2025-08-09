// CommonJS version
const express = require("express");
const { supabase, supabaseAdmin } = require("../supabaseClient");
const { requireAdminAuth } = require("../middleware/auth");
const router = express.Router();

// GET /workshops - all active workshops
router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /workshops/:slug - workshop by slug, with sessions
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const { data, error } = await supabase
    .from("workshops")
    .select("*, workshop_sessions(*)")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /workshop-sessions/workshop/:workshop_id - sessions for a workshop
router.get("/sessions/workshop/:workshop_id", async (req, res) => {
  const { workshop_id } = req.params;
  const { data, error } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop_id)
    .eq("active", true)
    .order("date");
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /workshop-sessions/upcoming?limit=3 - upcoming sessions
router.get("/sessions/upcoming", async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("workshop_sessions")
    .select("*, workshops(*)")
    .eq("active", true)
    .gt("date", now)
    .order("date")
    .limit(limit);
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /workshop-sessions/:session_id - session by ID, with workshop
router.get("/sessions/:session_id", async (req, res) => {
  const { session_id } = req.params;
  const { data, error } = await supabase
    .from("workshop_sessions")
    .select("*, workshops(*)")
    .eq("id", session_id)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// ======== ADMIN-ONLY WORKSHOP MANAGEMENT ENDPOINTS ========

// POST /workshops - Create new workshop (Admin only)
router.post("/", requireAdminAuth, async (req, res) => {
  const {
    slug,
    name,
    short_description,
    full_description,
    image_url,
    gallery_images,
    video_url,
    topics,
    is_exclusive,
    exclusivity_note,
    includes,
    cta_text,
    metadata,
    active
  } = req.body;

  // Validate required fields
  if (!slug || !name || !short_description || !full_description || !image_url || !cta_text) {
    return res.status(400).json({
      success: false,
      error: "slug, name, short_description, full_description, image_url, and cta_text are required"
    });
  }

  const { data, error } = await supabaseAdmin
    .from("workshops")
    .insert([{
      slug,
      name,
      short_description,
      full_description,
      image_url,
      gallery_images: gallery_images || [],
      video_url: video_url || null,
      topics: topics || [],
      is_exclusive: is_exclusive || false,
      exclusivity_note: exclusivity_note || null,
      includes: includes || [],
      cta_text,
      metadata: metadata || {},
      active: active !== undefined ? active : true
    }])
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// PUT /workshops/:id - Update workshop (Admin only)
router.put("/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.created_at;
  delete updates.updated_at;

  const { data, error } = await supabaseAdmin
    .from("workshops")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// DELETE /workshops/:id - Delete workshop (Admin only)
router.delete("/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("workshops")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: "Workshop deleted successfully" });
});

// GET /workshops/admin/all - Get all workshops including inactive (Admin only)
router.get("/admin/all", requireAdminAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("workshops")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// ======== ADMIN-ONLY WORKSHOP SESSION MANAGEMENT ENDPOINTS ========

// POST /workshops/sessions - Create new workshop session (Admin only)
router.post("/sessions", requireAdminAuth, async (req, res) => {
  const {
    workshop_id,
    date,
    location,
    capacity,
    available_spots,
    price,
    is_online,
    vimeo_link,
    active
  } = req.body;

  // Validate required fields
  if (!workshop_id || !date || !location || !capacity || price === undefined) {
    return res.status(400).json({
      success: false,
      error: "workshop_id, date, location, capacity, and price are required"
    });
  }

  const { data, error } = await supabaseAdmin
    .from("workshop_sessions")
    .insert([{
      workshop_id,
      date,
      location,
      capacity: parseInt(capacity),
      available_spots: available_spots !== undefined ? parseInt(available_spots) : parseInt(capacity),
      price: parseFloat(price),
      is_online: is_online || false,
      vimeo_link: vimeo_link || null,
      active: active !== undefined ? active : true
    }])
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// PUT /workshops/sessions/:id - Update workshop session (Admin only)
router.put("/sessions/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.created_at;
  delete updates.updated_at;

  // Parse numeric fields if provided
  if (updates.capacity) updates.capacity = parseInt(updates.capacity);
  if (updates.available_spots) updates.available_spots = parseInt(updates.available_spots);
  if (updates.price) updates.price = parseFloat(updates.price);

  const { data, error } = await supabaseAdmin
    .from("workshop_sessions")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// DELETE /workshops/sessions/:id - Delete workshop session (Admin only)
router.delete("/sessions/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("workshop_sessions")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: "Workshop session deleted successfully" });
});

// GET /workshops/sessions/admin/all - Get all workshop sessions including inactive (Admin only)
router.get("/sessions/admin/all", requireAdminAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("workshop_sessions")
    .select("*, workshops(*)")
    .order("date", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

module.exports = router;
