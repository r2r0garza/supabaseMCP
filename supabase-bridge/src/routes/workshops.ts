// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
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

module.exports = router;
