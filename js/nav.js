(function () {
    const tabs = [
        {
            id: 'entry',
            label: 'entry',
            href: 'entry.html',
            icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
        },
        {
            id: 'visuals',
            label: 'visuals',
            href: 'visuals.html',
            icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
        },
        {
            id: 'work',
            label: 'work',
            href: 'work.html',
            icon: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
        },
        {
            id: 'consumption',
            label: 'consumption',
            href: 'consumption.html',
            icon: '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
        },
        {
            id: 'jiu jitsu',
            label: 'jiu jitsu',
            href: 'training.html',
            icon: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
        },
    ];

    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

    const path = window.location.pathname;
    const currentFile = path.split('/').pop() || 'entry.html';

    function activeFor(href) {
        return currentFile === href ? ' active' : '';
    }

    // build tab items HTML
    const tabsHtml = tabs.map(t => `
        <a href="${t.href}" class="app-nav-item${activeFor(t.href)}" aria-label="${t.label}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
            ${t.label}
        </a>`).join('');

    // mobile top bar
    const topBar = document.createElement('div');
    topBar.className = 'app-top-bar';
    topBar.innerHTML = `
        <a href="https://michiscoding.github.io/home.html" class="app-site-link" aria-label="view site">${eyeIcon}</a>
        <button type="button" id="dark-toggle" aria-label="toggle dark mode"></button>
    `;
    document.body.prepend(topBar);

    // main nav (bottom on mobile, top on desktop)
    const nav = document.createElement('nav');
    nav.className = 'app-nav';
    nav.innerHTML = `
        ${tabsHtml}
        <div class="app-nav-end app-nav-desktop-only">
            <a href="https://michiscoding.github.io/home.html" class="app-site-link" aria-label="view site">${eyeIcon}</a>
            <button type="button" id="dark-toggle-desktop" aria-label="toggle dark mode"></button>
        </div>
    `;
    document.body.appendChild(nav);

    // dark mode toggle logic
    function updateToggleIcons() {
        const isDark = document.body.classList.contains('dark');
        const icon = isDark ? sunIcon : moonIcon;
        const t1 = document.getElementById('dark-toggle');
        const t2 = document.getElementById('dark-toggle-desktop');
        if (t1) t1.innerHTML = icon;
        if (t2) t2.innerHTML = icon;
    }

    function toggleDark() {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('dark', isDark ? '1' : '0');
        updateToggleIcons();
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateToggleIcons();
        document.getElementById('dark-toggle')?.addEventListener('click', toggleDark);
        document.getElementById('dark-toggle-desktop')?.addEventListener('click', toggleDark);
    });

    // if DOM already loaded (script at end of body)
    if (document.readyState !== 'loading') {
        updateToggleIcons();
        document.getElementById('dark-toggle')?.addEventListener('click', toggleDark);
        document.getElementById('dark-toggle-desktop')?.addEventListener('click', toggleDark);
    }
})();
