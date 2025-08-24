class Blog {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbyY3FqdrO4ZZkD3SFNCJNqEePWNU41d-mQvgGMgcWXnFvJEqC8LYJDTl0LkQzfz7kFU/exec';
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.totalPosts = 0;
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Pagination buttons
        const prevBtn = document.getElementById('blog-prev-btn');
        const nextBtn = document.getElementById('blog-next-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.changePage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changePage(1));
        
        // Comment form
        const commentForm = document.getElementById('blog-comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }
    }
    
    async loadPostList(offset = 0) {
        try {
            const response = await fetch(`${this.apiUrl}?action=listPosts&offset=${offset}&limit=${this.postsPerPage}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.totalPosts = data.pagination.total;
            this.renderPostList(data.posts);
            this.updatePagination(data.pagination);
            this.loadRecentPosts(); // Also load recent posts for sidebar
        } catch (error) {
            console.error('Error loading posts:', error);
            document.getElementById('blog-list').innerHTML = 
                '<p>Error loading posts. Please try again later.</p>';
        }
    }
    
    renderPostList(posts) {
        const blogList = document.getElementById('blog-list');
        
        if (posts.length === 0) {
            blogList.innerHTML = '<p>No blog posts found.</p>';
            return;
        }
        
        blogList.innerHTML = posts.map(post => `
            <article class="blog-item">
                <h2><a href="post.html?id=${post.id}">${post.title}</a></h2>
                <div class="blog-meta">
                    Published on ${this.formatDate(post.date)}
                </div>
                <a href="post.html?id=${post.id}">Read more →</a>
            </article>
        `).join('');
    }
    
    updatePagination(pagination) {
        const prevBtn = document.getElementById('blog-prev-btn');
        const nextBtn = document.getElementById('blog-next-btn');
        const pageInfo = document.getElementById('blog-page-info');
        
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
    
    async loadPost(postId) {
        try {
            const response = await fetch(`${this.apiUrl}?action=getPost&postId=${postId}`);
            const post = await response.json();
            
            if (post.error) {
                throw new Error(post.error);
            }
            
            this.renderPost(post);
            this.loadRecentPosts(); // Load recent posts for sidebar
        } catch (error) {
            console.error('Error loading post:', error);
            document.getElementById('blog-post').innerHTML = 
                '<p>Error loading post. Please try again later.</p>';
        }
    }
    
    renderPost(post) {
        // Update page title
        document.title = `${post.title} | My Dynamic Blog`;
        
        // Update post content
        document.getElementById('blog-post-title').textContent = post.title;
        document.getElementById('blog-post-date').textContent = this.formatDate(post.date);
        document.getElementById('blog-post-author').textContent = post.author || 'Unknown Author';
        document.getElementById('blog-post-content').innerHTML = post.content;
        
        // Render tags
        const tagsContainer = document.getElementById('blog-post-tags-list');
        if (tagsContainer) {
            tagsContainer.innerHTML = post.tags.map(tag => 
                `<span class="blog-tag">${tag}</span>`
            ).join('');
        }
        
        // Render comments
        this.renderComments(post.comments);
    }
    
    renderComments(comments) {
        const commentsContainer = document.getElementById('blog-comments-list');
        
        if (!commentsContainer) return;
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }
        
        commentsContainer.innerHTML = comments.map(comment => `
            <div class="blog-comment">
                <div class="blog-comment-meta">
                    ${comment.author} <span class="blog-comment-date">${this.formatDate(comment.date)}</span>
                </div>
                <p>${comment.text}</p>
            </div>
        `).join('');
    }
    
    async handleCommentSubmit(e) {
        e.preventDefault();
        
        const authorInput = document.getElementById('blog-comment-author');
        const textInput = document.getElementById('blog-comment-text');
        const form = e.target;
        
        const author = authorInput.value.trim();
        const text = textInput.value.trim();
        
        if (!author || !text) {
            alert('Please fill in all fields');
            return;
        }
        
        // Get post ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        
        if (!postId) {
            alert('Cannot determine post ID');
            return;
        }
        
        // Format comment data
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
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Clear form
            form.reset();
            
            // Reload post to show new comment
            alert('Comment submitted successfully!');
            this.loadPost(postId);
            
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Error submitting comment. Please try again.');
        }
    }
    
    async loadRecentPosts() {
        try {
            const response = await fetch(`${this.apiUrl}?action=listPosts&limit=5`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.renderRecentPosts(data.posts);
        } catch (error) {
            console.error('Error loading recent posts:', error);
        }
    }
    
    renderRecentPosts(posts) {
        const recentPostsContainer = document.getElementById('blog-recent-posts');
        
        if (!recentPostsContainer) return;
        
        if (posts.length === 0) {
            recentPostsContainer.innerHTML = '<p>No recent posts</p>';
            return;
        }
        
        recentPostsContainer.innerHTML = posts.map(post => `
            <div class="blog-recent-post">
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
