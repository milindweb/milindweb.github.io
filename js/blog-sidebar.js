(function () {
  'use strict';

  var sidebarEl = document.getElementById('bp-sidebar');
  if (!sidebarEl) return;

  var currentSlug = window.location.pathname.replace('/blog/posts/', '/blog/').replace('/blog/', '').replace(/\/$/, '').replace(/\.html$/, '');

  Promise.all([
    fetch('/data/posts.json').then(function (res) { return res.json(); }),
    fetch('/data/categories.json').then(function (res) { return res.json(); }).catch(function () { return []; })
  ])
    .then(function (results) {
      var allPosts = results[0];
      var categoryList = results[1] || [];

      allPosts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

      var categories = {};
      var allTags = [];

      allPosts.forEach(function (p) {
        categories[p.category] = (categories[p.category] || 0) + 1;
        if (p.tags) allTags = allTags.concat(p.tags);
      });

      var sortedCats = categoryList.slice();
      Object.keys(categories).forEach(function (cat) {
        if (sortedCats.indexOf(cat) === -1) sortedCats.push(cat);
      });
      var uniqueTags = [...new Set(allTags)].sort();

      var html = '';

      // Search
      html += '<div class="bps-widget bps-search-wrap">';
      html += '<input type="text" id="bps-search" placeholder="Search posts..." />';
      html += '</div>';

      // Categories
      html += '<div class="bps-widget">';
      html += '<h3><i class="bi bi-folder"></i> Categories</h3>';
      html += '<ul class="bps-categories">';
      sortedCats.forEach(function (cat) {
        html += '<li><a href="/blog?category=' + encodeURIComponent(cat) + '">' + escapeHtml(cat) + ' <span class="bps-count">(' + categories[cat] + ')</span></a></li>';
      });
      html += '</ul></div>';

      // Recent Posts
      html += '<div class="bps-widget">';
      html += '<h3><i class="bi bi-clock"></i> Recent Posts</h3>';
      html += '<ul class="bps-recent">';
      var count = 0;
      allPosts.forEach(function (p) {
        if (count >= 5) return;
        if (p.url && p.url.indexOf(currentSlug) !== -1) return;
        html += '<li><a href="' + p.url + '">' + escapeHtml(p.title) + '</a></li>';
        count++;
      });
      html += '</ul></div>';

      // Tags
      html += '<div class="bps-widget">';
      html += '<h3><i class="bi bi-tags"></i> Tags</h3>';
      html += '<div class="bps-tag-cloud">';
      uniqueTags.forEach(function (tag) {
        html += '<a href="/blog?tag=' + encodeURIComponent(tag) + '" class="bps-tag">' + escapeHtml(tag) + '</a>';
      });
      html += '</div></div>';

      sidebarEl.innerHTML = html;

      // Search handler
      var searchInput = document.getElementById('bps-search');
      if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            var q = searchInput.value.trim();
            if (q) {
              window.location.href = '/blog?search=' + encodeURIComponent(q);
            }
          }
        });
      }
    })
    .catch(function () {
      sidebarEl.innerHTML = '';
    });

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
