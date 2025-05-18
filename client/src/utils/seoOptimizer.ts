/**
 * SEO Optimizer Utility
 * Provides functionality to automatically generate SEO-friendly content
 * and metadata for product detail pages.
 */

interface SeoKeywords {
  primary: string;
  secondary: string[];
  longTail: string[];
}

interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
  structuredData: any;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
}

/**
 * Generates optimized SEO keywords based on product information
 */
export function generateSeoKeywords(
  productName: string,
  platformName: string,
  categoryName: string,
  description: string
): SeoKeywords {
  // Clean product name - remove emojis and special characters
  const cleanName = productName
    .split('[')[0]
    .trim()
    .replace(/[^\w\s]/gi, '')
    .trim();
  
  // Primary keyword is usually a combination of platform and category
  const primary = `${platformName} ${categoryName}`.toLowerCase();
  
  // Generate secondary keywords
  const secondary = [
    `buy ${platformName} ${categoryName}`,
    `${cleanName} service`,
    `${platformName} marketing`,
    `${categoryName} for ${platformName}`,
    `social media ${categoryName}`,
    `increase ${platformName} ${categoryName}`,
  ].map(k => k.toLowerCase());
  
  // Generate long-tail keywords
  const longTail = [
    `best ${platformName} ${categoryName} service`,
    `cheap ${platformName} ${categoryName} provider`,
    `how to get more ${platformName} ${categoryName}`,
    `buy real ${platformName} ${categoryName}`,
    `instant ${platformName} ${categoryName} delivery`,
  ].map(k => k.toLowerCase());
  
  return {
    primary,
    secondary,
    longTail
  };
}

/**
 * Creates an SEO-optimized description from a basic product description
 */
export function optimizeProductDescription(
  description: string,
  keywords: SeoKeywords
): string {
  // If description is too short, expand it using keywords
  if (description.length < 150) {
    return `Our premium ${keywords.primary} service helps you grow your online presence. 
    ${description} We provide high-quality ${keywords.secondary[0]} with fast delivery and 
    excellent customer support. ${keywords.longTail[0]} with our trusted service.`;
  }
  
  // Otherwise, just return the original description
  return description;
}

/**
 * Generates all needed SEO metadata for a product
 */
export function generateSeoMetadata(
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    platform: { name: string; slug: string };
    category: { name: string; slug: string };
    deliveryTime?: string;
    satisfactionRate?: number;
  },
  baseUrl: string
): SeoMetadata {
  // Get clean product name
  const cleanName = product.name.split('[')[0].trim();
  
  // Generate keywords
  const keywords = generateSeoKeywords(
    product.name,
    product.platform.name,
    product.category.name,
    product.description
  );
  
  // Generate title (keep under 60 characters for SEO)
  const title = `${cleanName} - ${product.platform.name} ${product.category.name} | ViewerApps`;
  
  // Generate meta description (keep under 160 characters for SEO)
  const metaDescription = `Buy ${cleanName} for ${product.platform.name}. Premium ${product.category.name} service with ${product.deliveryTime || '24-48 hours'} delivery. Satisfaction rate: ${product.satisfactionRate || 98}%. Starting at $${product.price.toFixed(2)}.`;
  
  // Generate structured data for product (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: cleanName,
    description: product.description,
    sku: `VAPP-${product.id}`,
    mpn: `PROD-${product.platform.slug}-${product.category.slug}-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'ViewerApps'
    },
    category: `${product.platform.name}/${product.category.name}`,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/shop/product/${product.id}`,
      priceCurrency: 'USD',
      price: product.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'ViewerApps'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      reviewCount: '89'
    }
  };
  
  // Open Graph metadata for social sharing
  const openGraph = {
    'og:title': title,
    'og:description': metaDescription,
    'og:type': 'product',
    'og:url': `${baseUrl}/shop/product/${product.id}`,
    'og:site_name': 'ViewerApps',
    'og:price:amount': product.price.toString(),
    'og:price:currency': 'USD',
    'og:availability': 'in stock'
  };
  
  // Twitter Card metadata
  const twitterCard = {
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': metaDescription,
    'twitter:site': '@viewerapps',
    'twitter:creator': '@viewerapps'
  };
  
  // Return all SEO metadata
  return {
    title,
    description: metaDescription,
    keywords: [...keywords.secondary, ...keywords.longTail].join(', '),
    structuredData,
    openGraph,
    twitterCard
  };
}

/**
 * Creates an FAQ section with structured data for products
 */
export function generateProductFaq(
  product: {
    platform: { name: string };
    category: { name: string };
    deliveryTime?: string;
  }
): {
  questions: Array<{ question: string; answer: string }>;
  structuredData: any;
} {
  const questions = [
    {
      question: `How long does it take to deliver ${product.platform.name} ${product.category.name}?`,
      answer: `Our ${product.platform.name} ${product.category.name} service typically delivers within ${product.deliveryTime || '24-48 hours'}. You'll receive a notification once the service has been completed.`
    },
    {
      question: `Is buying ${product.platform.name} ${product.category.name} safe?`,
      answer: `Yes, our ${product.platform.name} ${product.category.name} service is 100% safe and complies with ${product.platform.name}'s terms of service. We never ask for your password or sensitive account information.`
    },
    {
      question: `How do I purchase ${product.platform.name} ${product.category.name}?`,
      answer: `Simply select the quantity you need, click the "Buy Now" button, and complete the checkout process. After your payment is processed, we'll begin delivering your ${product.platform.name} ${product.category.name}.`
    },
    {
      question: `Do you offer a guarantee for ${product.platform.name} ${product.category.name}?`,
      answer: `Yes, we offer a satisfaction guarantee on all our ${product.platform.name} services, including ${product.category.name}. If you're not satisfied with our service, you can request a refund within 7 days of purchase.`
    },
    {
      question: `Will these ${product.category.name} get my ${product.platform.name} account banned?`,
      answer: `No, our services are designed to be safe for your account. We provide high-quality ${product.category.name} through legitimate methods that comply with ${product.platform.name}'s policies.`
    }
  ];
  
  // Create structured data for FAQs
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer
      }
    }))
  };
  
  return {
    questions,
    structuredData
  };
}