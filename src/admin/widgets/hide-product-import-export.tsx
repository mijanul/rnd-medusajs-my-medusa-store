import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";

/**
 * Widget to hide Import and Export buttons on the products list page
 * Only the Create button will remain visible
 */
const HideProductImportExportWidget = () => {
  useEffect(() => {
    // Check if style already exists
    const existingStyle = document.getElementById("hide-import-export-style");
    if (existingStyle) return;

    // Create style element
    const style = document.createElement("style");
    style.id = "hide-import-export-style";
    style.textContent = `
      /* Hide Import button */
      a[href="/app/products/import"],
      a[href*="/products/import"] {
        display: none !important;
      }
      
      /* Hide Export button */
      a[href="/app/products/export"],
      a[href*="/products/export"] {
        display: none !important;
      }

      /* Additional selector for parent containers if needed */
      .flex.items-center.justify-center.gap-x-2 a[href*="/products/import"],
      .flex.items-center.justify-center.gap-x-2 a[href*="/products/export"] {
        display: none !important;
      }
    `;

    // Append style to document head
    document.head.appendChild(style);

    // Cleanup function to remove style when component unmounts
    return () => {
      const styleElement = document.getElementById("hide-import-export-style");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // This widget is invisible - it only adds CSS
  return null;
};

// Configure widget to load on the products list page
export const config = defineWidgetConfig({
  zone: "product.list.before",
});

export default HideProductImportExportWidget;
