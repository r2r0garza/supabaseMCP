// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
const router = express.Router();

// POST /workshop-sessions/:session_id/decrease-spots
router.post("/workshop-sessions/:session_id/decrease-spots", async (req, res) => {
  const { session_id } = req.params;
  const { error } = await supabase.rpc("decrease_available_spots", { session_id });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

// POST /workshop-sessions/:session_id/increase-spots
router.post("/workshop-sessions/:session_id/increase-spots", async (req, res) => {
  const { session_id } = req.params;
  const { error } = await supabase.rpc("increase_available_spots", { session_id });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

module.exports = router;
