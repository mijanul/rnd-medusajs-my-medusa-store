import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function seedPages({ container }: { container: any }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Resolve the page module service using MedusaModule
  const pageModuleService = container.resolve("page");

  // Check if pages already exist
  const { data: existingPages } = await query.graph({
    entity: "page",
    fields: ["id"],
  });

  if (existingPages && existingPages.length > 0) {
    console.log("Pages already seeded, skipping...");
    return;
  }

  // Sample pages data
  const pages = [
    {
      title: "About Us",
      slug: "about-us",
      content: `<h1>About Us</h1>
<p>Welcome to our store! We are passionate about providing high-quality products to our customers.</p>
<p>Founded in 2024, our mission is to deliver exceptional value and service to every customer.</p>
<h2>Our Values</h2>
<ul>
  <li>Quality products</li>
  <li>Customer satisfaction</li>
  <li>Fast shipping</li>
  <li>Competitive prices</li>
</ul>`,
      meta_title: "About Us - Learn More About Our Company",
      meta_description:
        "Discover our story, mission, and values. Learn why thousands of customers trust us for their shopping needs.",
      is_published: true,
      published_at: new Date(),
    },
    {
      title: "Contact Us",
      slug: "contact-us",
      content: `<h1>Contact Us</h1>
<p>We'd love to hear from you! Get in touch with us through any of the following methods:</p>
<h2>Customer Support</h2>
<p>Email: support@example.com</p>
<p>Phone: +1 (555) 123-4567</p>
<p>Hours: Monday - Friday, 9am - 5pm EST</p>
<h2>Address</h2>
<p>123 Store Street<br>
City, State 12345<br>
United States</p>`,
      meta_title: "Contact Us - Get in Touch",
      meta_description:
        "Have questions? Contact our customer support team. We're here to help!",
      is_published: true,
      published_at: new Date(),
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      content: `<h1>Privacy Policy</h1>
<p>Last updated: October 13, 2025</p>
<p>This privacy policy describes how we collect, use, and protect your personal information.</p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us.</p>
<h2>How We Use Your Information</h2>
<p>We use the information we collect to process orders, improve our services, and communicate with you.</p>`,
      meta_title: "Privacy Policy - Your Privacy Matters",
      meta_description:
        "Read our privacy policy to understand how we collect, use, and protect your personal information.",
      is_published: true,
      published_at: new Date(),
    },
    {
      title: "Terms of Service",
      slug: "terms-of-service",
      content: `<h1>Terms of Service</h1>
<p>Last updated: October 13, 2025</p>
<p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
<h2>Use License</h2>
<p>Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.</p>`,
      meta_title: "Terms of Service - Usage Agreement",
      meta_description:
        "Read our terms of service to understand the rules and regulations for using our website.",
      is_published: true,
      published_at: new Date(),
    },
    {
      title: "Shipping Policy",
      slug: "shipping-policy",
      content: `<h1>Shipping Policy</h1>
<p>We offer fast and reliable shipping to locations worldwide.</p>
<h2>Shipping Methods</h2>
<ul>
  <li>Standard Shipping (5-7 business days)</li>
  <li>Express Shipping (2-3 business days)</li>
  <li>Next Day Delivery (select locations)</li>
</ul>
<h2>Shipping Costs</h2>
<p>Shipping costs are calculated at checkout based on your location and chosen shipping method.</p>`,
      meta_title: "Shipping Policy - Fast & Reliable Delivery",
      meta_description:
        "Learn about our shipping methods, delivery times, and shipping costs.",
      is_published: true,
      published_at: new Date(),
    },
  ];

  console.log("Seeding pages...");

  for (const pageData of pages) {
    await pageModuleService.createPages(pageData);
    console.log(`✓ Created page: ${pageData.title}`);
  }

  console.log("Pages seeded successfully!");
}
