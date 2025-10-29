import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container } from "@medusajs/ui";
import { useEffect } from "react";

/**
 * 404 Page for Products Import Route
 * Shows a modern not found page when users try to access /app/products/import
 */
const ProductsImportNotFoundPage = () => {
  useEffect(() => {
    // Optionally redirect after showing the 404 page
    // setTimeout(() => {
    //   window.location.href = "/app/products";
    // }, 3000);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-ui-bg-base">
      <Container className="max-w-2xl">
        <div className="flex flex-col items-center justify-center text-center py-16 px-8">
          {/* 404 Illustration */}
          <div className="mb-8">
            <svg
              className="w-64 h-64 text-ui-fg-muted"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="8 8"
                opacity="0.2"
              />

              {/* Large 404 Text */}
              <text
                x="100"
                y="110"
                textAnchor="middle"
                fill="currentColor"
                className="text-6xl font-bold"
                style={{ fontSize: "48px", fontWeight: "bold" }}
              >
                404
              </text>

              {/* Decorative Elements */}
              <circle cx="40" cy="50" r="4" fill="currentColor" opacity="0.3" />
              <circle
                cx="160"
                cy="60"
                r="6"
                fill="currentColor"
                opacity="0.2"
              />
              <circle
                cx="30"
                cy="150"
                r="5"
                fill="currentColor"
                opacity="0.25"
              />
              <circle
                cx="170"
                cy="140"
                r="4"
                fill="currentColor"
                opacity="0.3"
              />

              {/* Search Icon */}
              <g transform="translate(130, 130)" opacity="0.4">
                <circle
                  cx="0"
                  cy="0"
                  r="15"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <line
                  x1="12"
                  y1="12"
                  x2="22"
                  y2="22"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>

          {/* Error Message */}
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-ui-fg-base">
              Page Not Found
            </h1>
            <p className="text-lg text-ui-fg-subtle">
              The product import feature is not available.
            </p>
            <p className="text-sm text-ui-fg-muted max-w-md">
              This functionality has been disabled. If you need to import
              products, please contact your system administrator.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <a
              href="/app/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-ui-button-neutral hover:bg-ui-button-neutral-hover text-ui-fg-base font-medium transition-all shadow-buttons-neutral"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Products
            </a>
            <a
              href="/app"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-ui-border-base hover:bg-ui-bg-subtle text-ui-fg-base font-medium transition-all"
            >
              Go to Dashboard
            </a>
          </div>

          {/* Additional Help */}
          <div className="mt-12 pt-8 border-t border-ui-border-base w-full max-w-md">
            <p className="text-xs text-ui-fg-muted">
              Need help? Contact support or check the documentation for
              alternative methods.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Import Not Found",
});

export default ProductsImportNotFoundPage;
