import { toast } from "@medusajs/ui";

/**
 * Global API error handler for admin panel
 * Handles common HTTP error codes and shows user-friendly messages
 */
export const handleApiError = (error: any) => {
  const status = error.response?.status || error.status;
  const message = error.response?.data?.message || error.message;

  switch (status) {
    case 401:
      toast.error("Authentication Error", {
        description: "Please login again to continue.",
        duration: 5000,
      });
      // Optionally redirect to login
      // window.location.href = "/login";
      break;

    case 403:
      toast.error("Permission Denied", {
        description:
          message ||
          "You don't have permission to perform this action. Please contact your administrator.",
        duration: 5000,
      });
      break;

    case 404:
      toast.error("Not Found", {
        description: message || "The requested resource was not found.",
        duration: 4000,
      });
      break;

    case 422:
      toast.error("Validation Error", {
        description: message || "Please check your input and try again.",
        duration: 4000,
      });
      break;

    case 500:
      toast.error("Server Error", {
        description: "An unexpected error occurred. Please try again later.",
        duration: 5000,
      });
      break;

    default:
      toast.error("Error", {
        description: message || "An error occurred. Please try again.",
        duration: 4000,
      });
  }

  // Log error for debugging (in production, send to error tracking service)
  console.error("API Error:", {
    status,
    message,
    error,
  });
};

/**
 * Wrapper for fetch calls with automatic error handling
 */
export const fetchWithErrorHandling = async (
  url: string,
  options?: RequestInit
) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      handleApiError({
        status: response.status,
        response: {
          status: response.status,
          data: error,
        },
      });
      throw error;
    }

    return response.json();
  } catch (error: any) {
    if (!error.response) {
      // Network error or other issue
      handleApiError(error);
    }
    throw error;
  }
};

/**
 * Hook for handling permission errors in React components
 */
export const useApiErrorHandler = () => {
  const handleError = (error: any) => {
    handleApiError(error);
  };

  return { handleError };
};
