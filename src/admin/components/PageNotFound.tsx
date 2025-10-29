import { Container } from "@medusajs/ui";

interface PageNotFoundProps {
  title?: string;
  description?: string;
  details?: string;
  showBackToProducts?: boolean;
  showDashboard?: boolean;
  icon?: "search" | "download" | "upload" | "file";
}

/**
 * Global Page Not Found Component
 * Reusable 404 page component that can be used across the admin panel
 */
const PageNotFound = ({
  title = "Page Not Found",
  description = "The page you're looking for is not available.",
  details = "This functionality has been disabled or does not exist. Please contact your system administrator if you need access.",
  showBackToProducts = true,
  showDashboard = true,
  icon = "search",
}: PageNotFoundProps) => {
  const renderIcon = () => {
    switch (icon) {
      case "download":
        return (
          <g transform="translate(130, 130)" opacity="0.4">
            <path
              d="M0,-10 L0,5 M-7,-2 L0,5 L7,-2"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="-10"
              y1="10"
              x2="10"
              y2="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Cross mark */}
            <line
              x1="-15"
              y1="-15"
              x2="15"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        );

      case "upload":
        return (
          <g transform="translate(130, 130)" opacity="0.4">
            <path
              d="M0,10 L0,-5 M-7,2 L0,-5 L7,2"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="-10"
              y1="10"
              x2="10"
              y2="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Cross mark */}
            <line
              x1="-15"
              y1="-15"
              x2="15"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        );

      case "file":
        return (
          <g transform="translate(130, 130)" opacity="0.4">
            <path
              d="M-8,-12 L-8,12 L8,12 L8,-6 L2,-12 Z M2,-12 L2,-6 L8,-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Cross mark */}
            <line
              x1="-15"
              y1="-15"
              x2="15"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        );

      case "search":
      default:
        return (
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
        );
    }
  };

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

              {/* Dynamic Icon */}
              {renderIcon()}
            </svg>
          </div>

          {/* Error Message */}
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-ui-fg-base">{title}</h1>
            <p className="text-lg text-ui-fg-subtle">{description}</p>
            <p className="text-sm text-ui-fg-muted max-w-md">{details}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {showBackToProducts && (
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
            )}
            {showDashboard && (
              <a
                href="/app"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-ui-border-base hover:bg-ui-bg-subtle text-ui-fg-base font-medium transition-all"
              >
                Go to Dashboard
              </a>
            )}
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

export default PageNotFound;
