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
  
  // First, sign up the user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    phone: phone, // Store phone in the dedicated phone field
    options: {
      data: { full_name, phone }, // Also store in user metadata for backup
    },
  });
  
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  // Then, store the user data in pending_users table
  try {
    const { error: pendingUserError } = await supabase
      .from("pending_users")
      .insert([{ email, full_name, phone }]);
    
    if (pendingUserError) {
      console.error("Error inserting into pending_users:", pendingUserError);
      // We don't return an error here because the auth signup was successful
      // This is just a warning in the logs
    }
  } catch (insertError) {
    console.error("Error inserting into pending_users:", insertError);
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

// GET /auth/debug-user/:email - Debug endpoint to check user data across tables
router.get("/debug-user/:email", async (req, res) => {
  const { email } = req.params;
  
  try {
    // Get auth user data
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(user => user.email === email);
    
    // Get pending user data
    const { data: pendingUser, error: pendingError } = await supabase
      .from("pending_users")
      .select("*")
      .eq("email", email)
      .single();
    
    // Get users table data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    return res.json({
      success: true,
      data: {
        auth_user: {
          data: authUser ? {
            id: authUser.id,
            email: authUser.email,
            phone: authUser.phone,
            user_metadata: authUser.user_metadata
          } : null,
          error: authError?.message
        },
        pending_user: {
          data: pendingUser,
          error: pendingError?.message
        },
        users_table: {
          data: user,
          error: userError?.message
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
