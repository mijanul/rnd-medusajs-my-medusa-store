import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";

/**
 * Widget to hide the variants section in product details page
 * Conservative approach - only hides variant tabs and links
 */
const HideProductVariantsWidget = () => {
  useEffect(() => {
    // Check if style already exists
    const existingStyle = document.getElementById("hide-variants-style");
    if (existingStyle) return;

    // Create style element
    const style = document.createElement("style");
    style.id = "hide-variants-style";
    style.textContent = `
      /* Hide Variants tab/link in product details navigation */
      a[href*="/variants"] {
        display: none !important;
      }
      
      /* Hide parent list item if it contains variants link */
      li:has(a[href*="/variants"]) {
        display: none !important;
      }

      /* Hide Variants section in product forms - by data attributes */
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

      /* Hide variant navigation tabs */
      [role="tablist"] a[href$="/variants"],
      [role="tab"] a[href$="/variants"] {
        display: none !important;
      }

      /* Hide Variants card/section - target by heading */
      .shadow-elevation-card-rest:has(h1:contains("Variants")) {
        display: none !important;
      }

      /* Hide variants table and card container */
      div.shadow-elevation-card-rest:has(.txt-compact-small-plus:contains("Variants")) {
        display: none !important;
      }

      /* Hide the "Title" column header in product create/edit */
      div[role="columnheader"][data-column-index="1"]:has-text("Title"),
      div[role="columnheader"][data-column-index="1"].txt-compact-small-plus {
        display: none !important;
      }

      /* Hide the "Default variant" grid cell */
      div[role="gridcell"][data-column-index="1"] {
        display: none !important;
      }

      /* Alternative selector for Title column header */
      [role="columnheader"][data-column-index="1"] {
        display: none !important;
      }
    `;

    document.head.appendChild(style);

    // Cleanup on unmount
    return () => {
      const styleElement = document.getElementById("hide-variants-style");
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

      // Hide variant tabs/links
      document.querySelectorAll('a[href*="/variants"]').forEach((link) => {
        const element = link as HTMLElement;
        element.style.display = "none";

        // Hide parent list item if exists
        const parentLi = element.closest("li");
        if (parentLi) {
          (parentLi as HTMLElement).style.display = "none";
        }
      });

      // Hide variants card by looking for h1 with "Variants" text
      document.querySelectorAll("h1").forEach((heading) => {
        if (heading.textContent?.trim() === "Variants") {
          // Find the closest card container
          const card = heading.closest(".shadow-elevation-card-rest");
          if (card) {
            (card as HTMLElement).style.display = "none";
          }
        }
      });

      // Hide variants table containers
      document
        .querySelectorAll(".shadow-elevation-card-rest")
        .forEach((card) => {
          const hasVariantsHeading =
            card.querySelector("h1")?.textContent?.trim() === "Variants";
          if (hasVariantsHeading) {
            (card as HTMLElement).style.display = "none";
          }
        });

      // Hide "Title" column header (data-column-index="1")
      document
        .querySelectorAll('[role="columnheader"][data-column-index="1"]')
        .forEach((header) => {
          (header as HTMLElement).style.display = "none";
        });

      // Hide "Default variant" grid cells (data-column-index="1")
      document
        .querySelectorAll('[role="gridcell"][data-column-index="1"]')
        .forEach((cell) => {
          (cell as HTMLElement).style.display = "none";
        });
    };

    // Run immediately
    hideVariantElements();

    // Set up observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
      if (hasAddedNodes) {
        hideVariantElements();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  // This widget doesn't render anything visible
  return null;
};

export const config = defineWidgetConfig({
  zone: [
    "product.details.before",
    "product.list.before",
    "product.list.after",
    "product.details.side.before",
    "product.details.side.after",
  ],
});

export default HideProductVariantsWidget;
