import React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEO({ title, description, type = 'website', articleData }) {
  const siteTitle = "American Pirate Federation";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDesc = description || "The American Pirate Federation is a sovereign people's movement.";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      
      {/* Dynamic JSON-LD injection */}
      {articleData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": articleData.title,
            "image": articleData.image,
            "datePublished": articleData.date,
            "author": {
              "@type": "Organization",
              "name": "APF"
            }
          })}
        </script>
      )}
    </Helmet>
  );
}