/**
 * SEO yardımcı fonksiyonları
 * Dinamik içerik için JavaScript SEO optimizasyonları
 */

interface StructuredDataProps {
  type: string;
  data: Record<string, any>;
}

// Sayfa başlığını dinamik olarak günceller
export const updatePageTitle = (title: string) => {
  document.title = title;
};

// Meta açıklamasını günceller
export const updateMetaDescription = (description: string) => {
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);
};

// Canonical URL'i günceller
export const updateCanonicalUrl = (url: string) => {
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', fullUrl);
};

// Open Graph ve Twitter meta etiketlerini günceller
export const updateSocialMetaTags = (
  title: string, 
  description: string, 
  imageUrl?: string, 
  url?: string,
  type: string = 'website'
) => {
  const fullUrl = url ? (url.startsWith('http') ? url : `${window.location.origin}${url}`) : window.location.href;
  const tags = [
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    { name: 'og:url', content: fullUrl },
    { name: 'og:type', content: type },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description }
  ];

  if (imageUrl) {
    tags.push({ name: 'og:image', content: imageUrl });
    tags.push({ name: 'twitter:image', content: imageUrl });
  }

  tags.forEach(({name, content}) => {
    let metaTag = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    if (!metaTag) {
      metaTag = document.createElement('meta');
      if (name.startsWith('og:')) {
        metaTag.setAttribute('property', name);
      } else {
        metaTag.setAttribute('name', name);
      }
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
  });
};

// Yapılandırılmış veri (JSON-LD) ekler
export const addStructuredData = (props: StructuredDataProps) => {
  const { type, data } = props;
  
  // @context ve @type ekle
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };
  
  let scriptTag = document.querySelector('script[type="application/ld+json"]');
  
  // Mevcut tag yoksa oluştur
  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'application/ld+json');
    document.head.appendChild(scriptTag);
  }
  
  scriptTag.textContent = JSON.stringify(structuredData);
};

// Sayfa içeriğini Google tarafından daha iyi indexlenebilir hale getirir
export const makeContentIndexable = (elementSelector: string) => {
  const element = document.querySelector(elementSelector);
  if (element) {
    // data-seo-content attributunu ekle
    element.setAttribute('data-seo-content', 'true');
    
    // elementın içeriğini başka bir meta tag'a ekle (Google için)
    const content = element.textContent || '';
    let metaTag = document.querySelector('meta[name="fragment-content"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'fragment-content');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content.substring(0, 300) + '...');
  }
};

// Dinamik yüklenen içerik için yardımcı fonksiyon
export const markDynamicContent = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.setAttribute('data-rendered', 'true');
  }
};

// Dil ve bölge ayarlarını belirle 
export const setLanguageAndRegion = (language: string = 'tr', region: string = 'TR') => {
  document.documentElement.lang = language;
  
  let metaLanguage = document.querySelector('meta[http-equiv="content-language"]');
  if (!metaLanguage) {
    metaLanguage = document.createElement('meta');
    metaLanguage.setAttribute('http-equiv', 'content-language');
    document.head.appendChild(metaLanguage);
  }
  metaLanguage.setAttribute('content', `${language}-${region}`);
};

// HTTP Preconnect bağlantılarını ekler
export const addPreconnect = (urls: string[]) => {
  urls.forEach(url => {
    // Var olan preconnect linkleri kontrol et
    const existingLinks = document.querySelectorAll(`link[rel="preconnect"][href="${url}"]`);
    if (existingLinks.length === 0) {
      const preconnectLink = document.createElement('link');
      preconnectLink.setAttribute('rel', 'preconnect');
      preconnectLink.setAttribute('href', url);
      preconnectLink.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(preconnectLink);
    }
  });
};

// Önemli kaynakları önceden yükle
export const preloadResources = (resources: Array<{href: string, as: string}>) => {
  resources.forEach(({href, as}) => {
    // Var olan preload linkleri kontrol et
    const existingLinks = document.querySelectorAll(`link[rel="preload"][href="${href}"]`);
    if (existingLinks.length === 0) {
      const preloadLink = document.createElement('link');
      preloadLink.setAttribute('rel', 'preload');
      preloadLink.setAttribute('href', href);
      preloadLink.setAttribute('as', as);
      document.head.appendChild(preloadLink);
    }
  });
};

// Ürün detayı için yapılandırılmış veri oluştur
export const generateProductStructuredData = (product: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || window.location.origin + '/icons/icon-512x512.png',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: window.location.href
    },
    brand: {
      '@type': 'Brand',
      name: 'ViewerApps'
    }
  };
};

// Dinamik olarak yüklenen kalabalık sayfalar için SEO iyileştirmesi
export const optimizeDynamicPage = (title: string, description: string, canonicalPath: string, structuredData?: StructuredDataProps) => {
  // Sayfa başlığı, açıklama ve canonical URL güncelleme
  updatePageTitle(title);
  updateMetaDescription(description);
  updateCanonicalUrl(canonicalPath);
  
  // Sosyal medya meta tag'leri
  updateSocialMetaTags(title, description, undefined, canonicalPath);
  
  // Yapılandırılmış veriler
  if (structuredData) {
    addStructuredData(structuredData);
  }
  
  // Sayfa dilini ayarla
  setLanguageAndRegion('en', 'US');
  
  // Preconnect ve preload
  addPreconnect([
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdnjs.cloudflare.com'
  ]);
};