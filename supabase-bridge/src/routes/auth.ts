const express = require("express");
const supabase = require("../supabaseClient");
const router = express.Router();

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
  return res.json({
    success: true,
    data: {
      user: data.user,
      session: data.session,
    },
  });
});

// POST /auth/register
router.post("/register", async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone },
    },
  });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({
    success: true,
    data: {
      user: data.user,
      session: data.session,
    },
  });
});

// POST /auth/logout
router.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing token" });
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

// GET /auth/user
router.get("/user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing token" });
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data: data.user });
});

// GET /auth/session
router.get("/session", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing token" });
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data: { session: data.session } });
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { email, redirect_to } = req.body;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect_to });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true });
});

// POST /auth/update-password
router.post("/update-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing token" });
  }
  const { password } = req.body;
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

module.exports = router;
