const { supabase, supabaseAdmin } = require("../supabaseClient");

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: "Access token required" 
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid or expired token" 
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: "Authentication failed" 
    });
  }
};

// Middleware to check if authenticated user is an admin
const requireAdmin = async (req, res, next) => {
  try {
    // Get user from database to check role (use admin client to bypass RLS)
    const { data: userData, error } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(403).json({ 
        success: false, 
        error: "Unable to verify user permissions" 
      });
    }

    if (!userData || userData.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: "Permission check failed" 
    });
  }
};

// Combined middleware for admin-only endpoints
const requireAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: "Access token required" 
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid or expired token" 
      });
    }

    // Add user to request object
    req.user = user;

    // Get user from database to check role (use admin client to bypass RLS)
    const { data: userData, error: roleError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError) {
      return res.status(403).json({ 
        success: false, 
        error: "Unable to verify user permissions" 
      });
    }

    if (!userData || userData.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: "Authentication failed" 
    });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireAdminAuth
}; 