// Portfolio menu: hash-routed screens that open over the level
// (#about, #status, #work, #equip, #contact), a vertical skill list,
// the Guliyo inventory viewer and copy-to-clipboard.
// Without JavaScript every screen simply shows below the level.
(function () {
    document.documentElement.classList.add('js');

    var SCREENS = ['about', 'status', 'work', 'equip', 'contact'];

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        /* ---------- Menu tabs + the portfolio overlay ----------
           #about #status #work #equip #contact open that screen over the
           level (the run pauses); #play or no hash shows the level. */
        var tabs = Array.prototype.slice.call(document.querySelectorAll('.menu-tab'));
        var screens = SCREENS.map(function (id) { return document.getElementById(id); });
        var portal = document.getElementById('portal');
        var topbar = document.getElementById('topbar');
        var lastFocus = null;

        function setHudHeight() {
            if (topbar) document.documentElement.style.setProperty('--hud-h', topbar.offsetHeight + 'px');
        }
        setHudHeight();
        window.addEventListener('resize', setHudHeight);

        function showScreen(id) {
            var open = SCREENS.indexOf(id) !== -1;
            screens.forEach(function (s) { s.hidden = s.id !== id; });
            tabs.forEach(function (t) {
                if (t.getAttribute('href') === '#' + id) t.setAttribute('aria-current', 'true');
                else t.removeAttribute('aria-current');
            });
            if (!portal) return;
            var wasOpen = portal.classList.contains('is-open');
            portal.classList.toggle('is-open', open);
            document.documentElement.classList.toggle('portal-open', open);
            if (open) {
                if (!wasOpen) lastFocus = document.activeElement;
                portal.scrollTop = 0;
                if (!wasOpen) document.getElementById('portal-close').focus({ preventScroll: true });
            } else if (wasOpen) {
                var canvas = document.getElementById('game');
                (canvas || lastFocus || document.body).focus({ preventScroll: true });
            }
            document.dispatchEvent(new CustomEvent('portal', { detail: { open: open, id: id } }));
        }

        function fromHash() {
            return (location.hash || '').replace('#', '');
        }

        function closePortal() {
            if (location.hash && location.hash !== '#play') location.hash = 'play';
            else showScreen('play');
        }

        showScreen(fromHash());
        window.addEventListener('hashchange', function () { showScreen(fromHash()); });

        var closeBtn = document.getElementById('portal-close');
        if (closeBtn) closeBtn.addEventListener('click', closePortal);
        document.addEventListener('keydown', function (e) {
            var viewerOpen = document.getElementById('viewer') && document.getElementById('viewer').open;
            if (e.key === 'Escape' && portal && portal.classList.contains('is-open') && !viewerOpen) {
                e.preventDefault();
                closePortal();
            }
        });

        // Clicking the dimmed level outside the pop-up closes it
        document.addEventListener('click', function (e) {
            if (!portal || !portal.classList.contains('is-open')) return;
            if (e.target.closest('.portal, .topbar, .viewer')) return;
            closePortal();
        });

        // Let the game open a screen when a ? block is hit
        window.portfolioOpen = function (id) { location.hash = id; };

        /* ---------- Pop-up menu (character info) ---------- */
        var toggle = document.getElementById('menu-toggle');
        var pop = document.getElementById('menu-pop');

        function setMenu(open, focusFirst) {
            if (!toggle || !pop) return;
            pop.hidden = !open;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open && focusFirst) {
                var current = pop.querySelector('[aria-current="true"]') || tabs[0];
                current.focus();
            }
        }

        if (toggle && pop) {
            toggle.addEventListener('click', function () { setMenu(pop.hidden, true); });
            tabs.forEach(function (t) {
                t.addEventListener('click', function () { setMenu(false); });
            });
            document.addEventListener('click', function (e) {
                if (!pop.hidden && !pop.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
            });
            // Esc closes the menu first (before the portfolio overlay); ↑ ↓ move through it
            window.addEventListener('keydown', function (e) {
                if (pop.hidden) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenu(false);
                    toggle.focus();
                    return;
                }
                var i = tabs.indexOf(document.activeElement);
                if (i === -1) return;
                var next = null;
                if (e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
                if (e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
                if (e.key === 'Home') next = tabs[0];
                if (e.key === 'End') next = tabs[tabs.length - 1];
                if (next) { e.preventDefault(); next.focus(); }
            }, true);
        }

        /* ---------- Skill list ---------- */
        var skillTabs = Array.prototype.slice.call(document.querySelectorAll('.skill-tab'));
        var narrow = window.matchMedia('(max-width: 51.99em)');

        function selectSkill(tab, opts) {
            opts = opts || {};
            skillTabs.forEach(function (t) {
                var on = t === tab;
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
                document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
            });
            if (opts.focus) tab.focus();
            if (opts.reveal && narrow.matches) {
                document.getElementById(tab.getAttribute('aria-controls')).scrollIntoView({ block: 'start' });
            }
        }

        if (skillTabs.length) selectSkill(skillTabs[0]);

        skillTabs.forEach(function (t, i) {
            t.addEventListener('click', function () { selectSkill(t, { reveal: true }); });
            t.addEventListener('keydown', function (e) {
                var next = null;
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = skillTabs[(i + 1) % skillTabs.length];
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = skillTabs[(i - 1 + skillTabs.length) % skillTabs.length];
                if (e.key === 'Home') next = skillTabs[0];
                if (e.key === 'End') next = skillTabs[skillTabs.length - 1];
                if (!next) return;
                e.preventDefault();
                selectSkill(next, { focus: true });
            });
        });

        // Equip items link to the project that used them
        document.querySelectorAll('[data-skill]').forEach(function (a) {
            a.addEventListener('click', function () {
                var tab = document.getElementById(a.dataset.skill);
                if (tab) selectSkill(tab);
            });
        });

        /* ---------- Guliyo inventory viewer ---------- */
        var viewer = document.getElementById('viewer');
        var viewerImg = document.getElementById('viewer-img');
        var viewerTitle = document.getElementById('viewer-title');
        var lastSlot = null;

        // Each gallery (Guliyo inventory, each photo location) flips through its own items
        var slots = Array.prototype.slice.call(document.querySelectorAll('.slot'));
        var viewerCount = document.getElementById('viewer-count');
        var current = 0, group = slots;

        function showItem(i) {
            current = (i + group.length) % group.length;
            var slot = group[current], thumb = slot.querySelector('img');
            lastSlot = slot;
            viewerImg.src = slot.dataset.full;
            viewerImg.alt = thumb.alt;
            viewerTitle.textContent = slot.dataset.title || thumb.alt;
            if (viewerCount) viewerCount.textContent = (current + 1) + ' / ' + group.length;
        }

        slots.forEach(function (slot) {
            slot.addEventListener('click', function () {
                if (!viewer || typeof viewer.showModal !== 'function') {
                    window.open(slot.dataset.full, '_blank');
                    return;
                }
                group = Array.prototype.slice.call(slot.closest('ul').querySelectorAll('.slot'));
                showItem(group.indexOf(slot));
                viewer.showModal();
            });
        });

        if (viewer) {
            document.getElementById('viewer-close').addEventListener('click', function () { viewer.close(); });
            document.getElementById('viewer-prev').addEventListener('click', function () { showItem(current - 1); });
            document.getElementById('viewer-next').addEventListener('click', function () { showItem(current + 1); });
            // ← → also flip through the designs while the viewer is open
            viewer.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowLeft') { e.preventDefault(); showItem(current - 1); }
                if (e.key === 'ArrowRight') { e.preventDefault(); showItem(current + 1); }
            });
            viewer.addEventListener('click', function (e) { if (e.target === viewer) viewer.close(); });
            viewer.addEventListener('close', function () { if (lastSlot) lastSlot.focus(); });
        }

        /* ---------- Photography map: pins + location chips pick a place ---------- */
        var placeButtons = Array.prototype.slice.call(document.querySelectorAll('button[data-place]'));
        var placeSections = Array.prototype.slice.call(document.querySelectorAll('section.place'));

        // Places you've opened stay lit on the map (remembered in this browser)
        var visited = {};
        try { visited = JSON.parse(localStorage.getItem('unnati-visited') || '{}') || {}; } catch (e) { visited = {}; }

        function paintVisited() {
            document.querySelectorAll('.map-glow').forEach(function (g) { g.classList.toggle('is-visited', !!visited[g.dataset.glow]); });
            placeButtons.forEach(function (b) { b.classList.toggle('is-visited', !!visited[b.dataset.place]); });
        }

        function selectPlace(key) {
            visited[key] = true;
            try { localStorage.setItem('unnati-visited', JSON.stringify(visited)); } catch (e) { /* storage unavailable */ }
            paintVisited();
            placeSections.forEach(function (sec) { sec.hidden = sec.dataset.place !== key; });
            placeButtons.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.place === key ? 'true' : 'false'); });
        }

        if (placeSections.length) {
            var first = placeSections.filter(function (s) { return !s.hasAttribute('data-start-hidden'); })[0] || placeSections[0];
            selectPlace(first.dataset.place);
            placeButtons.forEach(function (b) {
                b.addEventListener('click', function () {
                    selectPlace(b.dataset.place);
                    if (b.classList.contains('map-pin') && narrow.matches) {
                        document.getElementById('place-' + b.dataset.place).scrollIntoView({ block: 'nearest' });
                    }
                });
            });
        }

        // Inventory: show the hovered / focused photo's name under the grid
        document.querySelectorAll('.photo-grid').forEach(function (grid) {
            var info = grid.parentNode.querySelector('.item-name');
            if (!info) return;
            var idle = info.textContent;
            grid.querySelectorAll('.photo-slot').forEach(function (slot) {
                var show = function () { info.textContent = slot.dataset.title; };
                slot.addEventListener('mouseenter', show);
                slot.addEventListener('focus', show);
                slot.addEventListener('mouseleave', function () { if (document.activeElement !== slot) info.textContent = idle; });
                slot.addEventListener('blur', function () { info.textContent = idle; });
            });
        });

        /* ---------- Copy email ---------- */
        var copyBtn = document.getElementById('copy-email');
        var toast = document.getElementById('toast');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var text = document.getElementById('email-text').textContent.trim();
                function selectIt() {
                    var range = document.createRange();
                    range.selectNodeContents(document.getElementById('email-text'));
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    toast.textContent = 'Email selected. Press Ctrl/Cmd + C to copy.';
                }
                try {
                    navigator.clipboard.writeText(text).then(function () {
                        toast.textContent = 'Copied! ' + text;
                    }, selectIt);
                } catch (err) {
                    selectIt();
                }
            });
        }

        /* ---------- Footer year ---------- */
        var year = document.querySelector('[data-year]');
        if (year) year.textContent = new Date().getFullYear();
    });
})();
