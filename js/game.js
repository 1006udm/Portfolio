// Portfolio Run: a small side-scrolling platformer drawn on <canvas>.
// Art: "Pixel Platformer" by Kenney (CC0). Run right, bump the ! blocks to
// open each portfolio screen, reach the flag to stop the speedrun timer.
(function () {
    'use strict';

    var canvas = document.getElementById('game');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var stage = document.getElementById('play');

    /* ---------------- Assets ---------------- */
    var T = 18;                       // world tile size (px)
    var imgs = { tiles: 'assets/game/tiles.png', chars: 'assets/game/characters.png', bg: 'assets/game/backgrounds.png' };
    var loaded = 0, total = 3;
    Object.keys(imgs).forEach(function (k) {
        var im = new Image();
        im.onload = function () { loaded++; };
        im.src = imgs[k];
        imgs[k] = im;
    });

    // Tile ids in the 20-column tile sheet
    var TILE = {
        topS: 0, topL: 1, topM: 2, topR: 3,
        fillS: 120, fillL: 121, fillM: 122, fillR: 123,
        brick: 6, block: 10, used: 29,
        coinA: 151, coinB: 152,
        spikes: 68,
        pipeCap: 95, pipe: 115,
        flagA: 111, flagB: 112, pole: 131,
        tuft: 124, sprout: 125, pine: 126, mushroom: 128, sign: 85, door: 130, doorLow: 150
    };
    // Character sheet (9 columns, 24px)
    var CHAR = { standA: 2, stepA: 3, walkerA: 18, walkerB: 19, walkerFlat: 20 };

    function drawTile(id, x, y) {
        ctx.drawImage(imgs.tiles, (id % 20) * T, Math.floor(id / 20) * T, T, T, x, y, T, T);
    }
    function drawChar(id, x, y, flip) {
        var sx = (id % 9) * 24, sy = Math.floor(id / 9) * 24;
        if (flip) {
            ctx.save();
            ctx.translate(x + 24, y);
            ctx.scale(-1, 1);
            ctx.drawImage(imgs.chars, sx, sy, 24, 24, 0, 0, 24, 24);
            ctx.restore();
        } else {
            ctx.drawImage(imgs.chars, sx, sy, 24, 24, x, y, 24, 24);
        }
    }

    /* ---------------- Level ---------------- */
    var W = 150, H = 15;
    var SECTIONS = [
        { id: 'about', label: 'CHARACTER' },
        { id: 'status', label: 'STATUS' },
        { id: 'work', label: 'SKILLS' },
        { id: 'equip', label: 'EQUIP' },
        { id: 'contact', label: 'CONTACT' }
    ];
    var grid, blocks, coins, enemies, decor, flagCol, totalCoins;

    function buildLevel() {
        grid = [];
        for (var i = 0; i < W * H; i++) grid.push('');
        blocks = []; coins = []; enemies = []; decor = [];

        function set(c, r, v) { if (c >= 0 && c < W && r >= 0 && r < H) grid[r * W + c] = v; }
        function ground(c0, c1, top) { for (var c = c0; c <= c1; c++) for (var r = top; r < H; r++) set(c, r, '#'); }
        function brick(c, r) { set(c, r, 'b'); }
        function block(c, r, section) { set(c, r, 'q'); blocks.push({ c: c, r: r, section: section, used: false, bump: 0 }); }
        function pipe(c, h) { set(c, 12 - h, 'p'); for (var r = 13 - h; r < 12; r++) set(c, r, '|'); }
        function coin(c, r) { coins.push({ x: c * T, y: r * T, got: false }); }
        function enemy(c, r) { enemies.push({ x: c * T + 2, y: r * T + 4, w: 14, h: 14, vx: -32, vy: 0, dead: 0, sx: c * T + 2, sy: r * T + 4 }); }
        function spikes(c, r) { set(c, r, '^'); }

        // ground with gaps
        ground(0, 29, 12); ground(33, 60, 12); ground(64, 99, 12); ground(103, 149, 12);
        ground(44, 48, 10);              // hill
        ground(84, 88, 11);              // bump

        pipe(22, 2); pipe(54, 3); pipe(108, 2);

        // ! blocks: each one is a level-up that unlocks a portfolio screen
        brick(9, 8); block(10, 8, SECTIONS[0]); brick(11, 8);
        block(38, 9, SECTIONS[1]);
        brick(69, 8); block(70, 8, SECTIONS[2]); brick(71, 8);
        block(92, 8, SECTIONS[3]);
        brick(115, 8); block(116, 8, SECTIONS[4]); brick(117, 8);

        // floating platforms
        for (var c = 76; c <= 80; c++) brick(c, 8);
        for (c = 95; c <= 97; c++) brick(c, 9);
        spikes(78, 11); spikes(79, 11);

        // staircase to the flag
        for (var s = 0; s < 6; s++) for (var r = 11 - s; r <= 11; r++) brick(128 + s, r);
        flagCol = 140;

        // coins
        [[15, 10], [16, 10], [17, 10], [18, 10], [19, 10],
         [30, 9], [31, 8], [32, 9],
         [45, 8], [46, 8], [47, 8],
         [61, 9], [62, 8], [63, 9],
         [76, 6], [77, 6], [78, 6], [79, 6], [80, 6],
         [100, 8], [101, 7], [102, 8],
         [121, 10], [122, 9], [123, 10],
         [133, 4], [134, 4], [135, 5]].forEach(function (p) { coin(p[0], p[1]); });
        totalCoins = coins.length;

        // enemies
        enemy(18, 11); enemy(40, 11); enemy(67, 11); enemy(90, 11); enemy(120, 11);

        // decoration (no collision)
        decor = [
            [TILE.sign, 3, 11], [TILE.pine, 6, 11], [TILE.tuft, 13, 11], [TILE.sprout, 26, 11],
            [TILE.pine, 35, 11], [TILE.mushroom, 46, 9], [TILE.tuft, 51, 11], [TILE.pine, 58, 11],
            [TILE.sprout, 73, 11], [TILE.tuft, 93, 11], [TILE.pine, 105, 11], [TILE.mushroom, 112, 11],
            [TILE.tuft, 124, 11], [TILE.door, 145, 10], [TILE.doorLow, 145, 11], [TILE.pine, 143, 11]
        ];
    }

    function tileAt(c, r) {
        if (c < 0 || c >= W) return '#';
        if (r < 0 || r >= H) return '';
        return grid[r * W + c];
    }
    function solid(v) { return v === '#' || v === 'b' || v === 'q' || v === 'u' || v === 'p' || v === '|'; }

    /* ---------------- Player + run state ---------------- */
    var G = 1500, MAXFALL = 560, ACC = 1300, FRICTION = 1600, MAXRUN = 150, JUMP = 430, HIGH_JUMP = 560;   // ↑ normal jump (~3 tiles), Space high jump (~5 tiles)
    var player, run, camX = 0, checkpoint;

    function resetPlayer(cp) {
        player = { x: cp.x, y: cp.y, w: 12, h: 18, vx: 0, vy: 0, onGround: false, coyote: 0, face: 1, anim: 0, hurt: 0 };
    }

    function newRun() {
        buildLevel();
        checkpoint = { x: 2 * T, y: 10 * T };
        resetPlayer(checkpoint);
        run = { state: 'ready', time: 0, coins: 0, clearAt: 0, unlocked: [] };
        if (typeof confetti !== 'undefined') { confetti.length = 0; cheerT = 0; }
        hideLevelUp();
        markMenu();
        camX = 0;
        updateHud(true);
    }

    /* ---------------- Input ---------------- */
    var keys = { left: false, right: false, jump: false, high: false };
    var jumpBuffer = 0, jumpHeld = false, jumpCut = false, jumpPower = 430;
    var portalOpen = false;

    var KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'high', KeyZ: 'jump', KeyX: 'high' };

    function interactive(el) {
        if (!el || el === document.body || el === canvas) return false;
        var tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || el.isContentEditable;
    }

    window.addEventListener('keydown', function (e) {
        var k = KEYMAP[e.code];
        if (!k || portalOpen || e.metaKey || e.ctrlKey || e.altKey) return;
        if (interactive(document.activeElement) && document.activeElement.closest('.topbar, .stage-card')) return;
        e.preventDefault();
        if (run.state === 'ready') startRun();
        if ((k === 'jump' || k === 'high') && !keys[k]) { jumpBuffer = 0.12; jumpHeld = true; jumpCut = false; jumpPower = k === 'high' ? HIGH_JUMP : JUMP; }
        keys[k] = true;
    });
    window.addEventListener('keyup', function (e) {
        var k = KEYMAP[e.code];
        if (!k) return;
        keys[k] = false;
        if (k === 'jump' || k === 'high') jumpHeld = keys.jump || keys.high;
    });
    window.addEventListener('blur', function () { keys.left = keys.right = keys.jump = keys.high = false; jumpHeld = false; });

    // On-screen pad for touch screens
    Array.prototype.forEach.call(document.querySelectorAll('[data-pad]'), function (btn) {
        var k = btn.getAttribute('data-pad');
        function down(e) {
            e.preventDefault();
            if (run.state === 'ready') startRun();
            if (k === 'jump' || k === 'high') { jumpBuffer = 0.12; jumpHeld = true; jumpCut = false; jumpPower = k === 'high' ? HIGH_JUMP : JUMP; }
            keys[k] = true;
            btn.classList.add('is-down');
        }
        function up() { keys[k] = false; if (k === 'jump' || k === 'high') jumpHeld = keys.jump || keys.high; btn.classList.remove('is-down'); }
        btn.addEventListener('pointerdown', down);
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
        btn.addEventListener('pointerleave', up);
        btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    document.addEventListener('portal', function (e) {
        portalOpen = e.detail.open;
        keys.left = keys.right = keys.jump = keys.high = false;
        jumpHeld = false;
    });

    /* ---------------- Cards + HUD ---------------- */
    var startCard = document.getElementById('start-card');
    var clearCard = document.getElementById('clear-card');
    var hudTime = document.getElementById('run-time');
    var hudCoins = document.getElementById('run-coins');
    var hudLevel = document.getElementById('run-level');
    var lastTimeText = '', lastCoins = -1, lastLevel = -1;

    function fmt(t) {
        var m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t * 100) % 100);
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (cs < 10 ? '0' : '') + cs;
    }
    function updateHud(force) {
        var t = fmt(run.time);
        if (force || t !== lastTimeText) { hudTime.textContent = t; lastTimeText = t; }
        if (force || run.coins !== lastCoins) { hudCoins.textContent = run.coins; lastCoins = run.coins; }
        var lv = 1 + run.unlocked.length;
        if (hudLevel && (force || lv !== lastLevel)) { hudLevel.textContent = lv + (lv === SECTIONS.length + 1 ? ' MAX' : ''); lastLevel = lv; }
    }

    /* ---------------- Level up: each ! block unlocks a portfolio screen ---------------- */
    var levelUp = document.getElementById('levelup');
    var levelUpTimer = null, levelUpSection = null;

    function hideLevelUp() {
        if (levelUp) levelUp.hidden = true;
        levelUpSection = null;
        clearTimeout(levelUpTimer);
    }

    function markMenu() {
        SECTIONS.forEach(function (sec) {
            var link = document.getElementById('tab-' + sec.id);
            if (link) link.classList.toggle('is-unlocked', run.unlocked.indexOf(sec.id) !== -1);
        });
        var toggle = document.getElementById('menu-toggle');
        if (toggle) toggle.classList.toggle('has-new', run.unlocked.length > 0 && run.unlocked.length > (run.seen || 0));
    }

    function showLevelUp(sec) {
        var again = run.unlocked.indexOf(sec.id) !== -1;
        if (!again) run.unlocked.push(sec.id);
        markMenu();
        if (!levelUp) return;
        var lv = 1 + run.unlocked.length;
        document.getElementById('levelup-level').textContent = again ? 'Unlocked · LV ' + lv + (lv === SECTIONS.length + 1 ? ' MAX' : '') : 'Level up! LV ' + lv + (lv === SECTIONS.length + 1 ? ' MAX' : '');
        document.getElementById('levelup-name').textContent = sec.label;
        document.getElementById('levelup-verb').textContent = again ? 'ready to view' : 'unlocked';
        levelUpSection = sec;
        levelUp.hidden = false;
        levelUp.classList.remove('is-pop');
        void levelUp.offsetWidth;            // restart the pop animation
        levelUp.classList.add('is-pop');
        clearTimeout(levelUpTimer);
        levelUpTimer = setTimeout(hideLevelUp, 5000);
    }

    function openUnlocked() {
        if (!levelUpSection) return;
        var id = levelUpSection.id;
        hideLevelUp();
        if (window.portfolioOpen) window.portfolioOpen(id);
    }

    // Opening the menu marks the new unlocks as seen
    var menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) menuToggle.addEventListener('click', function () { run.seen = run.unlocked.length; markMenu(); });

    var levelUpOpen = document.getElementById('levelup-open');
    if (levelUpOpen) levelUpOpen.addEventListener('click', openUnlocked);

    // Enter opens the screen just unlocked; M opens the menu, both mid-run
    window.addEventListener('keydown', function (e) {
        if (portalOpen || e.metaKey || e.ctrlKey || e.altKey) return;
        if (interactive(document.activeElement)) return;
        if (e.key === 'Enter' && levelUpSection) { e.preventDefault(); openUnlocked(); }
        if (e.code === 'KeyM') {
            e.preventDefault();
            var t = document.getElementById('menu-toggle');
            if (t) t.click();
        }
    });

    function startRun() {
        if (run.state !== 'ready') return;
        run.state = 'running';
        startCard.hidden = true;
        canvas.focus({ preventScroll: true });
    }

    function bestTime() {
        try { var v = parseFloat(localStorage.getItem('unnati-run-best')); return isFinite(v) ? v : null; } catch (e) { return null; }
    }
    function saveBest(t) {
        try { localStorage.setItem('unnati-run-best', String(t)); } catch (e) { /* storage unavailable */ }
    }

    function courseClear() {
        run.state = 'clear';
        keys.left = keys.right = false;
        var best = bestTime();
        var isBest = best === null || run.time < best;
        if (isBest) saveBest(run.time);
        document.getElementById('clear-time').textContent = fmt(run.time);
        document.getElementById('clear-detail').textContent =
            (isBest ? 'New best time! ' : 'Best: ' + fmt(best) + '. ') +
            'Coins: ' + run.coins + ' / ' + totalCoins + '. Level ' + (1 + run.unlocked.length) + ' (' + run.unlocked.length + ' / ' + SECTIONS.length + ' unlocked).';
        celebrate();
        setTimeout(function () { clearCard.hidden = false; }, 2400);
    }

    document.getElementById('start-run').addEventListener('click', startRun);
    // ✕ on a pop-up card: close it and hand control to the level
    Array.prototype.forEach.call(document.querySelectorAll('[data-card-close]'), function (btn) {
        btn.addEventListener('click', function () {
            btn.closest('.stage-card').hidden = true;
            canvas.focus({ preventScroll: true });
        });
    });
    document.getElementById('run-again').addEventListener('click', function () {
        clearCard.hidden = true;
        newRun();
        startRun();
    });

    /* ---------------- Physics ---------------- */
    function overlapTiles(x, y, w, h, fn) {
        var c0 = Math.floor(x / T), c1 = Math.floor((x + w - 0.01) / T);
        var r0 = Math.floor(y / T), r1 = Math.floor((y + h - 0.01) / T);
        for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) if (fn(c, r)) return { c: c, r: r };
        return null;
    }
    function hitsSolid(x, y, w, h) { return overlapTiles(x, y, w, h, function (c, r) { return solid(tileAt(c, r)); }); }

    function bumpBlock(c, r) {
        var v = tileAt(c, r);
        if (v === 'q') {
            grid[r * W + c] = 'u';
            for (var i = 0; i < blocks.length; i++) {
                var b = blocks[i];
                if (b.c === c && b.r === r) {
                    b.used = true; b.bump = 0.18;
                    popCoin(c, r);
                    checkpoint = { x: c * T, y: (r + 2) * T };
                    showLevelUp(b.section);
                }
            }
        } else if (v === 'b' || v === 'u') {
            // a used ! block shows its pop-up again every time it's bumped
            for (var j = 0; j < blocks.length; j++) if (blocks[j].c === c && blocks[j].r === r) { blocks[j].bump = 0.18; showLevelUp(blocks[j].section); }
            bricksBump.push({ c: c, r: r, t: 0.18 });
        }
    }
    var bricksBump = [], pops = [];
    function popCoin(c, r) { pops.push({ x: c * T, y: (r - 1) * T, t: 0.5 }); run.coins++; }

    function die() {
        player.hurt = 0.5;
        resetPlayer(checkpoint);
        player.hurt = 0.6;
    }

    function step(dt) {
        if (run.state === 'running' && !portalOpen) run.time += dt;
        if (portalOpen) return;

        var p = player;
        var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        if (run.state === 'clear') dir = 0;

        // horizontal
        if (dir !== 0) {
            p.vx += dir * ACC * dt;
            p.face = dir;
        } else {
            var f = FRICTION * dt * (p.onGround ? 1 : 0.4);
            if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= Math.sign(p.vx) * f;
        }
        if (p.vx > MAXRUN) p.vx = MAXRUN;
        if (p.vx < -MAXRUN) p.vx = -MAXRUN;

        // jump (buffered, with coyote time and variable height)
        jumpBuffer -= dt;
        p.coyote = p.onGround ? 0.09 : p.coyote - dt;
        if (jumpBuffer > 0 && p.coyote > 0 && run.state === 'running') {
            p.vy = -jumpPower; p.onGround = false; p.coyote = 0; jumpBuffer = 0;
        }
        if (!jumpHeld && p.vy < -120 && !jumpCut) { p.vy *= 0.45; jumpCut = true; }

        p.vy += G * dt;
        if (p.vy > MAXFALL) p.vy = MAXFALL;

        // move X
        p.x += p.vx * dt;
        if (p.x < 0) { p.x = 0; p.vx = 0; }
        var hx = hitsSolid(p.x, p.y, p.w, p.h);
        if (hx) {
            if (p.vx > 0) p.x = hx.c * T - p.w; else if (p.vx < 0) p.x = (hx.c + 1) * T;
            p.vx = 0;
        }

        // move Y
        p.y += p.vy * dt;
        p.onGround = false;
        if (p.vy >= 0) {
            var hd = hitsSolid(p.x, p.y, p.w, p.h);
            if (hd) { p.y = hd.r * T - p.h; p.vy = 0; p.onGround = true; jumpCut = false; }
        } else {
            // head bump: hit the tile closest to the player's center
            var r = Math.floor(p.y / T);
            var cc = Math.floor((p.x + p.w / 2) / T);
            var cands = [cc, Math.floor(p.x / T), Math.floor((p.x + p.w - 0.01) / T)];
            for (var i = 0; i < cands.length; i++) {
                if (solid(tileAt(cands[i], r))) {
                    p.y = (r + 1) * T; p.vy = 0;
                    bumpBlock(cands[i], r);
                    break;
                }
            }
        }

        // hazards
        if (p.y > H * T + 40) { die(); return; }
        if (overlapTiles(p.x + 2, p.y + p.h - 6, p.w - 4, 6, function (c, r) { return tileAt(c, r) === '^'; })) { die(); return; }

        // coins
        for (var k = 0; k < coins.length; k++) {
            var cn = coins[k];
            if (!cn.got && p.x < cn.x + 14 && p.x + p.w > cn.x + 4 && p.y < cn.y + 16 && p.y + p.h > cn.y + 2) { cn.got = true; run.coins++; }
        }

        // enemies
        for (var e = 0; e < enemies.length; e++) {
            var en = enemies[e];
            if (en.dead > 0) { en.dead -= dt; continue; }
            if (en.dead < 0) continue;
            if (Math.abs(en.x - p.x) > 26 * T) continue;     // sleep when far away
            en.vy = Math.min(en.vy + G * dt, MAXFALL);
            en.x += en.vx * dt;
            var front = en.vx < 0 ? en.x : en.x + en.w;
            var hitWall = hitsSolid(en.x, en.y, en.w, en.h);
            var noFloor = !solid(tileAt(Math.floor(front / T), Math.floor((en.y + en.h + 2) / T)));
            if (hitWall || noFloor) { en.x -= en.vx * dt; en.vx = -en.vx; }
            en.y += en.vy * dt;
            var hy = hitsSolid(en.x, en.y, en.w, en.h);
            if (hy) { en.y = hy.r * T - en.h; en.vy = 0; }

            if (p.x < en.x + en.w && p.x + p.w > en.x && p.y < en.y + en.h && p.y + p.h > en.y) {
                if (p.vy > 0 && p.y + p.h - en.y < 10) {
                    en.dead = 0.4; p.vy = -300; jumpCut = false;
                    setTimeout(function (x) { return function () { x.dead = -1; }; }(en), 400);
                } else if (p.hurt <= 0) { die(); return; }
            }
        }
        if (p.hurt > 0) p.hurt -= dt;

        // flag
        if (run.state === 'running' && p.x + p.w >= flagCol * T + 6) courseClear();

        // timers
        p.anim += dt;
        for (var b = 0; b < blocks.length; b++) if (blocks[b].bump > 0) blocks[b].bump -= dt;
        for (var q = bricksBump.length - 1; q >= 0; q--) { bricksBump[q].t -= dt; if (bricksBump[q].t <= 0) bricksBump.splice(q, 1); }
        for (var o = pops.length - 1; o >= 0; o--) { pops[o].t -= dt; pops[o].y -= 60 * dt; if (pops[o].t <= 0) pops.splice(o, 1); }
    }

    /* ---------------- Rendering ---------------- */
    var scale = 2, viewW = 400, viewH = 270, dpr = 1;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 3);
        var rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        // fit about 12 rows of tiles to the stage height (snapped to quarter steps)
        scale = Math.max(1, Math.floor((canvas.height / (12 * T)) * 4) / 4);
        viewW = canvas.width / scale;
        viewH = canvas.height / scale;
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);
    resize();

    function bumpOffset(c, r) {
        for (var i = 0; i < bricksBump.length; i++) if (bricksBump[i].c === c && bricksBump[i].r === r) return -Math.sin((bricksBump[i].t / 0.18) * Math.PI) * 5;
        for (var j = 0; j < blocks.length; j++) if (blocks[j].c === c && blocks[j].r === r && blocks[j].bump > 0) return -Math.sin((blocks[j].bump / 0.18) * Math.PI) * 5;
        return 0;
    }

    function groundTile(c, r) {
        var above = tileAt(c, r - 1) === '#';
        var L = tileAt(c - 1, r) === '#', R = tileAt(c + 1, r) === '#';
        if (!above) return !L && !R ? TILE.topS : !L ? TILE.topL : !R ? TILE.topR : TILE.topM;
        return !L && !R ? TILE.fillS : !L ? TILE.fillL : !R ? TILE.fillR : TILE.fillM;
    }

    function drawBackground(camY) {
        // sky
        ctx.fillStyle = '#dff6f5';
        ctx.fillRect(0, 0, viewW, viewH);
        // parallax hills/clouds band (background sheet: 8 cols x 24px), drawn at 2x
        var s = 48, par = camX * 0.35;
        var bandY = 12 * T - camY - s * 1.5;
        var cols = [8, 9, 10, 11];
        var start = Math.floor(par / s) - 1;
        for (var i = start; i < start + Math.ceil(viewW / s) + 3; i++) {
            var id = cols[((i % 4) + 4) % 4];
            var x = Math.round(i * s - par);
            ctx.drawImage(imgs.bg, (id % 8) * 24, Math.floor(id / 8) * 24, 24, 24, x, Math.round(bandY), s, s);
            ctx.drawImage(imgs.bg, (16 % 8) * 24, Math.floor(16 / 8) * 24, 24, 24, x, Math.round(bandY + s), s, s);
            ctx.drawImage(imgs.bg, (16 % 8) * 24, Math.floor(16 / 8) * 24, 24, 24, x, Math.round(bandY + 2 * s), s, s);
        }
    }

    function drawLabel(text, cx, y) {
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        var w = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(28, 47, 33, 0.88)';
        ctx.fillRect(Math.round(cx - w / 2 - 4), Math.round(y - 10), Math.round(w + 8), 13);
        ctx.fillStyle = '#ebcd32';
        ctx.fillText(text, Math.round(cx), Math.round(y));
    }

    function render() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        if (loaded < total) {
            ctx.fillStyle = '#dff6f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = false;

        // camera
        var target = player.x + player.w / 2 - viewW * 0.4;
        camX += (target - camX) * 0.18;
        camX = Math.max(0, Math.min(camX, W * T - viewW));
        if (W * T < viewW) camX = 0;
        var camY = H * T - viewH;            // bottom-anchored
        var cx = Math.round(camX), cy = Math.round(camY);

        drawBackground(cy);
        ctx.save();
        ctx.translate(-cx, -cy);

        var c0 = Math.max(0, Math.floor(cx / T) - 1), c1 = Math.min(W - 1, Math.ceil((cx + viewW) / T) + 1);

        // decor behind
        for (var d = 0; d < decor.length; d++) {
            var dc = decor[d];
            if (dc[1] >= c0 && dc[1] <= c1) drawTile(dc[0], dc[1] * T, dc[2] * T);
        }

        // flag
        var t = performance.now() / 1000;
        if (flagCol >= c0 && flagCol <= c1) {
            for (var fr = 5; fr <= 11; fr++) drawTile(TILE.pole, flagCol * T, fr * T);
            drawTile(Math.floor(t * 3) % 2 ? TILE.flagA : TILE.flagB, flagCol * T, 4 * T);
            drawLabel('GOAL', flagCol * T + 9, 4 * T - 4);
        }

        // tiles
        for (var r = 0; r < H; r++) {
            for (var c = c0; c <= c1; c++) {
                var v = grid[r * W + c];
                if (!v) continue;
                var x = c * T, y = r * T;
                if (v === '#') drawTile(groundTile(c, r), x, y);
                else if (v === 'b') drawTile(TILE.brick, x, y + bumpOffset(c, r));
                else if (v === 'q') drawTile(TILE.block, x, y + bumpOffset(c, r));
                else if (v === 'u') drawTile(TILE.used, x, y + bumpOffset(c, r));
                else if (v === 'p') drawTile(TILE.pipeCap, x, y);
                else if (v === '|') drawTile(TILE.pipe, x, y);
                else if (v === '^') drawTile(TILE.spikes, x, y);
            }
        }

        // block labels
        for (var bi = 0; bi < blocks.length; bi++) {
            var bl = blocks[bi];
            if (bl.c < c0 - 4 || bl.c > c1 + 4) continue;
            drawLabel((bl.used ? '✓ ' : '') + bl.section.label, bl.c * T + 9, (bl.r - 1) * T + 6);
        }

        // coins
        var coinFrame = Math.floor(t * 6) % 2 ? TILE.coinA : TILE.coinB;
        for (var k = 0; k < coins.length; k++) {
            var cn = coins[k];
            if (!cn.got && cn.x >= c0 * T - T && cn.x <= c1 * T) drawTile(coinFrame, cn.x, cn.y);
        }
        for (var o = 0; o < pops.length; o++) drawTile(coinFrame, pops[o].x, Math.round(pops[o].y));

        // enemies
        for (var e = 0; e < enemies.length; e++) {
            var en = enemies[e];
            if (en.dead < 0) continue;
            var ef = en.dead > 0 ? CHAR.walkerFlat : (Math.floor(t * 5) % 2 ? CHAR.walkerA : CHAR.walkerB);
            drawChar(ef, Math.round(en.x - 5), Math.round(en.y + en.h - 24), en.vx > 0);
        }

        // player (blinks after a respawn)
        var p = player;
        if (!(p.hurt > 0 && Math.floor(t * 20) % 2)) {
            var frame = !p.onGround ? CHAR.stepA : (Math.abs(p.vx) > 15 && Math.floor(p.anim * 9) % 2 ? CHAR.stepA : CHAR.standA);
            drawChar(frame, Math.round(p.x - 6), Math.round(p.y + p.h - 24), p.face < 0);
        }

        ctx.restore();
        drawConfetti();
    }

    /* ---------------- Confetti + "Congratulations!" at the flag ---------------- */
    var confetti = [], cheerT = 0;
    var CONFETTI_COLORS = ['#f88735', '#ebcd32', '#9fb737', '#59905a', '#fbf4e4'];
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function burst(n) {
        for (var i = 0; i < n; i++) {
            confetti.push({
                x: Math.random() * viewW,
                y: -10 - Math.random() * viewH * 0.4,
                vx: (Math.random() - 0.5) * 60,
                vy: 30 + Math.random() * 70,
                sway: Math.random() * Math.PI * 2,
                w: Math.random() < 0.5 ? 2 : 3,
                h: Math.random() < 0.5 ? 3 : 4,
                c: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
                life: 4 + Math.random() * 2
            });
        }
    }

    function celebrate() {
        cheerT = 5;
        if (reduceMotion) return;          // banner only, no falling confetti
        burst(160);
        setTimeout(function () { burst(90); }, 600);
        setTimeout(function () { burst(60); }, 1300);
    }

    function updateConfetti(dt) {
        if (cheerT > 0) cheerT -= dt;
        for (var i = confetti.length - 1; i >= 0; i--) {
            var c = confetti[i];
            c.sway += dt * 6;
            c.x += (c.vx + Math.sin(c.sway) * 25) * dt;
            c.y += c.vy * dt;
            c.vy = Math.min(c.vy + 60 * dt, 110);
            c.life -= dt;
            if (c.life <= 0 || c.y > viewH + 10) confetti.splice(i, 1);
        }
    }

    function drawConfetti() {
        for (var i = 0; i < confetti.length; i++) {
            var c = confetti[i];
            ctx.fillStyle = c.c;
            // flip between wide and tall to fake a tumbling piece of paper
            if (Math.sin(c.sway * 1.7) > 0) ctx.fillRect(Math.round(c.x), Math.round(c.y), c.w, c.h);
            else ctx.fillRect(Math.round(c.x), Math.round(c.y), c.h, c.w);
        }
        if (cheerT > 0) {
            var text = 'CONGRATULATIONS!';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var y = Math.round(viewH * 0.16) + (Math.floor(cheerT * 4) % 2 ? 0 : 1);
            var w = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(28, 47, 33, 0.9)';
            ctx.fillRect(Math.round(viewW / 2 - w / 2 - 8), y - 11, Math.round(w + 16), 22);
            ctx.fillStyle = '#ebcd32';
            ctx.fillText(text, Math.round(viewW / 2), y + 1);
        }
    }

    /* ---------------- Loop ---------------- */
    var last = performance.now(), acc = 0, STEP = 1 / 120;
    function frame(now) {
        var dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        acc += dt;
        while (acc >= STEP) { step(STEP); acc -= STEP; }
        updateConfetti(dt);
        render();
        updateHud(false);
        requestAnimationFrame(frame);
    }

    // read-only hook for automated play-testing
    window.__portfolioRun = function () { return { x: player.x, y: player.y, vx: player.vx, vy: player.vy, onGround: player.onGround, state: run.state }; };

    newRun();
    if (document.fonts && document.fonts.load) document.fonts.load('8px "Press Start 2P"');
    requestAnimationFrame(frame);
})();
