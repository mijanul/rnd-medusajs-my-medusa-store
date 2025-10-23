import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";

type ButtonMode = "hide" | "disable" | "default" | "enabled";

const CONFIG = {
  mode: "enabled" as ButtonMode,
};

const DisableCustomerCreateButton = () => {
  useEffect(() => {
    if (CONFIG.mode === "default" || CONFIG.mode === "enabled") {
      console.log("ℹ️ Customer Create button mode: default (no changes)");
      return;
    }

    const disableCreateButton = () => {
      const createButton = document.querySelector(
        'a[href="/app/customers/create"]'
      ) as HTMLAnchorElement;

      if (createButton) {
        if (CONFIG.mode === "hide") {
          createButton.style.display = "none";
          console.log("✅ Customer Create button hidden");
        } else if (CONFIG.mode === "disable") {
          createButton.style.pointerEvents = "none";
          createButton.style.opacity = "0.5";
          createButton.style.cursor = "not-allowed";
          createButton.setAttribute("aria-disabled", "true");

          createButton.removeAttribute("href");

          createButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
          });

          console.log("✅ Customer Create button disabled");
        }
      }
    };

    disableCreateButton();

    const observer = new MutationObserver(() => {
      disableCreateButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

export const config = defineWidgetConfig({
  zone: "customer.list.before",
});

export default DisableCustomerCreateButton;
