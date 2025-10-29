import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";

/**
 * Global widget to hide variants across admin pages
 * Conservative approach to avoid hiding entire sections
 */
const GlobalVariantHider = () => {
  useEffect(() => {
    // Check if style already exists
    const existingStyle = document.getElementById("global-hide-variants");
    if (existingStyle) return;

    // Create global style element
    const style = document.createElement("style");
    style.id = "global-hide-variants";
    style.textContent = `
      /* Hide all variant-related links in navigation */
      a[href*="/products/"][href*="/variants"],
      a[href$="/variants"] {
        display: none !important;
      }
      
      /* Hide parent navigation items containing variant links */
      nav li:has(a[href*="/variants"]),
      ul li:has(a[href*="/variants"]) {
        display: none !important;
      }

      /* Hide variant tabs in product details */
      [role="tablist"] > *:has(a[href*="/variants"]),
      [role="tabpanel"] a[href*="/variants"] {
        display: none !important;
      }

      /* Hide variant sections by data attributes */
      [data-name="variants"],
      [data-section="variants"],
      [data-field="variants"] {
        display: none !important;
      }

      /* Hide the specific variants div by ID */
      #variants,
      div#variants {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `;

    document.head.appendChild(style);

    // Cleanup on unmount
    return () => {
      const styleElement = document.getElementById("global-hide-variants");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Conservative JavaScript hiding
  useEffect(() => {
    const hideVariantElements = () => {
      // Hide the specific variants div by ID
      const variantsDiv = document.getElementById("variants");
      if (variantsDiv) {
        variantsDiv.style.display = "none";
        variantsDiv.style.visibility = "hidden";
        variantsDiv.style.height = "0";
        variantsDiv.style.overflow = "hidden";
      }

      // Hide variant route links
      const variantLinks = document.querySelectorAll('a[href*="/variants"]');
      variantLinks.forEach((link) => {
        const element = link as HTMLElement;
        element.style.display = "none";

        // Hide parent navigation items
        const parentLi = element.closest("li");
        if (parentLi) {
          (parentLi as HTMLElement).style.display = "none";
        }
      });
    };

    // Run immediately
    hideVariantElements();

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      hideVariantElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

export const config = defineWidgetConfig({
  zone: "order.details.before",
});

export default GlobalVariantHider;
