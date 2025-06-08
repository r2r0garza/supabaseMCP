// CommonJS version
const express = require("express");
const { supabase } = require("../supabaseClient");
const router = express.Router();

// Helper function to sync pending user data
async function syncPendingUserData(email) {
  try {
    const { data: pendingUser, error: pendingUserError } = await supabase
      .from("pending_users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (pendingUser && !pendingUserError) {
      // Delete the pending user record
      const { error: deleteError } = await supabase
        .from("pending_users")
        .delete()
        .eq("email", email);
      
      if (deleteError) {
        console.error("Error deleting pending user:", deleteError);
      }
      
      return {
        phone: pendingUser.phone,
        full_name: pendingUser.full_name
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error syncing pending user data:", error);
    return null;
  }
}

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
  
  // First, try to get the user's phone from Supabase Auth
  let authPhone = phone;
  try {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
    if (authUser && authUser.user && !authError) {
      // Use phone from Auth if available
      authPhone = authUser.user.phone || authUser.user.user_metadata?.phone || phone;
    }
  } catch (authLookupError) {
    console.error("Error getting auth user data:", authLookupError);
    // Continue with provided phone
  }
  
  // Check for pending user data and sync it
  const pendingData = await syncPendingUserData(email);
  
  // Priority order: pending_users phone > auth phone > provided phone
  const finalPhone = pendingData?.phone || authPhone || phone;
  const finalFullName = pendingData?.full_name || full_name;
  
  // Create the user with the final data
  const { data, error } = await supabase
    .from("users")
    .insert([{ id, email, full_name: finalFullName, phone: finalPhone, role: role || "cliente" }])
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
