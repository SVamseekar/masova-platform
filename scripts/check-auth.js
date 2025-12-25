// Run this in your browser console to check authentication status

console.log("=== Authentication Diagnostic ===");

// Check localStorage
const localToken = localStorage.getItem('auth_accessToken');
const localUser = localStorage.getItem('auth_user');

// Check sessionStorage
const sessionToken = sessionStorage.getItem('auth_accessToken');
const sessionUser = sessionStorage.getItem('auth_user');

console.log("LocalStorage Token:", localToken ? "EXISTS (length: " + localToken.length + ")" : "NOT FOUND");
console.log("SessionStorage Token:", sessionToken ? "EXISTS (length: " + sessionToken.length + ")" : "NOT FOUND");

const token = localToken || sessionToken;
const userStr = localUser || sessionUser;

if (token) {
  try {
    // Decode JWT (base64)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log("Token Payload:", payload);
      console.log("User Type:", payload.userType);
      console.log("User ID:", payload.sub);
      console.log("Store ID:", payload.storeId);
      console.log("Expiration:", new Date(payload.exp * 1000).toLocaleString());
      console.log("Is Expired:", new Date(payload.exp * 1000) < new Date() ? "YES - TOKEN EXPIRED!" : "No");
      console.log("Has MANAGER Role:", payload.userType === 'MANAGER' ? "YES" : "NO - You need MANAGER role!");
    }
  } catch (e) {
    console.error("Error decoding token:", e);
  }
} else {
  console.error("NO TOKEN FOUND - You are not logged in!");
}

if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log("Stored User:", user);
    console.log("User Type:", user.type);
  } catch (e) {
    console.error("Error parsing user:", e);
  }
}

// Check Redux state
try {
  const reduxState = window.__REDUX_DEVTOOLS_EXTENSION__?.();
  if (reduxState) {
    console.log("Redux Auth State available - check Redux DevTools");
  }
} catch (e) {
  console.log("Redux DevTools not available");
}

console.log("=== End Diagnostic ===");
