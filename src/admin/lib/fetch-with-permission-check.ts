/**
 * Fetch wrapper that handles 403 (Forbidden) responses
 * Automatically redirects to access denied page when user lacks permissions
 */
export async function fetchWithPermissionCheck(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: options?.credentials || "include",
  });

  // If 403 Forbidden, redirect to access denied page
  if (response.status === 403) {
    try {
      const data = await response.json();

      // If response includes redirect URL, use it
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        // Otherwise, construct redirect URL from error message
        const resource = url.includes("customer-groups")
          ? "customer-groups"
          : url.includes("customers")
          ? "customers"
          : "resource";

        window.location.href = `/app/access-denied?resource=${resource}&action=access`;
      }
    } catch (e) {
      // If can't parse JSON, just redirect to generic access denied
      window.location.href = "/app/access-denied";
    }

    // Return the response anyway so the caller can handle it
    return response;
  }

  return response;
}

/**
 * Hook to use fetch with automatic 403 handling
 */
export function useFetchWithPermissionCheck() {
  return fetchWithPermissionCheck;
}
