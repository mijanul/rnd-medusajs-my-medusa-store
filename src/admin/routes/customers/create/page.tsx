import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserPermissions } from "../../../lib/use-permissions";
import { RestrictedAccess } from "../../../components/restricted-access";
import { Container, Text } from "@medusajs/ui";
import { Spinner } from "@medusajs/icons";

const CustomerCreatePage = () => {
  const navigate = useNavigate();
  const { hasPermission, loading } = useUserPermissions();

  useEffect(() => {
    if (!loading) {
      const hasCreatePermission = hasPermission("customers", "create");

      if (!hasCreatePermission) {
        navigate("/access-denied?resource=customers&action=create", {
          replace: true,
        });
      }
    }
  }, [loading, hasPermission, navigate]);

  if (loading) {
    return (
      <Container className="flex items-center justify-center h-full">
        <Spinner className="animate-spin text-ui-fg-muted" />
        <Text className="ml-2 text-ui-fg-muted">Loading permissions...</Text>
      </Container>
    );
  }

  if (!hasPermission("customers", "create")) {
    return <RestrictedAccess resource="customers" action="create" />;
  }

  return null;
};

export default CustomerCreatePage;
