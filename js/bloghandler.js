// ========================
// bloghandler.js
// ========================

class Blog {
    constructor() {
        // Replace this with your deployed Web App URL
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbysXct3DlzcFOllCGzRVWAuHfb3EFsPWrOKg5IgxTB_yCc9drfDd9D_13oXHet5rVDp/exec';
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.totalPosts = 0;

        this.initEventListeners();
    }

    // ===== Init Buttons & Form =====
    initEventListeners() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) prevBtn.addEventListener('click', () => this.changePage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changePage(1));

        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }
    }

    // ===== Load Blog List =====
    async loadPostList(offset = 0) {
        try {
            const response = await fetch(`${this.apiUrl}?action=listPosts&offset=${offset}&limit=${this.postsPerPage}`);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            this.totalPosts = data.pagination.total;
            this.renderPostList(data.posts);
            this.updatePagination(data.pagination);
            this.loadRecentPosts();
        } catch (err) {
            console.error('Error loading posts:', err);
            const blogList = document.getElementById('blog-list');
            if (blogList) blogList.innerHTML = '<p>Error loading posts. Please try again later.</p>';
        }
    }

    renderPostList(posts) {
        const blogList = document.getElementById('blog-list');
        if (!blogList) return;

        if (posts.length === 0) {
            blogList.innerHTML = '<p>No blog posts found.</p>';
            return;
        }

        blogList.innerHTML = posts.map(post => `
            <article class="blog-item">
                <h2><a href="post.html?id=${post.id}">${post.title}</a></h2>
                <div class="blog-meta">Published on ${this.formatDate(post.date)}</div>
                <a href="post.html?id=${post.id}">Read more →</a>
            </article>
        `).join('');
    }

    updatePagination(pagination) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const pageInfo = document.getElementById('page-info');

        if (prevBtn) prevBtn.disabled = !pagination.hasPrev;
        if (nextBtn) nextBtn.disabled = !pagination.hasNext;
        if (pageInfo) {
            const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
            const totalPages = Math.ceil(pagination.total / pagination.limit);
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
    }

    changePage(direction) {
        const newOffset = (this.currentPage - 1 + direction) * this.postsPerPage;
        if (newOffset >= 0 && newOffset < this.totalPosts) {
            this.currentPage += direction;
            this.loadPostList(newOffset);
        }
    }

    // ===== Load Single Post =====
    async loadPost(postId) {
        try {
            const response = await fetch(`${this.apiUrl}?action=getPost&postId=${postId}`);
            const post = await response.json();

            if (post.error) throw new Error(post.error);

            this.renderPost(post);
            this.loadRecentPosts();
        } catch (err) {
            console.error('Error loading post:', err);
            const container = document.getElementById('blog-post');
            if (container) container.innerHTML = '<p>Error loading post. Please try again later.</p>';
        }
    }

    renderPost(post) {
        document.title = `${post.title} | Milindweb Blog`;

        const titleEl = document.getElementById('post-title');
        const dateEl = document.getElementById('post-date');
        const authorEl = document.getElementById('post-author');
        const contentEl = document.getElementById('post-content');
        const tagsContainer = document.getElementById('post-tags-list');

        if (titleEl) titleEl.textContent = post.title;
        if (dateEl) dateEl.textContent = this.formatDate(post.date);
        if (authorEl) authorEl.textContent = post.author || 'Unknown Author';
        if (contentEl) contentEl.innerHTML = post.content;

        if (tagsContainer) {
            tagsContainer.innerHTML = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        }

        this.renderComments(post.comments);
    }

    // ===== Comments =====
    renderComments(comments) {
        const commentsContainer = document.getElementById('comments-list');
        if (!commentsContainer) return;

        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }

        commentsContainer.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-meta">
                    ${comment.author} <span class="comment-date">${this.formatDate(comment.date)}</span>
                </div>
                <p>${comment.text}</p>
            </div>
        `).join('');
    }

    async handleCommentSubmit(e) {
        e.preventDefault();

        const authorInput = document.getElementById('comment-author');
        const textInput = document.getElementById('comment-text');
        const form = e.target;

        const author = authorInput.value.trim();
        const text = textInput.value.trim();
        if (!author || !text) { alert('Please fill in all fields'); return; }

        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        if (!postId) { alert('Cannot determine post ID'); return; }

        const commentData = `${author}|${text}|${new Date().toISOString().split('T')[0]}`;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'addComment',
                    postId: postId,
                    comment: commentData
                })
            });
            const result = await response.json();
            if (result.error) throw new Error(result.error);

            form.reset();
            alert('Comment submitted successfully!');
            this.loadPost(postId);
        } catch (err) {
            console.error('Error submitting comment:', err);
            alert('Error submitting comment. Please try again.');
        }
    }

    // ===== Recent Posts =====
    async loadRecentPosts() {
        try {
            const response = await fetch(`${this.apiUrl}?action=listPosts&limit=5`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.renderRecentPosts(data.posts);
        } catch (err) {
            console.error('Error loading recent posts:', err);
        }
    }

    renderRecentPosts(posts) {
        const recentPostsContainer = document.getElementById('recent-posts');
        if (!recentPostsContainer) return;

        if (posts.length === 0) {
            recentPostsContainer.innerHTML = '<p>No recent posts</p>';
            return;
        }

        recentPostsContainer.innerHTML = posts.map(post => `
            <div class="recent-post">
                <a href="post.html?id=${post.id}">${post.title}</a>
                <div class="blog-meta">${this.formatDate(post.date)}</div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
}
