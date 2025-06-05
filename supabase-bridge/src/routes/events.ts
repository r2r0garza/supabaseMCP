// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
const router = express.Router();

// GET /events/upcoming?limit=5
router.get("/upcoming", async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("events")
    .select("*, workshops(*)")
    .gte("start_date", today)
    .eq("is_public", true)
    .order("start_date", { ascending: true })
    .limit(limit);
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

module.exports = router;
