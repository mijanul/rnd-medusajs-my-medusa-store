import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global permission error handler
 * Intercepts 403 errors from API calls and redirects to access denied page
 */
export const PermissionErrorHandler = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch to intercept 403 responses
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Check if response is 403 Forbidden
      if (response.status === 403) {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();

        try {
          const data = await clonedResponse.json();

          // Check if this is a permission-related 403
          if (data.redirect) {
            // Extract resource and action from redirect URL
            const url = new URL(data.redirect, window.location.origin);
            const searchParams = url.searchParams;
            const resource = searchParams.get("resource");
            const action = searchParams.get("action");

            // Redirect to access denied page
            if (resource && action) {
              navigate(`/access-denied?resource=${resource}&action=${action}`);
            } else {
              navigate("/access-denied");
            }
          }
        } catch (e) {
          // If we can't parse JSON, just continue
          console.error("Error parsing 403 response:", e);
        }
      }

      return response;
    };

    // Cleanup: restore original fetch on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, [navigate]);

  return <>{children}</>;
};

/**
 * Hook version for use in individual components
 */
export const usePermissionErrorHandler = () => {
  const navigate = useNavigate();

  const handlePermissionError = (
    error: any,
    resource?: string,
    action?: string
  ) => {
    if (error?.status === 403 || error?.response?.status === 403) {
      const redirectResource =
        resource || error?.data?.resource || "this resource";
      const redirectAction = action || error?.data?.action || "access";

      navigate(
        `/access-denied?resource=${redirectResource}&action=${redirectAction}`
      );
      return true;
    }
    return false;
  };

  return { handlePermissionError };
};
