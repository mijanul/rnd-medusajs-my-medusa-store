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
      <Container className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="animate-spin text-ui-fg-muted" />
          <Text className="text-ui-fg-subtle">Checking permissions...</Text>
        </div>
      </Container>
    );
  }

  if (!hasPermission("customers", "create")) {
    return <RestrictedAccess resource="customers" action="create" />;
  }

  return (
    <Container className="flex items-center justify-center min-h-[400px]">
      <Text className="text-ui-fg-subtle">
        Loading customer creation form...
      </Text>
    </Container>
  );
};

export default CustomerCreatePage;
