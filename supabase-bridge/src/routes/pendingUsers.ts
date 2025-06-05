// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
const router = express.Router();

// POST /pending-users - save a pending user
router.post("/", async (req, res) => {
  const { email, full_name, phone } = req.body;
  const { data, error } = await supabase
    .from("pending_users")
    .insert([{ email, full_name, phone }])
    .select("*")
    .single();
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// GET /pending-users/by-email/:email - get a pending user by email
router.get("/by-email/:email", async (req, res) => {
  const { email } = req.params;
  const { data, error } = await supabase
    .from("pending_users")
    .select("*")
    .eq("email", email)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// DELETE /pending-users/by-email/:email - delete a pending user by email
router.delete("/by-email/:email", async (req, res) => {
  const { email } = req.params;
  const { error } = await supabase
    .from("pending_users")
    .delete()
    .eq("email", email);
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

module.exports = router;
