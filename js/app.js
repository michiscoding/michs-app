// dark mode
(function() {
    if (localStorage.getItem('dark') === '1') document.body.classList.add('dark');
})();


// set grid width to match homepage
function setWidth() {
    const maxWidth = window.innerWidth * 0.67;
    document.documentElement.style.setProperty('--maxWidth', `${maxWidth}px`);
}
window.addEventListener('load', setWidth);
window.addEventListener('resize', setWidth);

// register service worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// fade in
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '1';
    setWidth();
    setTimeout(() => document.body.classList.add('transitions-enabled'), 500);
});

// nav fade in/out
function hideNav(el) {
    el.style.pointerEvents = 'none';
    let opacity = 1;
    let id = setInterval(() => {
        if (opacity > 0) { opacity -= 0.1; el.style.opacity = opacity; }
        else clearInterval(id);
    }, 40);
}

function showNav(el) {
    el.style.pointerEvents = 'auto';
    let opacity = 0;
    let id = setInterval(() => {
        if (opacity < 1) { opacity += 0.1; el.style.opacity = opacity; }
        else clearInterval(id);
    }, 40);
}

document.addEventListener('DOMContentLoaded', () => {
    const burgerBtn = document.getElementById('burger-btn');
    const burgerIcon = document.getElementById('burger-icon');
    const closeIcon = document.getElementById('close-icon');
    const navMenu = document.querySelector('.nav-menu');
    let navOpen = false;

    burgerBtn.addEventListener('click', () => {
        navOpen = !navOpen;
        burgerIcon.style.opacity = navOpen ? '0' : '1';
        closeIcon.style.opacity = navOpen ? '1' : '0';
        if (navOpen) {
            showNav(navMenu);
        } else {
            hideNav(navMenu);
            const workSub = document.getElementById('work-sub');
            if (workSub) workSub.classList.remove('open');
        }
    });

    const workToggle = document.getElementById('work-toggle');
    const workSub = document.getElementById('work-sub');
    if (workToggle) {
        workToggle.addEventListener('click', () => {
            workSub.classList.toggle('open');
        });
    }

    const darkToggle = document.getElementById('dark-toggle');
    if (darkToggle) {
        const updateIcon = () => {
            darkToggle.textContent = document.body.classList.contains('dark') ? '☀︎' : '☾';
        };
        updateIcon();
        darkToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            localStorage.setItem('dark', isDark ? '1' : '0');
            updateIcon();
        });
    }
});
