import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

interface HeadProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structuredData?: object;
  preconnect?: string[];
  preload?: Array<{href: string, as: string}>;
}

const Head: React.FC<HeadProps> = ({
  children,
  title = "ViewerApps - Grow Your Audience Instantly",
  description,
  keywords,
  canonical,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  structuredData,
  preconnect = [],
  preload = []
}) => {
  const [location] = useLocation();
  
  // Compute canonical URL if not provided
  const canonicalUrl = canonical || `${window.location.origin}${location}`;
  
  useEffect(() => {
    // Update page title
    if (title) {
      document.title = title;
    }
    
    // Handle meta tags
    updateOrCreateMetaTag('description', description);
    updateOrCreateMetaTag('keywords', keywords);
    
    // Handle Open Graph meta tags
    updateOrCreateMetaTag('og:title', title);
    updateOrCreateMetaTag('og:description', description);
    updateOrCreateMetaTag('og:url', canonicalUrl);
    updateOrCreateMetaTag('og:type', ogType);
    if (ogImage) updateOrCreateMetaTag('og:image', ogImage);
    
    // Handle Twitter card meta tags
    updateOrCreateMetaTag('twitter:card', twitterCard);
    updateOrCreateMetaTag('twitter:title', title);
    updateOrCreateMetaTag('twitter:description', description);
    if (ogImage) updateOrCreateMetaTag('twitter:image', ogImage);
    
    // Handle canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
    
    // Handle preconnect links
    preconnect.forEach(url => {
      const preconnectLink = document.createElement('link');
      preconnectLink.setAttribute('rel', 'preconnect');
      preconnectLink.setAttribute('href', url);
      preconnectLink.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(preconnectLink);
      
      // Also add dns-prefetch as a fallback for browsers that don't support preconnect
      const dnsPrefetchLink = document.createElement('link');
      dnsPrefetchLink.setAttribute('rel', 'dns-prefetch');
      dnsPrefetchLink.setAttribute('href', url);
      document.head.appendChild(dnsPrefetchLink);
    });
    
    // Handle preload links
    preload.forEach(({href, as}) => {
      const preloadLink = document.createElement('link');
      preloadLink.setAttribute('rel', 'preload');
      preloadLink.setAttribute('href', href);
      preloadLink.setAttribute('as', as);
      document.head.appendChild(preloadLink);
    });
    
    // Handle structured data (JSON-LD)
    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }
    
    // Clean up function to remove added elements when component unmounts
    return () => {
      // We don't remove meta tags and other elements as they might be needed for the next route
      // But we could implement a more sophisticated cleanup if needed
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, twitterCard, structuredData, preconnect, preload]);
  
  // Helper function to update or create meta tags
  const updateOrCreateMetaTag = (name: string, content?: string) => {
    if (!content) return;
    
    // Look for existing tag (using both name and property attributes to cover all cases)
    let metaTag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      // For OpenGraph, use property attribute, for others use name
      if (name.startsWith('og:')) {
        metaTag.setAttribute('property', name);
      } else {
        metaTag.setAttribute('name', name);
      }
      document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
  };

  return <>{children}</>;
};

export default Head;