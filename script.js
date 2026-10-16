// Mark that JS is available so progressive enhancements (animations,
// carousel arrows) only apply when they can actually work.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Section titles slide in on scroll ---------- */
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        reveals.forEach((el) => io.observe(el));
    } else {
        reveals.forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------- Header border once the page scrolls ---------- */
    const header = document.querySelector('.site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Highlight the nav link for the section in view ---------- */
    const navLinks = [...document.querySelectorAll('.nav-list a[href^="#"]')];
    const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((a) => {
                    if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
                    else a.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });   // a thin band across the middle of the screen
        sections.forEach((s) => spy.observe(s));
        // Clear the highlight when back at the top (hero)
        window.addEventListener('scroll', () => {
            if (window.scrollY < 200) navLinks.forEach((a) => a.removeAttribute('aria-current'));
        }, { passive: true });
    }

    /* ---------- Guliyo "View all designs" toggle ---------- */
    document.querySelectorAll('[data-toggle-gallery]').forEach((btn) => {
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        const label = btn.querySelector('[data-label]');
        if (!panel) return;

        btn.addEventListener('click', () => {
            const open = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!open));
            panel.hidden = open;
            label.textContent = open ? 'View all designs' : 'Hide designs';
            if (!open) {
                updateArrows(panel);
                panel.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
            }
        });
    });

    /* ---------- Carousel: arrow buttons + mouse drag ---------- */
    document.querySelectorAll('.gallery').forEach((gallery) => {
        const track = gallery.querySelector('.carousel');
        if (!track) return;

        gallery.querySelectorAll('[data-scroll]').forEach((b) => {
            b.addEventListener('click', () => {
                const dir = Number(b.dataset.scroll);
                track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
            });
        });

        track.addEventListener('scroll', () => updateArrows(gallery), { passive: true });
        window.addEventListener('resize', () => updateArrows(gallery));

        // Click-and-drag for mouse users only; touch uses native scrolling.
        let dragging = false, startX = 0, startLeft = 0, moved = false;
        track.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'mouse') return;
            dragging = true; moved = false;
            startX = e.clientX; startLeft = track.scrollLeft;
            track.style.scrollSnapType = 'none';
            track.style.cursor = 'grabbing';
        });
        window.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 3) moved = true;
            track.scrollLeft = startLeft - dx;
        });
        window.addEventListener('pointerup', () => {
            if (!dragging) return;
            dragging = false;
            track.style.scrollSnapType = '';
            track.style.cursor = '';
        });
        track.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);
        track.addEventListener('dragstart', (e) => e.preventDefault());

        // Arrow keys scroll the gallery when it has focus (Safari doesn't do this natively)
        track.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            const dir = e.key === 'ArrowRight' ? 1 : -1;
            track.scrollBy({ left: dir * track.clientWidth * 0.6, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        });
    });

    /* ---------- Footer year ---------- */
    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
});

function updateArrows(gallery) {
    const track = gallery.querySelector('.carousel');
    const prev = gallery.querySelector('[data-scroll="-1"]');
    const next = gallery.querySelector('[data-scroll="1"]');
    if (!track || !prev || !next) return;
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
