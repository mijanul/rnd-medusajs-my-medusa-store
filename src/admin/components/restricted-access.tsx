import { Container, Heading, Text } from "@medusajs/ui";
import { LockClosedSolid } from "@medusajs/icons";

interface RestrictedAccessProps {
  resource?: string;
  action?: string;
  message?: string;
}

/**
 * Component to display when user doesn't have permission to access a page/feature
 */
export const RestrictedAccess = ({
  resource,
  action,
  message,
}: RestrictedAccessProps) => {
  const defaultMessage =
    resource && action
      ? `You don't have permission to ${action} ${resource}.`
      : "You don't have permission to access this page.";

  return (
    <Container className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-ui-bg-component">
          <LockClosedSolid className="text-ui-fg-muted w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <Heading level="h1" className="text-ui-fg-base">
            Access Restricted
          </Heading>

          <Text className="text-ui-fg-subtle">{message || defaultMessage}</Text>

          <Text className="text-ui-fg-muted text-sm mt-2">
            If you believe this is an error, please contact your administrator
            to request the necessary permissions.
          </Text>
        </div>
      </div>
    </Container>
  );
};

interface PermissionGateProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hasPermission: (resource: string, action: string) => boolean;
  loading?: boolean;
}

/**
 * Component to conditionally render children based on permission
 */
export const PermissionGate = ({
  resource,
  action,
  children,
  fallback,
  hasPermission,
  loading,
}: PermissionGateProps) => {
  if (loading) {
    return null; // or a loading spinner
  }

  if (!hasPermission(resource, action)) {
    return (
      <>
        {fallback || <RestrictedAccess resource={resource} action={action} />}
      </>
    );
  }

  return <>{children}</>;
};
