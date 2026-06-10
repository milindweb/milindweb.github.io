;(function () {
  var cfg = SITE_CONFIG;
  var page = window.PAGE_CONFIG || {};
  var fullTitle = (page.brandTitle !== false)
    ? cfg.brand.name + ' - ' + (page.title || cfg.defaults.title)
    : (page.title || cfg.defaults.title);
  var desc = page.description || cfg.defaults.description;
  var canonical = page.canonical || '/';
  var fullUrl = cfg.url + canonical;
  var ogImageUrl = page.ogImage || cfg.url + cfg.ogImage;

  function setTag(tag, attrs, parent) {
    var el = document.createElement(tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    (parent || document.head).appendChild(el);
  }

  function setMeta(name, content, prop) {
    if (!content) return;
    var attr = prop ? 'property' : 'name';
    var existing = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (existing) existing.remove();
    var el = document.createElement('meta');
    if (prop) el.setAttribute('property', name);
    else el.setAttribute('name', name);
    el.setAttribute('content', content);
    document.head.appendChild(el);
  }

  document.title = fullTitle;

  setMeta('description', desc);
  setMeta('robots', 'index, follow');

  var canonEl = document.querySelector('link[rel="canonical"]');
  if (canonEl) canonEl.setAttribute('href', fullUrl);
  else {
    var link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', fullUrl);
    document.head.appendChild(link);
  }

  setMeta('og:title', fullTitle, true);
  setMeta('og:description', desc, true);
  setMeta('og:type', 'website', true);
  setMeta('og:url', fullUrl, true);
  setMeta('og:image', ogImageUrl, true);

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', ogImageUrl);

  var orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': cfg.brand.name,
    'url': cfg.url,
    'logo': cfg.url + cfg.ogImage,
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': cfg.organization.telephone,
      'contactType': cfg.organization.contactType,
      'areaServed': cfg.organization.areaServed,
      'availableLanguage': 'English'
    },
    'sameAs': [
      cfg.social.whatsapp,
      cfg.social.instagram,
      cfg.social.facebook
    ]
  };

  var breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': page.breadcrumbs || [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': cfg.url + '/' }
    ]
  };

  var orgScript = document.createElement('script');
  orgScript.type = 'application/ld+json';
  orgScript.textContent = JSON.stringify(orgSchema);
  document.head.appendChild(orgScript);

  var breadScript = document.createElement('script');
  breadScript.type = 'application/ld+json';
  breadScript.textContent = JSON.stringify(breadcrumbSchema);
  document.head.appendChild(breadScript);
})();
