/* Screens: map -> getting ready -> mission. Needs engine.js (GODS, newBattle, act, useFavor, estimate, KIND). */
(function () {
    var $ = function (id) { return document.getElementById(id); };
    var won = [];
    try { won = JSON.parse(localStorage.getItem('mythos_won') || '[]'); } catch (e) {}
    function save() { try { localStorage.setItem('mythos_won', JSON.stringify(won)); } catch (e) {} }

    var cur = 0, favorEarned = false, battle = null, lock = false, travelTimer = null;
    var short = function (g) { return g.name.split(':')[0]; };
    var stars = function (n) { return new Array(n + 1).join('★') + new Array(6 - n).join('☆'); };
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

    function show(id) {
        ['s-map', 's-prep', 's-mission'].forEach(function (s) { $(s).classList.toggle('show', s === id); });
        window.scrollTo(0, 0);
    }

    /* ---------- travelling between places ---------- */
    function travel(text, cb) {
        var t = $('travel');
        t.innerHTML = '<div class="t-card"><div class="t-text">' + esc(text) + '</div><div class="t-road"><div class="t-walker">🚶</div></div><small>click to skip</small></div>';
        t.classList.remove('gone');
        var done = false;
        function go() { if (done) return; done = true; clearTimeout(travelTimer); t.classList.add('gone'); cb(); }
        t.onclick = go;
        travelTimer = setTimeout(go, 1300);
    }

    /* ---------- map ---------- */
    var GODS_N = GODS.length, MORT_N = MORTALS.length;
    function isWon(i) { return won.indexOf(i) >= 0; }
    function countWon(from, n) { var c = 0; for (var i = from; i < from + n; i++) if (isWon(i)) c++; return c; }
    function godsDone() { return countWon(0, GODS_N) === GODS_N; }          /* Myth Codex Level 1 complete */
    function mortalsDone() { return countWon(GODS_N, MORT_N) === MORT_N; }  /* Myth Codex Final Level unlocked */

    function cardHtml(g, i, locked) {
        var w = isWon(i);
        if (locked) {
            return '<button class="card locked" disabled style="--c:' + g.col + '"><div class="em">🔒</div><b>' + esc(short(g)) + '</b><span>Locked</span></button>';
        }
        return '<button class="card' + (w ? ' won' : '') + '" data-i="' + i + '" style="--c:' + g.col + '">' +
            (w ? '<div class="seal">★</div>' : '') +
            '<div class="em">' + g.hero + '</div><b>' + esc(short(g)) + '</b><span>' + esc(g.mission) + '</span>' +
            '<span>📍 ' + esc(g.place) + '</span><div class="stars" title="Difficulty">' + stars(g.stars || g.diff) + '</div></button>';
    }
    function entryHtml(g, unlocked) {
        return '<div class="entry' + (unlocked ? '' : ' locked') + '" style="--c:' + g.col + '">' +
            (unlocked ? '<b>' + esc(g.name) + '</b><small>' + esc(g.epi) + '</small>' : '<b>???</b><small>Complete this mission to unlock.</small>') + '</div>';
    }
    function renderMap() {
        var gd = godsDone(), md = mortalsDone(), gc = countWon(0, GODS_N), mc = countWon(GODS_N, MORT_N);
        $('count').textContent = gc; $('mcount').textContent = mc;
        $('cards').innerHTML = GODS.map(function (g, i) { return cardHtml(g, i, false); }).join('');

        $('mortal-lock').innerHTML = md
            ? '<div class="unlocked">🌟 All ' + MORT_N + ' mortal quests complete! The Myth Codex Final Level is unlocked below.</div>'
            : gd
            ? '<div class="unlocked">🔓 Mortal Quests are open: ' + mc + ' of ' + MORT_N + ' completed. Finish them all to unlock the Myth Codex final level.</div>'
            : '<div class="lockbar">🔒 Mortal Quests unlock when Myth Codex Level 1 is complete: finish all ' + GODS_N + ' god missions (' + gc + '/' + GODS_N + ' so far).</div>';
        $('mcards').innerHTML = MORTALS.map(function (g, k) { return cardHtml(g, GODS_N + k, !gd); }).join('');

        $('codex-n').textContent = gc;
        $('codex-l1').textContent = gd ? '✔ complete' : gc + '/' + GODS_N;
        $('codex-list').innerHTML = GODS.map(function (g, i) { return entryHtml(g, isWon(i)); }).join('');

        $('codex-final-state').textContent = md ? 'unlocked' : 'locked';
        $('codex-final').innerHTML = md
            ? '<p class="cx-note">Every myth of the gods and the mortals, together at last.</p>' +
              '<div class="cx-head">⚡ The Gods</div>' + GODS.map(function (g) { return entryHtml(g, true); }).join('') +
              '<div class="cx-head">🧑 The Mortals</div>' + MORTALS.map(function (g) { return entryHtml(g, true); }).join('')
            : '<p class="cx-note">🔒 Complete all ' + MORT_N + ' mortal quests (' + mc + '/' + MORT_N + ' so far) to unlock the final level. It holds every myth of the gods and the mortals.</p>';
    }
    function onCard(e) {
        var b = e.target.closest('.card'); if (!b || b.disabled) return;
        var i = +b.dataset.i;
        travel('Travelling to ' + ALL[i].place + '...', function () { cur = i; favorEarned = false; renderPrep(); show('s-prep'); });
    }
    $('cards').addEventListener('click', onCard);
    $('mcards').addEventListener('click', onCard);

    /* ---------- "getting ready for the mission" ---------- */
    function renderPrep() {
        var g = ALL[cur];
        var opts = shuffle([{ t: g.right, ok: true }, { t: g.wq[0] }, { t: g.wq[1] }]);
        $('s-prep').style.setProperty('--c', g.col);
        $('s-prep').innerHTML =
            '<button class="back" id="p-back">← Back to the map</button>' +
            '<div class="p-head"><div class="em">' + g.hero + '</div><div><div class="stage">' + (g.mortal ? 'Mortal quest: getting ready' : 'Getting ready for the mission') + '</div><h2>' + esc(g.name) + '</h2>' +
            '<small>📍 ' + esc(g.place) + ' · Mission: ' + esc(g.mission) + ' · ' + stars(g.stars || g.diff) + '</small></div></div>' +
            '<div class="panel"><h3>📜 Read the passage</h3><p>' + esc(g.lore) + '</p><p>' + esc(g.boss) + '</p></div>' +
            '<div class="panel scout"><h3>🔭 Scout\'s report</h3><p>' + esc(g.hint) + '</p></div>' +
            '<div class="panel"><h3>❓ Answer for Divine Favor</h3><p><strong>' + esc(g.q) + '</strong></p>' +
            '<p style="font-size:.85rem;opacity:.8">A correct answer earns a one-time boost you can use at any moment in the fight: heal 40, refill Stamina and Focus, and double your next 2 strikes.</p>' +
            '<div id="p-opts">' + opts.map(function (o, k) { return '<button class="opt" data-k="' + k + '">' + esc(o.t) + '</button>'; }).join('') + '</div>' +
            '<div id="p-fb"></div></div><div id="p-go"></div>';
        $('p-back').onclick = function () { renderMap(); show('s-map'); };
        $('p-opts').onclick = function (e) {
            var b = e.target.closest('.opt'); if (!b || b.disabled) return;
            var o = opts[+b.dataset.k];
            [].forEach.call($('p-opts').children, function (x, k) {
                x.disabled = true; if (opts[k].ok) x.classList.add('right'); else if (x === b) x.classList.add('wrong');
            });
            favorEarned = !!o.ok;
            $('p-fb').innerHTML = o.ok
                ? '<div class="fb ok">' + esc(g.ok) + ' ✨ Divine Favor earned! You can use it once during the mission.</div>'
                : '<div class="fb no">✖ Not quite: the answer was "' + esc(g.right) + '". No Divine Favor this time, so the mission will be much harder.</div>';
            $('p-go').innerHTML = '<button class="big-btn go" id="p-start">⚔️ MISSION TIME!</button>';
            $('p-start').onclick = function () { travel('Marching to ' + g.place + '...', startMission); };
            $('p-go').scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
    }

    /* ---------- the mission itself ---------- */
    function startMission() {
        var g = ALL[cur];
        battle = newBattle(g, favorEarned); lock = false;
        var sc = $('s-mission'); sc.style.setProperty('--c', g.col);
        sc.innerHTML =
            '<div class="ms-top"><button class="back" id="m-flee" style="margin:0">🏃 Flee to the map</button><h2>' + esc(g.mission) + '</h2></div>' +
            '<div class="wrap"><div class="arena" id="arena"><div class="scenery">' + g.scenery + '</div>' +
            '<div class="side"><div class="nm">' + esc(short(g)) + ' (you)</div><div class="sprite" id="hero">' + g.hero + '</div>' +
            '<div class="bar"><i id="php"></i></div><div class="num" id="phptxt"></div>' +
            '<div class="pips sta" id="sta" title="Stamina: Guard and Dodge cost 1, +1 each turn">Stamina <span id="stap"></span></div>' +
            '<div class="pips foc" id="foc" title="Focus: 3 powers your special move">Focus <span id="focp"></span></div></div>' +
            '<div class="side foe-col"><div class="nm">' + esc(g.enemy.n) + '</div><div class="sprite foe" id="foe">' + g.enemy.e + '</div>' +
            '<div class="bar e"><i id="ehp"></i></div><div class="num" id="ehptxt"></div><div class="chips" id="chips"></div></div></div>' +
            '<div id="endbox"></div></div>' +
            '<div class="intent" id="intent"></div><div class="log" id="log"></div>' +
            '<div class="acts" id="acts">' +
            '<button class="act strike" data-a="strike"><span class="key">1</span><b>⚔️ ' + esc(g.strike) + '</b><small>13-19 damage · +1 Focus</small></button>' +
            '<button class="act guard" data-a="guard"><span class="key">2</span><b>🛡️ ' + esc(g.guard) + '</b><small>Costs 1 Stamina · cuts Heavy blows by 75%, Quick by 50%</small></button>' +
            '<button class="act dodge" data-a="dodge"><span class="key">3</span><b>💨 ' + esc(g.dodge) + '</b><small>Costs 1 Stamina · avoids Quick attacks, halves Magic</small></button>' +
            '<button class="act sig" data-a="sig"><span class="key">4</span><b>' + g.sig.i + ' ' + esc(g.sig.n) + '</b><small>Needs 3 Focus · ' + esc(g.sig.d) + '</small></button>' +
            (favorEarned
                ? '<button class="act favor" data-a="favor"><span class="key">F</span><b>✨ Divine Favor (once)</b><small>Free action: heal 40, refill Stamina and Focus, next 2 strikes double</small></button>'
                : '<button class="act favor used" disabled><b>🔒 No Divine Favor</b><small>You missed the question in the preparation screen.</small></button>') +
            '</div>';
        $('m-flee').onclick = function () { renderMap(); show('s-map'); };
        $('acts').onclick = function (e) { var b = e.target.closest('.act'); if (b && !b.disabled) doAct(b.dataset.a); };
        $('log').innerHTML = '<div class="new">The mission begins: ' + esc(g.mission) + '. Read the enemy\'s intent each turn!</div>';
        renderBattle(); show('s-mission');
    }

    function pips(n, max) { var s = ''; for (var i = 0; i < max; i++) s += '<b class="' + (i < n ? 'on' : '') + '"></b>'; return s; }
    function renderBattle() {
        var b = battle, g = b.g;
        $('php').style.width = (100 * b.php / b.pmax) + '%'; $('phptxt').textContent = b.php + ' / ' + b.pmax + ' HP';
        $('ehp').style.width = (100 * b.ehp / b.emax) + '%'; $('ehptxt').textContent = b.ehp + ' / ' + b.emax + ' HP';
        $('stap').innerHTML = pips(b.sta, 3); $('focp').innerHTML = pips(b.foc, 3);
        var c = [];
        if (b.heads) c.push('🐲 +' + b.heads + ' heads'); if (b.stun > 0) c.push('💫 Stunned ' + b.stun); if (b.burn.t > 0) c.push('🔥 ' + g.sig.n + ' ' + b.burn.t);
        if (b.weak.t > 0) c.push('⬇️ Weakened ' + b.weak.t); if (b.vuln > 0) c.push('🎯 Exposed ' + b.vuln); if (b.lit > 0) c.push('💡 Lit ' + b.lit);
        if (b.ward > 0) c.push('🛡️ Ward ' + b.ward); if (b.reflect) c.push('🪞 Mirror'); if (b.thorns > 0) c.push('🌿 Thorns ' + b.thorns); if (b.rage > 0) c.push('💢 Double x' + b.rage);
        if (g.enemy.passive === 'dark' && !(b.lit > 0)) c.push('🌑 Dark');
        if (g.enemy.passive === 'armor' && !(b.vuln > 0)) c.push('🛡️ Armored');
        if (g.enemy.passive === 'enrage' && b.ehp < b.emax * 0.4) c.push('😡 Enraged');
        $('chips').innerHTML = c.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('');

        var m = b.intent, k = KIND[m.kind], box = $('intent');
        if (b.over) { box.className = 'intent'; box.innerHTML = ''; }
        else if (b.hidden) {
            box.className = 'intent k-HIDDEN';
            box.innerHTML = '<div class="lab">👁️ ENEMY INTENT</div><b>❓ Hidden</b><em>' + esc(g.enemy.n) + ' hides its next move. Trust your instincts!</em>';
        } else {
            box.className = 'intent k-' + m.kind;
            box.innerHTML = '<div class="lab">👁️ ENEMY INTENT</div><b>' + k.i + ' ' + esc(m.n) + '</b><em>' + k.l +
                (m.kind === 'CHARGE' ? '' : ' · about ' + estimate(b) + ' damage') + '</em><small>💡 ' + esc(k.tip) + '</small>';
        }
        var acts = $('acts').children;
        [].forEach.call(acts, function (x) {
            var a = x.dataset.a, off = !!b.over || (a === 'guard' || a === 'dodge') && b.sta < 1 || a === 'sig' && b.foc < 3;
            if (a === 'favor') off = !!b.over || b.used;
            if (a) x.disabled = off; if (a === 'favor' && b.used) x.classList.add('used');
        });
    }

    function popup(side, type, v) {
        var arena = $('arena'), el = document.createElement('div');
        el.className = 'float ' + (type === 'dmg' ? 'dmg' : type === 'heal' ? 'heal' : type === 'block' ? 'blk' : 'miss');
        el.textContent = type === 'dmg' ? '-' + v : type === 'heal' ? '+' + v : type === 'block' ? 'BLOCKED!' : 'MISS';
        el.style.left = (side === 'e' ? 66 : 20) + '%'; el.style.top = '30%';
        arena.appendChild(el); setTimeout(function () { el.remove(); }, 1000);
        if (type === 'dmg') {
            var sp = $(side === 'e' ? 'foe' : 'hero'); sp.classList.remove('hit'); void sp.offsetWidth; sp.classList.add('hit');
        }
    }
    function playEvents(res) {
        res.ev.forEach(function (x, n) { setTimeout(function () { popup(x.side, x.type, x.v); }, n * 220); });
        var log = $('log');
        [].forEach.call(log.querySelectorAll('.new'), function (x) { x.classList.remove('new'); });
        res.log.forEach(function (t) { var d = document.createElement('div'); d.className = 'new'; d.textContent = t; log.appendChild(d); });
        log.scrollTop = log.scrollHeight;
    }

    function doAct(a) {
        if (!battle || lock || battle.over) return;
        var res = a === 'favor' ? useFavor(battle) : act(battle, a);
        if (!res) return;
        if (res.invalid) { playEvents(res); return; }
        lock = true; setTimeout(function () { lock = false; }, 300);
        var sp = $('hero'); if (a === 'strike' || a === 'sig') { sp.classList.remove('slam'); void sp.offsetWidth; sp.classList.add('slam'); }
        playEvents(res); renderBattle();
        if (battle.over) setTimeout(endMission, 900);
    }

    function endMission() {
        var b = battle, g = b.g, w = b.over === 'win', i = ALL.indexOf(g);
        $(w ? 'foe' : 'hero').classList.add('dead');
        var gd0 = godsDone(), md0 = mortalsDone();
        if (w && won.indexOf(i) < 0) { won.push(i); save(); }
        var unlock = '';
        if (w && !gd0 && godsDone()) unlock = '<div class="unlock-note">🔓 Myth Codex Level 1 complete! The Mortal Quests are now open on the map.</div>';
        if (w && !md0 && mortalsDone()) unlock = '<div class="unlock-note">📖 Every mortal quest is done! The Myth Codex Final Level is unlocked.</div>';
        $('endbox').innerHTML = '<div class="end ' + (w ? 'win' : 'lose') + '"><div class="card-box">' +
            (w ? '<h2>🏆 Victory!</h2><p>' + esc(g.win) + '</p><div class="epi">' + esc(g.epi) + '</div>' + unlock
               : '<h2>☠ Defeated</h2><p>' + esc(g.enemy.n) + ' was too strong this time. Study its pattern: what counters each kind of attack?</p>') +
            (w ? '' : '<button class="big-btn" id="e-retry">🔄 Retry the mission' + (favorEarned ? ' (Divine Favor restored)' : '') + '</button>') +
            '<button class="big-btn" id="e-map">🗺️ Back to the map</button></div></div>';
        if (!w) $('e-retry').onclick = startMission;
        $('e-map').onclick = function () { renderMap(); show('s-map'); };
    }

    document.addEventListener('keydown', function (e) {
        if (!$('s-mission').classList.contains('show')) return;
        var m = { '1': 'strike', '2': 'guard', '3': 'dodge', '4': 'sig', 'f': 'favor', 'F': 'favor' }[e.key];
        if (m) { var btn = document.querySelector('.act[data-a="' + m + '"]'); if (btn && !btn.disabled) doAct(m); }
    });

    $('enter').onclick = function () { $('intro').classList.add('gone'); };
    renderMap();
    window.__mythos = { GODS: GODS, ALL: ALL, setWon: function (a) { won = a; renderMap(); }, get battle() { return battle; }, doAct: doAct, won: function () { return won; } };
})();
