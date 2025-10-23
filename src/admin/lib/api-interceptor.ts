/**
 * Global API Interceptor for Permission-based Redirects
 *
 * This interceptor catches all 403 (Forbidden) responses from API calls
 * and redirects the user to the access denied page with context information.
 *
 * IMPORTANT: Only redirects when user is on a protected route, not on background API calls
 */

// Store the original fetch function
const originalFetch = window.fetch;

// Track if we've already redirected to prevent infinite loops
let hasRedirected = false;
let lastPath = window.location.pathname;

// List of routes that should trigger redirect on 403
const PROTECTED_ROUTES = ["/app/customers", "/app/customer-groups"];

// Reset redirect flag when user navigates to a different page
setInterval(() => {
  if (window.location.pathname !== lastPath) {
    hasRedirected = false;
    lastPath = window.location.pathname;
  }
}, 100);

// Override global fetch to intercept 403 errors
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);

    // If we get a 403 (Forbidden) response
    if (response.status === 403) {
      // Don't redirect if:
      // 1. We're already on the access-denied page
      // 2. We've already redirected once
      if (
        window.location.pathname.includes("/access-denied") ||
        hasRedirected
      ) {
        return response;
      }

      // Extract the URL being called
      const requestUrl = extractResourceFromUrl(args[0] as string);
      const currentPath = window.location.pathname;

      // Check if the API call matches the current route
      // E.g., if we're on /app/customers and calling /admin/customers
      const isMatchingRoute = PROTECTED_ROUTES.some((route) => {
        const routeResource = route.replace("/app/", "");
        return currentPath.startsWith(route) && requestUrl === routeResource;
      });

      if (!isMatchingRoute) {
        // This is a background API call (e.g., menu loading)
        // User is on a different page - don't redirect
        // Just return the 403 response silently
        console.log(
          `🔒 403 blocked for ${requestUrl}, but user is on ${currentPath} - ignoring`
        );
        return response;
      }

      // User is actively trying to access a protected page
      // The RouteGuard component will show the access denied UI inline
      console.log(
        `🚫 User on protected route ${currentPath}, API returned 403 - RouteGuard will show access denied UI`
      );

      // Log the error details for debugging
      const responseClone = response.clone();

      try {
        const errorData = await responseClone.json();

        // Extract resource and action from the API response or URL
        const resource = errorData.resource || requestUrl;
        const action =
          errorData.action || extractActionFromMethod(args[1] as RequestInit);
        const requiredPermission =
          errorData.required_permission || `${resource}-${action}`;

        // Redirect to access denied page with context
        const redirectUrl = `/app/access-denied?resource=${encodeURIComponent(
          resource
        )}&action=${encodeURIComponent(action)}&permission=${encodeURIComponent(
          requiredPermission
        )}`;

        // Set flag to prevent multiple redirects
        hasRedirected = true;

        console.log(`🚫 Redirecting to access denied: ${redirectUrl}`);

        // Use window.location for immediate redirect (stops further processing)
        window.location.href = redirectUrl;

        // Return the original response (though we're redirecting)
        return response;
      } catch (e) {
        // If parsing fails, still redirect but with generic info
        if (!hasRedirected) {
          hasRedirected = true;
          window.location.href =
            "/app/access-denied?resource=unknown&action=access";
        }
        return response;
      }
    }

    return response;
  } catch (error) {
    // Re-throw network errors
    throw error;
  }
};

/**
 * Extract resource name from API URL
 * Examples:
 * - /admin/customers -> customers
 * - /admin/customer-groups/123 -> customer-groups
 */
function extractResourceFromUrl(url: string | URL | Request): string {
  const urlString =
    typeof url === "string"
      ? url
      : url instanceof Request
      ? url.url
      : url.toString();

  // Match /admin/resource-name pattern
  const match = urlString.match(/\/admin\/([^/?]+)/);
  return match ? match[1] : "resource";
}

/**
 * Extract action from HTTP method
 */
function extractActionFromMethod(init?: RequestInit): string {
  const method = init?.method?.toUpperCase() || "GET";

  switch (method) {
    case "GET":
      return "list";
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "access";
  }
}

console.log(
  "✅ API Interceptor initialized - All 403 errors will redirect to access denied page"
);
