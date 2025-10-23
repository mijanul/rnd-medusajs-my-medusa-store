import { Container, Heading, Text, Button } from "@medusajs/ui";
import { ArrowUturnLeft } from "@medusajs/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Access Denied Page
 * Shown when user tries to access a resource without proper permissions
 */
const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const resource = searchParams.get("resource") || "this page";
  const action = searchParams.get("action") || "access";
  const permission = searchParams.get("permission") || `${resource}-${action}`;

  const handleGoBack = () => {
    // Try to go back, or go to home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-6 max-w-lg text-center p-8">
        {/* Icon */}
        {/* <div className="flex items-center justify-center w-20 h-20 rounded-full bg-ui-bg-component shadow-elevation-card-rest">
          <LockClosedSolid className="text-ui-fg-muted w-10 h-10" />
        </div> */}

        {/* Content */}
        <div className="flex flex-col gap-3">
          <Heading level="h1" className="text-ui-fg-base text-2xl">
            Access Denied
          </Heading>

          <Text className="text-ui-fg-subtle text-lg">
            You don't have permission to {action} <strong>{resource}</strong>.
          </Text>

          <Text className="text-ui-fg-muted text-sm mt-2">
            If you believe this is an error, please contact your system
            administrator to request the necessary permissions for this
            resource.
          </Text>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <Button variant="secondary" onClick={handleGoBack}>
            <ArrowUturnLeft />
            Go Back
          </Button>
          <Button variant="primary" onClick={handleGoHome}>
            Go to Home
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <Text className="text-xs text-ui-fg-muted">
            <strong>Required Permission:</strong> {permission}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export default AccessDeniedPage;
