// @ts-nocheck
// CommonJS version
const express = require("express");
const { supabase, supabaseAdmin } = require("../supabaseClient");
const { requireAdminAuth } = require("../middleware/auth");
const router = express.Router();

// Helper function to sync pending user data
async function syncPendingUserData(email: string) {
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
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
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

// ======== ADMIN-ONLY USERS MANAGEMENT ENDPOINTS ========
// ======== ADMIN-ONLY USERS MANAGEMENT ENDPOINTS ========

// GET /users/admin/all - Get all users (Admin only)
router.get("/admin/all", requireAdminAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// GET /users/admin/:id - Get a user by ID (Admin only)
router.get("/admin/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// POST /users/admin - Create user (Admin only)
// Resolves auth user id by email if not provided
router.post("/admin", requireAdminAuth, async (req, res) => {
  // Debug: log incoming request to help diagnose 400s
  try {
    const maskedAuth = req.headers.authorization
      ? `${req.headers.authorization.slice(0, 20)}...`
      : undefined;
    console.log("POST /users/admin - incoming request", {
      body: req.body,
      headers: {
        authorization: maskedAuth,
        "content-type": req.headers["content-type"],
      },
    });
  } catch (_) {}

  const { id, email, full_name, phone, role } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "email is required" });
  }

  let resolvedUserId = id || null;
  if (!resolvedUserId) {
    try {
      const { data: usersList, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) {
        return res.status(400).json({ success: false, error: listErr.message });
      }
      const match = usersList?.users?.find((u) => u.email === email);
      if (match) {
        resolvedUserId = match.id;
      }
    } catch (e) {
      return res.status(400).json({ success: false, error: "Failed to resolve auth user id by email" });
    }
  }

  // If still not found, auto-create an Auth user for this email
  if (!resolvedUserId) {
    try {
      // Try inviting the user by email first (no password required)
      const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name, phone },
      });
      if (!inviteErr && inviteData?.user?.id) {
        resolvedUserId = inviteData.user.id;
        console.log("POST /users/admin - invited new auth user", { email, userId: resolvedUserId });
      } else {
        // Fallback: create user with a random strong password and confirm immediately
        const randomPassword = Math.random().toString(36).slice(-12) + "!A1";
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: randomPassword,
          email_confirm: true,
          user_metadata: { full_name, phone },
        });
        if (createErr || !created?.user?.id) {
          return res.status(400).json({ success: false, error: (inviteErr || createErr)?.message || "Failed to create auth user" });
        }
        resolvedUserId = created.user.id;
        console.log("POST /users/admin - created new auth user", { email, userId: resolvedUserId });
      }
    } catch (createAuthErr) {
      return res.status(400).json({ success: false, error: "Failed to auto-create auth user" });
    }
  }

  if (!resolvedUserId) {
    return res.status(400).json({ success: false, error: "Auth user not found for provided email" });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert([{ id: resolvedUserId, email, full_name, phone, role: role || "cliente" }])
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// PUT /users/admin/:id - Update user (Admin only)
router.put("/admin/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  delete updates.id;
  delete updates.created_at;
  delete updates.updated_at;

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
});

// DELETE /users/admin/:id - Delete user (Admin only)
router.delete("/admin/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: "User deleted successfully" });
});

module.exports = router;
