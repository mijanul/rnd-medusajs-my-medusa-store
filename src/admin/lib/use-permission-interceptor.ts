import { useEffect, useRef } from "react";

/**
 * Global Permission 403 Interceptor Hook
 *
 * This hook sets up a global fetch interceptor that catches 403 Forbidden responses
 * and automatically redirects to the access-denied page.
 *
 * Usage: Call this hook once in your app's root component or in any page.
 * It will set up a global interceptor that works across all fetch requests.
 *
 * @example
 * ```tsx
 * import { usePermissionInterceptor } from "./lib/use-permission-interceptor";
 *
 * function MyApp() {
 *   usePermissionInterceptor();
 *   return <div>...</div>;
 * }
 * ```
 */
export const usePermissionInterceptor = () => {
  const initialized = useRef(false);

  useEffect(() => {
    // Only set up once globally
    if (initialized.current || (window as any).__permissionInterceptorActive) {
      return;
    }

    console.info("[Permission Interceptor] Setting up global 403 handler...");

    // Store the original fetch function
    const originalFetch = window.fetch;

    // Flag to prevent infinite redirect loops
    let isRedirecting = false;

    // Override the global fetch function
    window.fetch = async function (...args: Parameters<typeof fetch>) {
      try {
        // Call the original fetch
        const response = await originalFetch(...args);

        // Check if this is a 403 Forbidden response and we're not already redirecting
        if (response.status === 403 && !isRedirecting) {
          // Clone the response so we can read it without consuming the original
          const clonedResponse = response.clone();

          try {
            const data = await clonedResponse.json();

            // Check if this is a permission-related 403
            // Our middleware returns { message, required_permission, redirect }
            if (
              data.message &&
              (data.message.includes("permission") ||
                data.message.includes("Forbidden"))
            ) {
              // Extract resource and action information
              let resource = "this resource";
              let action = "access";

              // Method 1: Extract from the message
              // Format: "Forbidden: You don't have permission to {action} {resource}"
              const messageMatch = data.message.match(
                /permission to (\w+) ([\w-\s]+)/i
              );
              if (messageMatch) {
                action = messageMatch[1]; // e.g., "list", "view", "create"
                resource = messageMatch[2].trim(); // e.g., "customers", "orders"
              }

              // Method 2: Use the required_permission field if available
              if (data.required_permission) {
                const parts = data.required_permission.split("-");
                if (parts.length >= 2) {
                  resource = parts.slice(0, -1).join("-");
                  action = parts[parts.length - 1];
                }
              }

              console.warn(
                `[Permission Denied] Redirecting - Resource: "${resource}", Action: "${action}"`
              );

              // Prevent multiple simultaneous redirects
              isRedirecting = true;

              // Redirect to access-denied page with context
              const redirectUrl = `/app/access-denied?resource=${encodeURIComponent(
                resource
              )}&action=${encodeURIComponent(action)}`;

              window.location.href = redirectUrl;

              // Reset the flag after a delay (in case redirect fails)
              setTimeout(() => {
                isRedirecting = false;
              }, 2000);
            }
          } catch (parseError) {
            // If we can't parse the response as JSON, just return the original response
            console.error(
              "[Permission Interceptor] Could not parse 403 response:",
              parseError
            );
          }
        }

        return response;
      } catch (error) {
        // If fetch itself throws an error, re-throw it
        throw error;
      }
    };

    // Mark as initialized globally
    (window as any).__permissionInterceptorActive = true;
    initialized.current = true;

    console.info(
      "[Permission Interceptor] ✓ Active - All 403 Forbidden errors will redirect to access-denied page"
    );

    // Cleanup function (restore original fetch when component unmounts)
    return () => {
      if ((window as any).__permissionInterceptorActive) {
        window.fetch = originalFetch;
        (window as any).__permissionInterceptorActive = false;
        initialized.current = false;
        console.info("[Permission Interceptor] Deactivated");
      }
    };
  }, []);
};
