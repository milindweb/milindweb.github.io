;(function () {
  var cfg = SITE_CONFIG;
  var page = window.PAGE_CONFIG || {};
  var fullTitle = (page.brandTitle !== false)
    ? cfg.brand.name + ' - ' + (page.title || cfg.defaults.title)
    : (page.title || cfg.defaults.title);
  var desc = page.description || cfg.defaults.description;
  var canonical = page.canonical || '/';
  var fullUrl = cfg.url + canonical;
  var isArticle = page.type === 'article' || canonical.indexOf('/blog/') === 0;
  var ogImageUrl = page.ogImage || cfg.url + cfg.ogImage;

  function setLink(rel, href, extra) {
    var existing = document.querySelector('link[rel="' + rel + '"][href="' + href + '"]');
    if (existing) return;
    var el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('href', href);
    if (extra) for (var k in extra) el.setAttribute(k, extra[k]);
    document.head.appendChild(el);
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

  setLink('icon', '/img/favicon.png', { type: 'image/png' });
  setLink('apple-touch-icon', '/img/favicon.png');
  setLink('preconnect', 'https://cdnjs.cloudflare.com');
  setLink('preconnect', 'https://cdn.jsdelivr.net');

  setMeta('theme-color', '#0f172a');
  setMeta('og:site_name', cfg.brand.name, true);
  setMeta('og:locale', cfg.locale || 'en_US', true);
  setMeta('og:title', fullTitle, true);
  setMeta('og:description', desc, true);
  setMeta('og:type', isArticle ? 'article' : 'website', true);
  setMeta('og:url', fullUrl, true);
  setMeta('og:image', ogImageUrl, true);

  if (isArticle) {
    if (page.date) setMeta('article:published_time', page.date, true);
    if (page.author) setMeta('article:author', page.author, true);
    if (page.tags) {
      var tags = Array.isArray(page.tags) ? page.tags : page.tags.split(',');
      tags.forEach(function (t) { setMeta('article:tag', t.trim(), true); });
    }
  }

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', ogImageUrl);
  if (cfg.social.twitter) {
    var twitterHandle = cfg.social.twitter.replace(/https?:\/\/(x|twitter)\.com\//, '');
    setMeta('twitter:site', '@' + twitterHandle);
  }

  var sameAs = [
    cfg.social.whatsapp,
    cfg.social.instagram,
    cfg.social.facebook,
    cfg.social.twitter,
    cfg.social.linkedin
  ].filter(function (url) { return url && url !== '#'; });

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
    'sameAs': sameAs
  };

  var breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': page.breadcrumbs || [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': cfg.url + '/' }
    ]
  };

  if (isArticle) {
    var articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': page.title || cfg.defaults.title,
      'description': desc,
      'image': ogImageUrl,
      'datePublished': page.date || new Date().toISOString().split('T')[0],
      'dateModified': page.modified || page.date || new Date().toISOString().split('T')[0],
      'author': {
        '@type': 'Organization',
        'name': cfg.brand.name,
        'url': cfg.url
      },
      'publisher': {
        '@type': 'Organization',
        'name': cfg.brand.name,
        'logo': {
          '@type': 'ImageObject',
          'url': cfg.url + cfg.ogImage
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': fullUrl
      }
    };
    var articleScript = document.createElement('script');
    articleScript.type = 'application/ld+json';
    articleScript.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(articleScript);
  }

  var orgScript = document.createElement('script');
  orgScript.type = 'application/ld+json';
  orgScript.textContent = JSON.stringify(orgSchema);
  document.head.appendChild(orgScript);

  var breadScript = document.createElement('script');
  breadScript.type = 'application/ld+json';
  breadScript.textContent = JSON.stringify(breadcrumbSchema);
  document.head.appendChild(breadScript);
})();
