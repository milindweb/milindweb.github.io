(function () {
  'use strict';

  let allPosts = [];
  let filteredPosts = [];
  let categoryList = [];
  let currentPage = 1;
  const postsPerPage = 6;

  const containers = {
    posts: document.getElementById('bl-posts'),
    categories: document.getElementById('bl-categories'),
    tags: document.getElementById('bl-tags'),
    recent: document.getElementById('bl-recent'),
    search: document.getElementById('bl-search'),
    pagination: document.getElementById('bl-pagination'),
  };

  if (!containers.posts) return;

  Promise.all([
    fetch('/data/posts.json').then(function (res) { return res.json(); }),
    fetch('/data/categories.json').then(function (res) { return res.json(); }).catch(function () { return []; })
  ])
    .then(function (results) {
      var data = results[0];
      categoryList = results[1] || [];

      allPosts = data.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
      filteredPosts = allPosts.slice();

      // Apply URL params if present
      var params = new URLSearchParams(window.location.search);
      var catParam = params.get('category');
      var tagParam = params.get('tag');
      var searchParam = params.get('search');

      if (catParam) {
        filteredPosts = allPosts.filter(function (p) { return p.category === catParam; });
      } else if (tagParam) {
        filteredPosts = allPosts.filter(function (p) { return p.tags && p.tags.indexOf(tagParam) !== -1; });
      } else if (searchParam) {
        var q = searchParam.toLowerCase();
        filteredPosts = allPosts.filter(function (p) {
          return p.title.toLowerCase().indexOf(q) !== -1 ||
            (p.excerpt && p.excerpt.toLowerCase().indexOf(q) !== -1) ||
            (p.tags && p.tags.join(' ').toLowerCase().indexOf(q) !== -1);
        });
      }

      render();
      renderSidebar();

      // Highlight active filter category in sidebar
      if (catParam && containers.categories) {
        containers.categories.querySelectorAll('a').forEach(function (a) {
          if (a.dataset.blCat === catParam) {
            a.style.fontWeight = '700';
            a.style.color = 'var(--accent)';
          }
        });
      }
    })
    .catch(function () {
      containers.posts.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">No posts yet.</p>';
    });

  function render() {
    containers.posts.innerHTML = '';

    var start = (currentPage - 1) * postsPerPage;
    var end = start + postsPerPage;
    var pagePosts = filteredPosts.slice(start, end);

    if (!pagePosts.length) {
      containers.posts.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">No posts found.</p>';
      containers.pagination.innerHTML = '';
      return;
    }

    pagePosts.forEach(function (post) {
      var card = document.createElement('article');
      card.className = 'bl-card';
      card.innerHTML =
        '<div class="bl-card-meta">' +
          '<span><i class="bi bi-calendar3"></i> ' + formatDate(post.date) + '</span>' +
          '<span class="bl-badge">' + escapeHtml(post.category) + '</span>' +
        '</div>' +
        '<h2><a href="' + post.url + '">' + escapeHtml(post.title) + '</a></h2>' +
        '<p>' + escapeHtml(post.excerpt || post.description || '') + '</p>' +
        (post.tags && post.tags.length
          ? '<div class="bl-card-tags">' + post.tags.map(function (t) {
              return '<span class="bl-tag" data-tag="' + escapeHtml(t) + '">' + escapeHtml(t) + '</span>';
            }).join('') + '</div>'
          : '');
      containers.posts.appendChild(card);
    });

    renderPagination();
    attachTagClicks();
  }

  function renderSidebar() {
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

    containers.categories.innerHTML = '';
    sortedCats.forEach(function (cat) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="/blog?category=' + encodeURIComponent(cat) + '" data-bl-cat="' + escapeHtml(cat) + '">' + escapeHtml(cat) + ' <span class="bl-count">(' + categories[cat] + ')</span></a>';
      containers.categories.appendChild(li);
    });

    var uniqueTags = [...new Set(allTags)].sort();
    containers.tags.innerHTML = '';
    uniqueTags.forEach(function (tag) {
      var span = document.createElement('span');
      span.className = 'bl-tag';
      span.textContent = tag;
      span.dataset.tag = tag;
      containers.tags.appendChild(span);
    });

    containers.recent.innerHTML = '';
    allPosts.slice(0, 5).forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="' + p.url + '">' + escapeHtml(p.title) + '</a>';
      containers.recent.appendChild(li);
    });

    containers.categories.addEventListener('click', function (e) {
      var cat = e.target.closest('[data-bl-cat]');
      if (cat) {
        e.preventDefault();
        filterByCategory(cat.dataset.blCat);
        history.pushState(null, '', '/blog?category=' + encodeURIComponent(cat.dataset.blCat));
      }
    });

    containers.tags.addEventListener('click', function (e) {
      var tag = e.target.closest('[data-tag]');
      if (tag) {
        filterByTag(tag.dataset.tag);
        history.pushState(null, '', '/blog?tag=' + encodeURIComponent(tag.dataset.tag));
      }
    });

    if (containers.search) {
      containers.search.addEventListener('input', function () {
        filterBySearch(containers.search.value.trim().toLowerCase());
        var q = containers.search.value.trim();
        if (q) {
          history.pushState(null, '', '/blog?search=' + encodeURIComponent(q));
        } else {
          history.pushState(null, '', '/blog');
        }
      });
    }
  }

  function filterByCategory(cat) {
    filteredPosts = allPosts.filter(function (p) { return p.category === cat; });
    currentPage = 1;
    render();
  }

  function filterByTag(tag) {
    filteredPosts = allPosts.filter(function (p) { return p.tags && p.tags.indexOf(tag) !== -1; });
    currentPage = 1;
    render();
  }

  function filterBySearch(query) {
    if (!query) { filteredPosts = allPosts.slice(); currentPage = 1; render(); return; }
    filteredPosts = allPosts.filter(function (p) {
      return p.title.toLowerCase().indexOf(query) !== -1 ||
        (p.excerpt && p.excerpt.toLowerCase().indexOf(query) !== -1) ||
        (p.description && p.description.toLowerCase().indexOf(query) !== -1) ||
        (p.tags && p.tags.join(' ').toLowerCase().indexOf(query) !== -1);
    });
    currentPage = 1;
    render();
  }

  function renderPagination() {
    containers.pagination.innerHTML = '';
    var totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    if (totalPages <= 1) return;

    var prev = document.createElement('span');
    prev.textContent = '\u00AB Prev';
    if (currentPage === 1) prev.classList.add('disabled');
    prev.addEventListener('click', function () {
      if (currentPage > 1) { currentPage--; render(); }
    });
    containers.pagination.appendChild(prev);

    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement('span');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.addEventListener('click', (function (page) {
        return function () { currentPage = page; render(); };
      })(i));
      containers.pagination.appendChild(btn);
    }

    var next = document.createElement('span');
    next.textContent = 'Next \u00BB';
    if (currentPage === totalPages) next.classList.add('disabled');
    next.addEventListener('click', function () {
      if (currentPage < totalPages) { currentPage++; render(); }
    });
    containers.pagination.appendChild(next);
  }

  function attachTagClicks() {
    document.querySelectorAll('.bl-tag').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var tag = e.target.dataset.tag;
        if (tag) filterByTag(tag);
      });
    });
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
