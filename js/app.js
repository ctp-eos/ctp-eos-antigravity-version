/* ==========================================================================
   CTP-EOS // Classic Nuke Portal Main Application Logic
   Dynamic Filtering, Search, Category Navigation, Modals & Theme Manager
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let activeCategory = 'all';
    let activeFilter = 'all'; // 'all', 'original', 'fork'
    let searchQuery = '';

    // DOM Elements
    const repoGrid = document.getElementById('repoGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryMenuList = document.getElementById('categoryMenuList');
    const categoryTitle = document.getElementById('categoryTitle');
    const repoCountBadge = document.getElementById('repoCountBadge');
    const themeSelect = document.getElementById('themeSelect');
    const toggleScanlinesBtn = document.getElementById('toggleScanlines');
    
    // Stats Elements
    const totalReposEl = document.getElementById('statTotalRepos');
    const origReposEl = document.getElementById('statOrigRepos');
    const forkReposEl = document.getElementById('statForkRepos');

    // Modal Elements
    const repoModal = document.getElementById('repoModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalCloneCmd = document.getElementById('modalCloneCmd');
    const modalGithubLink = document.getElementById('modalGithubLink');
    const modalLang = document.getElementById('modalLang');
    const modalType = document.getElementById('modalType');
    const modalClose = document.getElementById('modalClose');

    // --- INITIALIZE THEME ---
    const savedTheme = localStorage.getItem('ctp_theme') || 'cerulean';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('ctp_theme', newTheme);
        });
    }

    if (toggleScanlinesBtn) {
        toggleScanlinesBtn.addEventListener('click', () => {
            document.body.classList.toggle('scanlines-off');
        });
    }

    // --- POPULATE STATS & SIDEBAR MENU ---
    if (typeof CTP_DATA !== 'undefined') {
        if (totalReposEl) totalReposEl.textContent = CTP_DATA.meta.total;
        if (origReposEl) origReposEl.textContent = CTP_DATA.meta.originals;
        if (forkReposEl) forkReposEl.textContent = CTP_DATA.meta.forks;

        renderCategoryMenu();
        renderRepositories();
    }

    // --- CATEGORY MENU RENDERER ---
    function renderCategoryMenu() {
        if (!categoryMenuList) return;
        categoryMenuList.innerHTML = '';

        // "All Repositories" entry
        const allLi = document.createElement('li');
        allLi.className = `nuke-menu-item ${activeCategory === 'all' ? 'active' : ''}`;
        allLi.innerHTML = `
            <span>🗂️ All Repositories</span>
            <span class="menu-count-badge">${CTP_DATA.meta.total}</span>
        `;
        allLi.addEventListener('click', () => selectCategory('all', 'All Repositories Matrix'));
        categoryMenuList.appendChild(allLi);

        // Individual Categories
        for (const [key, cat] of Object.entries(CTP_DATA.categories)) {
            const li = document.createElement('li');
            li.className = `nuke-menu-item ${activeCategory === key ? 'active' : ''}`;
            li.innerHTML = `
                <span>${cat.icon} ${cat.title}</span>
                <span class="menu-count-badge">${cat.repos.length}</span>
            `;
            li.addEventListener('click', () => selectCategory(key, cat.title));
            categoryMenuList.appendChild(li);
        }
    }

    function selectCategory(catKey, title) {
        activeCategory = catKey;
        if (categoryTitle) categoryTitle.textContent = title;
        renderCategoryMenu();
        renderRepositories();
    }

    // --- SEARCH & FILTER LISTENERS ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderRepositories();
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderRepositories();
        });
    });

    // --- REPOSITORY RENDERER ---
    function renderRepositories() {
        if (!repoGrid || typeof CTP_DATA === 'undefined') return;

        let filtered = CTP_DATA.allRepos;

        // Filter by Category
        if (activeCategory !== 'all') {
            filtered = filtered.filter(r => r.category === activeCategory);
        }

        // Filter by Original vs Fork
        if (activeFilter === 'original') {
            filtered = filtered.filter(r => !r.fork);
        } else if (activeFilter === 'fork') {
            filtered = filtered.filter(r => r.fork);
        }

        // Filter by Search Query
        if (searchQuery) {
            filtered = filtered.filter(r => 
                r.name.toLowerCase().includes(searchQuery) ||
                r.desc.toLowerCase().includes(searchQuery) ||
                r.language.toLowerCase().includes(searchQuery)
            );
        }

        if (repoCountBadge) {
            repoCountBadge.textContent = `${filtered.length} Repos`;
        }

        repoGrid.innerHTML = '';

        if (filtered.length === 0) {
            repoGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); font-family: var(--font-mono);">
                    [!] No repositories match your search or filter criteria.
                </div>
            `;
            return;
        }

        filtered.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'repo-card';
            
            const badgeClass = repo.fork ? 'badge-fork' : 'badge-orig';
            const badgeLabel = repo.fork ? 'FORK' : 'ORIGINAL';

            card.innerHTML = `
                <div class="card-header-row">
                    <a href="${repo.url}" target="_blank" rel="noopener" class="repo-title-link">${repo.name}</a>
                    <span class="repo-type-badge ${badgeClass}">${badgeLabel}</span>
                </div>
                <div class="repo-desc">${repo.desc}</div>
                <div class="card-footer-row">
                    <div class="lang-tag">
                        <span class="lang-dot"></span>
                        <span>${repo.language}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon btn-details" data-name="${repo.name}">Inspect</button>
                        <button class="btn-icon btn-clone" data-clone="${repo.clone_url}">Clone</button>
                    </div>
                </div>
            `;

            // Event Listeners for buttons
            const detailsBtn = card.querySelector('.btn-details');
            detailsBtn.addEventListener('click', () => openRepoModal(repo));

            const cloneBtn = card.querySelector('.btn-clone');
            cloneBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`git clone ${repo.clone_url}`);
                cloneBtn.textContent = 'Copied!';
                setTimeout(() => { cloneBtn.textContent = 'Clone'; }, 1800);
            });

            repoGrid.appendChild(card);
        });
    }

    // --- REPO MODAL HANDLER ---
    function openRepoModal(repo) {
        if (!repoModal) return;
        
        modalTitle.textContent = repo.name;
        modalDesc.textContent = repo.desc;
        modalCloneCmd.textContent = `git clone ${repo.clone_url}`;
        modalGithubLink.href = repo.url;
        modalLang.textContent = repo.language;
        modalType.textContent = repo.fork ? 'Ecosystem Fork' : 'Original CTP-EOS Repository';
        modalType.className = `repo-type-badge ${repo.fork ? 'badge-fork' : 'badge-orig'}`;

        repoModal.classList.add('open');
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => repoModal.classList.remove('open'));
    }

    if (repoModal) {
        repoModal.addEventListener('click', (e) => {
            if (e.target === repoModal) repoModal.classList.remove('open');
        });
    }

    // --- POLL INTERACTION ---
    const pollItems = document.querySelectorAll('.poll-item');
    pollItems.forEach(item => {
        item.addEventListener('click', () => {
            pollItems.forEach(i => i.classList.remove('voted'));
            item.classList.add('voted');
            const bar = item.querySelector('.poll-bar');
            if (bar) bar.style.width = '78%';
            alert("Vote recorded in CTP Quantum Vault! Thank you for contributing to CTP-EOS research.");
        });
    });
});
