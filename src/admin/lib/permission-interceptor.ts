/**
 * Global Permission Error Interceptor
 *
 * This script intercepts all fetch requests and redirects to access-denied page
 * when a 403 Forbidden response is received.
 *
 * It works by:
 * 1. Overriding the native fetch function
 * 2. Checking all responses for 403 status
 * 3. Extracting resource/action info from the response
 * 4. Redirecting to /app/access-denied with appropriate params
 */

// Store the original fetch function
const originalFetch = window.fetch;

// Flag to prevent infinite loops
let isRedirecting = false;

// Override the global fetch function
window.fetch = async function (...args) {
  try {
    // Call the original fetch
    const response = await originalFetch(...args);

    // Check if this is a 403 Forbidden response
    if (response.status === 403 && !isRedirecting) {
      // Clone the response so we can read it without consuming it
      const clonedResponse = response.clone();

      try {
        const data = await clonedResponse.json();

        // Check if this is a permission-related 403 (has our custom fields)
        if (data.message && data.message.includes("permission")) {
          // Extract resource and action from the error message or use provided ones
          let resource = "this resource";
          let action = "access";

          // Try to extract from the message
          // Message format: "Forbidden: You don't have permission to {action} {resource}"
          const messageMatch = data.message.match(
            /permission to (\w+) ([\w-\s]+)/i
          );
          if (messageMatch) {
            action = messageMatch[1]; // e.g., "list", "view", "create"
            resource = messageMatch[2].trim(); // e.g., "customers", "orders"
          }

          // Or use the required_permission field if available
          if (data.required_permission) {
            const parts = data.required_permission.split("-");
            if (parts.length >= 2) {
              resource = parts.slice(0, -1).join("-"); // e.g., "customers"
              action = parts[parts.length - 1]; // e.g., "list"
            }
          }

          console.warn(
            `[Permission Denied] Resource: ${resource}, Action: ${action}`
          );

          // Set flag to prevent multiple redirects
          isRedirecting = true;

          // Redirect to access-denied page with context
          window.location.href = `/app/access-denied?resource=${encodeURIComponent(
            resource
          )}&action=${encodeURIComponent(action)}`;

          // Reset flag after a short delay (in case redirect is cancelled)
          setTimeout(() => {
            isRedirecting = false;
          }, 1000);
        }
      } catch (e) {
        // If we can't parse JSON or extract info, just return the original response
        console.error(
          "[Permission Error Handler] Error parsing 403 response:",
          e
        );
      }
    }

    return response;
  } catch (error) {
    // If fetch itself fails, throw the error
    throw error;
  }
};

console.info(
  "[Permission Guard] Global 403 interceptor initialized - unauthorized access will redirect to access-denied page"
);

// Export for TypeScript
export {};
