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

