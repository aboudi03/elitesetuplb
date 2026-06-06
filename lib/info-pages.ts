import { pcBuilderWhatsAppNumber } from "@/lib/pc-builder";
import { contactEmails } from "@/lib/utils";

export type InfoPageSection = {
  heading: string;
  body?: string;
  items?: string[];
};

export type InfoPage = {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: InfoPageSection[];
};

const whatsappDisplayNumber = "+961 71 089 840";
const whatsappHref = `https://wa.me/${pcBuilderWhatsAppNumber}`;

export const infoPages: InfoPage[] = [
  {
    slug: "about-us",
    title: "About Us",
    description: "A quick introduction to Elite Setup and how we serve gamers, creators, and setup builders in Lebanon.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Who We Are",
        body:
          "Elite Setup is a Lebanon-based PC parts and gaming setup store focused on practical gear, clear product information, and responsive support before and after checkout.",
      },
      {
        heading: "What We Sell",
        items: [
          "Gaming peripherals, accessories, and setup essentials.",
          "PC parts and upgrade recommendations based on availability.",
          "Products selected for everyday use, gaming, streaming, and work setups.",
        ],
      },
      {
        heading: "How We Work",
        body:
          "We aim to keep product pages accurate, confirm order details when needed, and help customers choose items that fit their setup rather than pushing products blindly.",
      },
    ],
  },
  {
    slug: "about-elite-setup",
    title: "About Elite Setup",
    description: "Learn what Elite Setup stands for and what customers can expect from the store.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Our Focus",
        body:
          "Elite Setup is built for customers who care about clean setups, reliable gaming gear, and straightforward buying. We focus on useful product details, simple ordering, and direct support.",
      },
      {
        heading: "Customer Promise",
        items: [
          "Clear communication about order details and availability.",
          "Support through WhatsApp and email for product questions.",
          "A practical catalog shaped around gaming, productivity, and setup quality.",
        ],
      },
      {
        heading: "Contact",
        body: `For help, message us on WhatsApp at ${whatsappDisplayNumber} or email ${contactEmails.support}.`,
      },
    ],
  },
  {
    slug: "work-with-us",
    title: "Work With Us",
    description: "Information for suppliers, creators, technicians, and partners who want to work with Elite Setup.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Who Can Reach Out",
        items: [
          "Suppliers and distributors with gaming, PC parts, peripherals, or setup products.",
          "Content creators interested in setup, gaming, or product collaboration.",
          "Technicians, builders, and service providers with relevant experience.",
          "Businesses looking for setup sourcing or recurring equipment support.",
        ],
      },
      {
        heading: "What To Send",
        body:
          "Send a short introduction, your product or service category, pricing or collaboration details when available, and the best way to contact you.",
      },
      {
        heading: "Email",
        body: `Business inquiries can be sent to ${contactEmails.info}. Customer support requests should go to ${contactEmails.support}.`,
      },
    ],
  },
  {
    slug: "company-profile",
    title: "Company Profile",
    description: "A concise profile of Elite Setup for customers, partners, and suppliers.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Business Summary",
        body:
          "Elite Setup is an online-focused store for PC parts, gaming peripherals, and setup essentials in Lebanon. The store is designed to help customers browse products, compare details, and place orders with direct support available when needed.",
      },
      {
        heading: "Main Categories",
        items: [
          "Gaming mice, keyboards, headsets, mousepads, and accessories.",
          "PC components and build-related products when available.",
          "Streaming, productivity, and desk setup gear.",
        ],
      },
      {
        heading: "Support Channels",
        items: [
          `WhatsApp: ${whatsappDisplayNumber}`,
          `Support email: ${contactEmails.support}`,
          `Business email: ${contactEmails.info}`,
        ],
      },
    ],
  },
  {
    slug: "buying",
    title: "Buying",
    description: "How buying from Elite Setup works, from browsing to checkout and order confirmation.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Before You Order",
        body:
          "Review product photos, description, price, stock status, and any available specifications. If you are unsure about compatibility or suitability, contact support before ordering.",
      },
      {
        heading: "Checkout",
        items: [
          "Add products to cart and review quantities before checkout.",
          "Enter accurate contact and delivery information.",
          "Submit the order and keep your phone available in case we need to confirm details.",
        ],
      },
      {
        heading: "After Ordering",
        body:
          "Order handling depends on product availability, delivery area, and order details. We may contact you if an item needs confirmation or if additional information is required.",
      },
    ],
  },
  {
    slug: "terms-of-use",
    title: "Terms Of Use",
    description: "The basic terms for using the Elite Setup website and placing orders.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Use Of The Website",
        body:
          "By using this website, you agree to use it responsibly, provide accurate information when ordering, and avoid actions that may disrupt the store or affect other customers.",
      },
      {
        heading: "Product Information",
        body:
          "We work to keep product names, prices, images, stock, and specifications accurate. Mistakes can happen, and we may correct information or contact you to confirm an order if something needs review.",
      },
      {
        heading: "Orders",
        items: [
          "Submitting an order does not guarantee availability until it is reviewed or confirmed.",
          "We may contact you for clarification if order details are incomplete or unusual.",
          "Orders may be refused or cancelled if information is incorrect, unavailable, or suspected to be fraudulent.",
        ],
      },
      {
        heading: "Liability",
        body:
          "The website is provided for browsing and ordering. To the fullest extent permitted by applicable law, Elite Setup is not responsible for indirect losses caused by website interruptions, incorrect customer information, or third-party services.",
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description: "How Elite Setup handles customer information used for accounts, orders, and support.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Information We Collect",
        items: [
          "Account details such as email address and password-protected login information.",
          "Order details such as name, phone number, address, products, and notes.",
          "Support messages sent by email, WhatsApp, or website forms.",
        ],
      },
      {
        heading: "How We Use Information",
        items: [
          "To process orders and contact customers about their purchases.",
          "To provide customer support and answer product questions.",
          "To improve website reliability, catalog quality, and service operations.",
        ],
      },
      {
        heading: "Data Sharing",
        body:
          "We do not sell customer personal information. We may share only the information needed with service providers involved in order handling, delivery, hosting, payments, security, or customer support.",
      },
      {
        heading: "Customer Requests",
        body: `For privacy questions or account-related requests, contact ${contactEmails.support}.`,
      },
    ],
  },
  {
    slug: "partners",
    title: "Partners",
    description: "Information for brands, suppliers, distributors, creators, and service partners.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Partnership Areas",
        items: [
          "Product supply and distribution.",
          "Gaming and setup content collaborations.",
          "PC building, installation, and technical service support.",
          "Business and bulk product inquiries.",
        ],
      },
      {
        heading: "What We Look For",
        body:
          "We prefer partners who communicate clearly, provide accurate product information, respect customer expectations, and can support reliable availability or service quality.",
      },
      {
        heading: "Contact",
        body: `Send partnership inquiries to ${contactEmails.info}.`,
      },
    ],
  },
  {
    slug: "support",
    title: "Support",
    description: "How to get help from Elite Setup before or after placing an order.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "Fastest Support",
        body: `For quick questions, contact us on WhatsApp: ${whatsappDisplayNumber}.`,
      },
      {
        heading: "Email Support",
        body: `For order details, account questions, or longer requests, email ${contactEmails.support}.`,
      },
      {
        heading: "Helpful Details To Include",
        items: [
          "Your order number if available.",
          "The product name or link.",
          "Your phone number or email used at checkout.",
          "A clear description of what you need help with.",
        ],
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    description: "Contact Elite Setup by WhatsApp or email.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "WhatsApp",
        body: `Message us at ${whatsappDisplayNumber}. This is usually the fastest way to ask about products, orders, and setup recommendations.`,
      },
      {
        heading: "Email",
        items: [
          `Support: ${contactEmails.support}`,
          `Business inquiries: ${contactEmails.info}`,
        ],
      },
      {
        heading: "When Contacting Us",
        body:
          "Please include the product name, order number if available, and a short explanation so we can help faster.",
      },
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    description: "Answers to common questions about Elite Setup orders, products, accounts, and support.",
    updatedAt: "June 6, 2026",
    sections: [
      {
        heading: "How do I know if a product is available?",
        body:
          "Check the product page stock status. If you need confirmation before ordering, contact us on WhatsApp or email support.",
      },
      {
        heading: "Can I ask for help choosing a product?",
        body:
          "Yes. Send your budget, current setup, and what you want to improve. We can help you compare options when information is available.",
      },
      {
        heading: "Do I need an account to order?",
        body:
          "You can browse products without an account. Some account features may be required for saved details, order history, or future customer features.",
      },
      {
        heading: "What if I entered wrong order information?",
        body:
          "Contact support as soon as possible with the correct details. If the order has not been processed yet, we will do our best to update it.",
      },
      {
        heading: "How can I contact support?",
        body: `Use WhatsApp at ${whatsappDisplayNumber} or email ${contactEmails.support}.`,
      },
    ],
  },
];

export const infoPageMap = new Map(infoPages.map((page) => [page.slug, page]));
export const infoPageHref = (slug: string) => `/${slug}`;
export const whatsappContactHref = whatsappHref;
