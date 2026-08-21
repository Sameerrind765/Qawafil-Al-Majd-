import React, { useEffect } from 'react';
import { useLang } from '../context/LangContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
}

export default function SEO({
  title,
  description,
  keywords,
  canonicalPath = '',
  image = '/assets/qawafil-og.jpg',
  type = 'website',
  noIndex = false,
}: SEOProps) {
  const { lang } = useLang();

  useEffect(() => {
    const baseTitle = lang === 'ar' 
      ? 'قوافل المجد المثالية | خدمات النقل الفاخر والعمرة والزيارات'
      : 'Qawafil Al Majd Al Misaliya | Premium Fleet, Umrah & Ziyarat Transport';
    
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    document.title = fullTitle;

    const defaultDesc = lang === 'ar'
      ? 'شركة قوافل المجد المثالية لنقل الحجاج والمعتمرين والزوار في مكة المكرمة، المدينة المنورة، وجدة. أحدث أسطول من حافلات وسيارات VIP وسيارات عائلية بأعلى معايير الأمان والراحة.'
      : 'Qawafil Al Majd Al Misaliya provides premium luxury buses, VIP transport, and family vehicles for Umrah pilgrims, Ziyarat tours, and airport transfers across Makkah, Madinah, and Jeddah, Saudi Arabia.';

    const defaultKeywords = lang === 'ar'
      ? 'نقل معتمرين, نقل حجاج, قوافل المجد المثالية, زيارات المدينة, نقل مكة وجدة, تأجير باصات VIP, توصيل مطار الملك عبد العزيز'
      : 'Umrah transport, Hajj VIP transport, Makkah to Madinah bus, Jeddah airport transfer, Ziyarat tours, luxury pilgrim transport, Qawafil Al Majd';

    const metaTags = [
      { name: 'description', content: description || defaultDesc },
      { name: 'keywords', content: keywords || defaultKeywords },
      { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description || defaultDesc },
      { property: 'og:type', content: type },
      { property: 'og:image', content: image },
      { property: 'og:locale', content: lang === 'ar' ? 'ar_SA' : 'en_US' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description || defaultDesc },
      { name: 'twitter:image', content: image },
    ];

    metaTags.forEach(({ name, property, content }) => {
      let tag: HTMLMetaElement | null = null;
      if (name) {
        tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('name', name);
          document.head.appendChild(tag);
        }
      } else if (property) {
        tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
      }
      if (tag) {
        tag.setAttribute('content', content);
      }
    });

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    canonical.setAttribute('href', `${currentOrigin}${canonicalPath}`);

  }, [title, description, keywords, canonicalPath, image, type, noIndex, lang]);

  return null;
}
