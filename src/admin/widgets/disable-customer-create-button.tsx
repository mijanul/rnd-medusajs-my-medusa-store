import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";
import { useUserPermissions } from "../lib/use-permissions";

const DisableCustomerCreateButton = () => {
  const { hasPermission, loading } = useUserPermissions();

  useEffect(() => {
    if (loading) {
      return;
    }

    const hasCreatePermission = hasPermission("customers", "create");

    const handleCreateButton = () => {
      const createButton = document.querySelector(
        'a[href="/app/customers/create"]'
      ) as HTMLAnchorElement;

      if (createButton) {
        if (hasCreatePermission) {
          // User has permission - ensure button is visible and enabled
          createButton.style.position = "";
          createButton.style.zIndex = "";
          createButton.style.display = "";
          createButton.style.pointerEvents = "";
          createButton.style.opacity = "";
          createButton.style.cursor = "";
          createButton.removeAttribute("aria-disabled");
        } else {
          // User doesn't have permission - hide the button
          createButton.style.position = "absolute";
          createButton.style.zIndex = "-100";
          createButton.style.display = "none";
          createButton.style.pointerEvents = "none";
          createButton.style.opacity = "0";
          createButton.style.cursor = "not-allowed";
          createButton.setAttribute("aria-disabled", "true");
          createButton.style.top = "-9999px";
        }
      }
    };

    handleCreateButton();

    const observer = new MutationObserver(() => {
      handleCreateButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [hasPermission, loading]);

  return null;
};

export const config = defineWidgetConfig({
  zone: "customer.list.before",
});

export default DisableCustomerCreateButton;
