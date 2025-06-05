// CommonJS version
const express = require("express");
const supabase = require("../supabaseClient");
const router = express.Router();

// GET /users/profile
router.get("/profile", async (req, res) => {
  // For now, require ?id= in query
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing user id" });
  }
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// PUT /users/profile
router.put("/profile", async (req, res) => {
  // For now, require { id } in body
  const { id, ...update } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing user id" });
  }
  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id);
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

// GET /users/by-email/:email
router.get("/by-email/:email", async (req, res) => {
  const { email } = req.params;
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ id: data.id });
});

// GET /users/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// POST /users
router.post("/", async (req, res) => {
  const { id, email, full_name, phone, role } = req.body;
  const { data, error } = await supabase
    .from("users")
    .insert([{ id, email, full_name, phone, role: role || "cliente" }])
    .select("*")
    .single();
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// PUT /users/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id);
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

// GET /users/by-email/:email
router.get("/by-email/:email", async (req, res) => {
  const { email } = req.params;
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ id: data.id });
});

// GET /users/profile
router.get("/profile", async (req, res) => {
  // For now, require ?id= in query
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing user id" });
  }
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

// PUT /users/profile
router.put("/profile", async (req, res) => {
  // For now, require { id } in body
  const { id, ...update } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing user id" });
  }
  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id);
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

module.exports = router;
