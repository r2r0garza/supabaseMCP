const supabase = require("../supabaseClient");

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
    // Get user from database to check role
    const { data: userData, error } = await supabase
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
const requireAdminAuth = [requireAuth, requireAdmin];

module.exports = {
  requireAuth,
  requireAdmin,
  requireAdminAuth
}; 