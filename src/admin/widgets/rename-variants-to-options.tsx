import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";

/**
 * Widget to rename "Variants" to "Options" in product create/edit forms
 * This widget runs globally and replaces the text dynamically
 */
const RenameVariantsToOptionsWidget = () => {
  useEffect(() => {
    // Add CSS to hide original text and add new text via ::after pseudo-element
    const existingStyle = document.getElementById("rename-variants-style");
    if (existingStyle) {
      return;
    }

    const style = document.createElement("style");
    style.id = "rename-variants-style";
    style.textContent = `
      /* Hide the text "Variants" in buttons/tabs */
      button[id*="variants"][role="tab"]:not([data-text-replaced="true"]) {
        /* We'll handle this via JavaScript for better control */
      }
    `;
    document.head.appendChild(style);

    // Function to replace "Variants" with "Options" in the DOM
    const replaceVariantsText = () => {
      // Target buttons with variants in the ID or aria-controls (product tabs)
      const variantsButtons = document.querySelectorAll(
        'button[id*="variants"][role="tab"], button[aria-controls*="variants"]'
      );

      variantsButtons.forEach((button) => {
        // Skip if already replaced
        if (button.getAttribute("data-text-replaced") === "true") {
          return;
        }

        // Find all text nodes within the button
        const walker = document.createTreeWalker(
          button,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        let replaced = false;
        while ((node = walker.nextNode())) {
          if (node.textContent && node.textContent.trim() === "Variants") {
            node.textContent = "Options";
            replaced = true;
          }
        }

        // Mark as replaced to avoid processing again
        if (replaced) {
          button.setAttribute("data-text-replaced", "true");
        }
      });

      // Also handle any headings or labels that say "Variants"
      const headings = document.querySelectorAll("h1, h2, h3, label");
      headings.forEach((heading) => {
        if (
          heading.textContent?.trim() === "Variants" &&
          !heading.getAttribute("data-text-replaced")
        ) {
          const walker = document.createTreeWalker(
            heading,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while ((node = walker.nextNode())) {
            if (node.textContent && node.textContent.trim() === "Variants") {
              node.textContent = "Options";
              heading.setAttribute("data-text-replaced", "true");
            }
          }
        }
      });
    };

    // Initial replacement
    setTimeout(replaceVariantsText, 100);

    // Use MutationObserver to watch for dynamic changes (modals, popups)
    const observer = new MutationObserver((mutations) => {
      let shouldReplace = false;

      mutations.forEach((mutation) => {
        // Check if new nodes were added
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            // Check if it's an element node
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if it contains variants-related attributes or text
              if (
                element.querySelector &&
                (element.querySelector('[id*="variants"]') ||
                  element.innerHTML?.includes("Variants"))
              ) {
                shouldReplace = true;
              }
            }
          });
        }

        // Also check if attributes changed (like when tabs are created)
        if (mutation.type === "attributes" && mutation.attributeName === "id") {
          const target = mutation.target as Element;
          if (target.id && target.id.includes("variants")) {
            shouldReplace = true;
          }
        }
      });

      if (shouldReplace) {
        // Slight delay to ensure DOM is fully rendered
        setTimeout(replaceVariantsText, 100);
      }
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["id", "aria-controls"],
    });

    // Periodic check every 2 seconds as fallback for dynamic content
    const interval = setInterval(replaceVariantsText, 2000);

    // Cleanup
    return () => {
      observer.disconnect();
      clearInterval(interval);
      const styleEl = document.getElementById("rename-variants-style");
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  // This widget doesn't render anything visible
  return null;
};

export const config = defineWidgetConfig({
  zone: "order.list.before", // Use a zone that loads early and globally
});

export default RenameVariantsToOptionsWidget;
