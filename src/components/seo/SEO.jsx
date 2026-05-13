import React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEO({ title, description, type = 'website', articleData }) {
  const siteTitle = "American Pirate Federation";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDesc = description || "The American Pirate Federation is a sovereign people's movement. Join the fleet to reclaim data sovereignty and economic reform.";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="theme-color" content="#9400FF" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content="https://piratefederation.org/apf-social-card.jpg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content="https://piratefederation.org/apf-social-card.jpg" />
      


      {/* Dynamic JSON-LD injection */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "American Pirate Federation",
          "url": "https://piratefederation.org",
          "logo": "https://piratefederation.org/logo.png",
          "description": "A Hybrid Federation of DAO Nodes and Sovereign LLCs.",
          "sameAs": [
            "https://twitter.com/piratefederation"
          ]
        })}
      </script>

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
