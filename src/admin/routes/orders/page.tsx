import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserPermissions } from "../../lib/use-permissions";
import { RestrictedAccess } from "../../components/restricted-access";
import { Container, Text } from "@medusajs/ui";
import { Spinner } from "@medusajs/icons";

/**
 * Orders page wrapper with permission check
 * This route intercepts access to orders and checks permissions
 */
const OrdersPage = () => {
  const navigate = useNavigate();
  const { hasAnyPermission, loading } = useUserPermissions();

  useEffect(() => {
    if (!loading) {
      // Check if user has any permission for orders
      const hasOrdersPermission = hasAnyPermission("orders");

      if (!hasOrdersPermission) {
        // Redirect to access denied page with context
        navigate("/access-denied?resource=orders&action=view", {
          replace: true,
        });
      }
    }
  }, [loading, hasAnyPermission, navigate]);

  // Show loading state while checking permissions
  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="animate-spin text-ui-fg-muted" />
          <Text className="text-ui-fg-subtle">Checking permissions...</Text>
        </div>
      </Container>
    );
  }

  // If user doesn't have permission, show restricted access
  // (This will show briefly before redirect)
  if (!hasAnyPermission("orders")) {
    return <RestrictedAccess resource="orders" action="view" />;
  }

  // If user has permission, the built-in orders page should render
  // This component shouldn't render in that case, but as a fallback:
  return (
    <Container className="flex items-center justify-center min-h-[400px]">
      <Text className="text-ui-fg-subtle">Loading orders...</Text>
    </Container>
  );
};

export default OrdersPage;
