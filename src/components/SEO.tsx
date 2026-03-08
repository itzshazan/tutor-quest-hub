import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  jsonLd?: object;
}

const BASE_URL = "https://tutorquest.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "Tutor Quest";

/**
 * SEO component for dynamic meta tags, Open Graph, Twitter Cards, and JSON-LD.
 * Uses react-helmet-async for head management in SPA.
 */
export function SEO({
  title,
  description = "Connect with qualified tutors for personalized, face-to-face learning in your neighborhood. Search by subject, location, and more.",
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Find Trusted Local Tutors Near You`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  // Default organization JSON-LD
  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    description,
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.ico`,
    sameAs: [
      "https://twitter.com/tutorquest",
      "https://facebook.com/tutorquest",
    ],
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd || defaultJsonLd)}
      </script>
    </Helmet>
  );
}

/**
 * JSON-LD generators for common schema types
 */
export const jsonLdGenerators = {
  person: (tutor: {
    name: string;
    description?: string;
    image?: string;
    jobTitle?: string;
    url?: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    name: tutor.name,
    description: tutor.description,
    image: tutor.image,
    jobTitle: tutor.jobTitle || "Tutor",
    url: tutor.url,
  }),

  service: () => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Tutor Quest Tutoring Services",
    description: "Connect with qualified tutors for personalized, face-to-face learning",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    serviceType: "Educational Services",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
  }),

  faqPage: (faqs: { question: string; answer: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }),

  breadcrumb: (items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};
