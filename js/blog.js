/* =========================================================
   BLOG ENGINE (MilindWeb)
   Loads /data/posts.json and builds blog index dynamically
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const postsContainer = document.getElementById("bg-posts");
  const categoriesList = document.getElementById("bg-categories");
  const tagsContainer = document.getElementById("bg-tags");
  const recentList = document.getElementById("bg-recent");
  const searchInput = document.getElementById("bg-search");
  const pagination = document.getElementById("bg-pagination");

  let allPosts = [];
  let filteredPosts = [];
  let currentPage = 1;
  const postsPerPage = 6;

  // Load posts.json
  fetch("data/posts.json")
    .then(res => res.json())
    .then(data => {
      // Sort posts newest first
      allPosts = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      filteredPosts = [...allPosts];
      renderBlog();
      renderSidebar();
    })
    .catch(err => {
      postsContainer.innerHTML = `<p style="color:red">Error loading posts.json</p>`;
      console.error("Error loading posts.json:", err);
    });

  /* ----------------------
     Render Blog Posts
  ---------------------- */
  function renderBlog() {
    postsContainer.innerHTML = "";

    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const postsToShow = filteredPosts.slice(start, end);

    if (postsToShow.length === 0) {
      postsContainer.innerHTML = `<p>No posts found.</p>`;
      pagination.innerHTML = "";
      return;
    }

    postsToShow.forEach(post => {
      const card = document.createElement("article");
      card.className = "bg-card fade-in";
      card.innerHTML = `
        <img src="img/${post.image}" alt="${post.title}">
        <div class="bg-card-body">
          <small>${formatDate(post.date)} · ${post.category}</small>
          <h3><a href="${post.url}">${post.title}</a></h3>
          <p>${post.description}</p>
          <div class="bg-tags">
            ${post.tags.map(t => `<span class="bg-tag" data-tag="${t}">${t}</span>`).join("")}
          </div>
        </div>
      `;
      postsContainer.appendChild(card);
    });

    renderPagination();
    attachTagClicks();
  }

  /* ----------------------
     Render Sidebar
  ---------------------- */
  function renderSidebar() {
    // Categories
    const categories = [...new Set(allPosts.map(p => p.category))].sort();
    categoriesList.innerHTML = "";
    categories.forEach(cat => {
      const count = allPosts.filter(p => p.category === cat).length;
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" data-cat="${cat}">${cat} <span class="bg-count">(${count})</span></a>`;
      categoriesList.appendChild(li);
    });

    // Tags
    const tags = [...new Set(allPosts.flatMap(p => p.tags))].sort();
    tagsContainer.innerHTML = "";
    tags.forEach(tag => {
      const span = document.createElement("span");
      span.className = "bg-tag";
      span.textContent = tag;
      span.dataset.tag = tag;
      tagsContainer.appendChild(span);
    });

    // Recent posts
    recentList.innerHTML = "";
    allPosts.slice(0, 5).forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${p.url}">${p.title}</a>`;
      recentList.appendChild(li);
    });

    // Category click
    categoriesList.addEventListener("click", e => {
      if (e.target.dataset.cat) {
        e.preventDefault();
        filterByCategory(e.target.dataset.cat);
      }
    });

    // Tag click (sidebar)
    tagsContainer.addEventListener("click", e => {
      if (e.target.dataset.tag) {
        filterByTag(e.target.dataset.tag);
      }
    });

    // Search
    searchInput.addEventListener("input", () => {
      filterBySearch(searchInput.value.trim().toLowerCase());
    });
  }

  /* ----------------------
     Filters
  ---------------------- */
  function filterByCategory(cat) {
    filteredPosts = allPosts.filter(p => p.category === cat);
    currentPage = 1;
    renderBlog();
  }

  function filterByTag(tag) {
    filteredPosts = allPosts.filter(p => p.tags.includes(tag));
    currentPage = 1;
    renderBlog();
  }

  function filterBySearch(query) {
    filteredPosts = allPosts.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.tags.join(" ").toLowerCase().includes(query)
    );
    currentPage = 1;
    renderBlog();
  }

  /* ----------------------
     Pagination
  ---------------------- */
  function renderPagination() {
    pagination.innerHTML = "";

    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "« Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
      currentPage--;
      renderBlog();
    });
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = i;
        renderBlog();
      });
      pagination.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next »";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
      currentPage++;
      renderBlog();
    });
    pagination.appendChild(nextBtn);
  }

  /* ----------------------
     Utility
  ---------------------- */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function attachTagClicks() {
    document.querySelectorAll(".bg-tag").forEach(tagEl => {
      tagEl.addEventListener("click", e => {
        const tag = e.target.dataset.tag;
        if (tag) filterByTag(tag);
      });
    });
  }
});
