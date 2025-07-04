const supabase = require("../config/supabase").supabase;

async function checkAuth() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null; // Not authenticated
    }

    // Fetch user role from database
    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error || !userData) {
      console.error("Error fetching user role:", error);
      return null; // Error fetching role
    }

    return userData.role; // Return user role
  } catch (error) {
    console.error("Auth check error:", error);
    return null; // Error during auth check
  }
}

async function logout() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem("userRole");
  } catch (error) {
    console.error("Logout error:", error);
  }
}

module.exports = {
  checkAuth,
  logout,
};
