/* Turn-based battle engine: no DOM, so it can be simulated in Node. */
var KIND = {
    QUICK:  { i: '⚡', l: 'Quick Strike', tip: 'DODGE avoids it completely. GUARD halves it.' },
    HEAVY:  { i: '💥', l: 'Heavy Blow',   tip: 'GUARD cuts it by 75%. Dodging does not help.' },
    MAGIC:  { i: '🌀', l: 'Dark Magic',   tip: 'GUARD does nothing. DODGE halves it. Wards and mirrors stop it.' },
    CHARGE: { i: '🔥', l: 'Charging Up',  tip: 'No attack this turn, but a huge blow follows. STRIKE now for 1.5x damage!' }
};

var GODS = MISSIONS.map(function (m, i) { return Object.assign({}, GODS_TEXT[i], m); });
var MORTALS = MORTAL_MISSIONS.map(function (m, i) { return Object.assign({}, MORTAL_TEXT[i], m, { mortal: true }); });
/* Everything playable: gods first (indices 0-13), then mortals (14-31). Saved progress uses these indices. */
var ALL = GODS.concat(MORTALS);

function rint(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }

function pickMove(b, r) {
    if (b.forced) { var f = b.forced; b.forced = null; return f; }
    var ms = b.g.moves, tot = 0, i;
    for (i = 0; i < ms.length; i++) tot += ms[i].w || 1;
    var x = r() * tot;
    for (i = 0; i < ms.length; i++) { x -= ms[i].w || 1; if (x <= 0) return ms[i]; }
    return ms[0];
}
function nextIntent(b, r) {
    b.intent = pickMove(b, r);
    b.hidden = r() < (b.g.diff - 1) * 0.07;
}

function newBattle(g, favorEarned, r) {
    r = r || Math.random;
    var b = {
        g: g, php: 100, pmax: 100, ehp: g.enemy.hp, emax: g.enemy.hp,
        sta: 3, foc: 1, scale: (0.85 + 0.07 * g.diff) * (g.tune || 1), turn: 1,
        stun: 0, burn: { t: 0, d: 0 }, weak: { t: 0, m: 1 }, vuln: 0, rage: 0, ward: 0,
        reflect: false, thorns: 0, lit: 0, heads: 0,
        favor: !!favorEarned, used: false, forced: null, over: null, hidden: false, intent: null
    };
    nextIntent(b, r);
    return b;
}

/* The one-time Divine Favor boost, usable at any moment and free (takes no turn). */
function useFavor(b) {
    if (!b.favor || b.used || b.over) return null;
    b.used = true;
    var heal = Math.min(40, b.pmax - b.php);
    b.php += heal; b.sta = 3; b.foc = 3; b.rage = Math.max(b.rage, 2);
    return { log: ['✨ Divine Favor! You heal ' + heal + ', refill Stamina and Focus, and your next 2 strikes deal double.'],
             ev: [{ side: 'p', type: 'heal', v: heal }] };
}

function act(b, a, r) {
    r = r || Math.random;
    var g = b.g, e = g.enemy, L = [], V = [];
    if (b.over) return { log: L, ev: V };
    if ((a === 'guard' || a === 'dodge') && b.sta < 1) return { log: ['Not enough Stamina!'], ev: V, invalid: true };
    if (a === 'sig' && b.foc < 3) return { log: ['You need 3 Focus for ' + g.sig.n + '.'], ev: V, invalid: true };

    var wasCharge = b.intent.kind === 'CHARGE';

    /* ---- player action ---- */
    if (a === 'strike') {
        var d = rint(r, 13, 19);
        if (b.rage > 0) { d *= 2; b.rage--; }
        if (b.vuln > 0) d *= 1.5;
        if (e.passive === 'armor' && !(b.vuln > 0)) d *= 0.5;
        if (wasCharge && b.stun <= 0) d *= 1.5;
        d = Math.round(d);
        if (e.passive === 'dark' && !(b.lit > 0) && r() < 0.4) {
            d = 0; L.push('Your ' + g.strike + ' misses in the darkness!'); V.push({ side: 'e', type: 'miss' });
        } else {
            b.ehp -= d; L.push('You ' + g.strike + ' for ' + d + '.'); V.push({ side: 'e', type: 'dmg', v: d });
            if (e.passive === 'regrow' && !(b.burn.t > 0)) {
                b.heads = Math.min(5, b.heads + 1);
                L.push('Heads grow back from the wound! (' + b.heads + ' extra heads)');
            }
        }
        b.foc = Math.min(3, b.foc + 1);
    } else if (a === 'sig') {
        b.foc -= 3; L.push('You unleash ' + g.sig.n + '!');
        g.sig.fx.forEach(function (f) {
            switch (f[0]) {
                case 'dmg': b.ehp -= f[1]; V.push({ side: 'e', type: 'dmg', v: f[1] }); break;
                case 'dot': b.burn = { t: f[2], d: f[1] }; b.heads = 0; break;
                case 'stun': b.stun = f[1]; break;
                case 'reflect': b.reflect = true; break;
                case 'weak': b.weak = { t: f[2], m: f[1] }; break;
                case 'heal': { var h = Math.min(f[1], b.pmax - b.php); b.php += h; V.push({ side: 'p', type: 'heal', v: h }); break; }
                case 'ward': b.ward = f[1]; break;
                case 'rage': b.rage = f[1]; break;
                case 'vuln': b.vuln = f[1]; break;
                case 'thorns': b.thorns = f[1]; break;
                case 'lit': b.lit = f[1]; break;
            }
        });
    } else if (a === 'guard') {
        L.push('You brace with ' + g.guard + '.');
    } else if (a === 'dodge') {
        L.push('You ready ' + g.dodge + '.');
    }

    if (b.ehp <= 0) { b.ehp = 0; b.over = 'win'; return { log: L, ev: V }; }

    function riposte() {
        var rp = 8; if (e.passive === 'armor' && !(b.vuln > 0)) rp = 4;
        b.ehp -= rp; L.push('Your counter-attack hits for ' + rp + '.'); V.push({ side: 'e', type: 'dmg', v: rp });
    }

    /* ---- enemy turn ---- */
    var m = b.intent, stunnedNow = false;
    if (b.stun > 0) {
        b.stun--; stunnedNow = true;
        L.push(e.n + ' is stunned and loses its turn!');
    } else if (m.kind === 'CHARGE') {
        L.push(e.n + ' gathers terrible power: ' + m.n + '...');
        b.forced = m.then;
    } else {
        var raw = m.dmg * b.scale + b.heads * 3;
        if (e.passive === 'enrage' && b.ehp < b.emax * 0.4) raw *= 1.35;
        if (b.weak.t > 0) raw *= b.weak.m;
        var mult = 1;
        if (a === 'guard') mult = m.kind === 'HEAVY' ? 0.25 : (m.kind === 'QUICK' ? 0.5 : 1);
        if (a === 'dodge') mult = m.kind === 'QUICK' ? 0 : (m.kind === 'MAGIC' ? 0.5 : 1);
        var dmg = Math.round(raw * mult);

        if (b.reflect) {
            b.reflect = false;
            var rd = Math.round(raw * 1.3); b.ehp -= rd;
            L.push('The mirror throws ' + m.n + ' back for ' + rd + '!'); V.push({ side: 'e', type: 'dmg', v: rd });
            dmg = 0;
        } else if (b.ward > 0) {
            b.ward--; dmg = 0; L.push('Your ward absorbs ' + m.n + '!'); V.push({ side: 'p', type: 'block' });
        } else if (mult === 0) {
            L.push('You dodge ' + m.n + ' completely and counter!'); V.push({ side: 'p', type: 'block' });
            b.foc = Math.min(3, b.foc + 1); riposte();
        } else {
            if (a === 'guard' && m.kind === 'HEAVY') { b.foc = Math.min(3, b.foc + 1); riposte(); }
            L.push(m.n + (mult < 1 ? ' is reduced and hits you for ' : ' hits you for ') + dmg + '.');
        }
        if (dmg > 0) {
            b.php -= dmg; V.push({ side: 'p', type: 'dmg', v: dmg });
            if (b.thorns > 0) { b.ehp -= 12; L.push('Thorns tear into ' + e.n + ' for 12!'); V.push({ side: 'e', type: 'dmg', v: 12 }); }
        }
    }

    /* ---- end of turn ---- */
    if (b.ehp > 0 && b.burn.t > 0) {
        b.ehp -= b.burn.d; b.burn.t--;
        L.push(g.sig.n + ' still hurts ' + e.n + ' for ' + b.burn.d + '.'); V.push({ side: 'e', type: 'dmg', v: b.burn.d });
    }
    if (e.passive === 'heal' && b.turn % 2 === 0 && b.ehp > 0 && b.ehp < b.emax && !(b.burn.t > 0) && !stunnedNow) {
        b.ehp = Math.min(b.emax, b.ehp + 8); L.push(e.n + ' patches itself up (+8).'); V.push({ side: 'e', type: 'heal', v: 8 });
    }
    if (b.weak.t > 0) b.weak.t--;
    if (b.vuln > 0) b.vuln--;
    if (b.lit > 0) b.lit--;
    if (b.thorns > 0) b.thorns--;
    b.sta = Math.min(3, b.sta + 1);
    b.turn++;

    if (b.ehp <= 0) { b.ehp = 0; b.over = 'win'; }
    else if (b.php <= 0) { b.php = 0; b.over = 'lose'; }
    else if (!stunnedNow) nextIntent(b, r);
    return { log: L, ev: V };
}

if (typeof module !== 'undefined') module.exports = { GODS: GODS, newBattle: newBattle, act: act, useFavor: useFavor, KIND: KIND };

/* Damage the enemy's current intent would do this turn if you take no counter-action (shown in the UI). */
function estimate(b) {
    var m = b.intent; if (m.kind === 'CHARGE') return 0;
    var raw = m.dmg * b.scale + b.heads * 3;
    if (b.g.enemy.passive === 'enrage' && b.ehp < b.emax * 0.4) raw *= 1.35;
    if (b.weak.t > 0) raw *= b.weak.m;
    return Math.round(raw);
}
if (typeof module !== 'undefined') module.exports.estimate = estimate;
