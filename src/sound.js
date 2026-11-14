/* Synthesized sound effects and background music (WebAudio). No audio files, so it works offline. */
var SFX = (function () {
    var ctx = null, master = null, musBus = null, noiseBuf = null;
    var sfxOn = true, musOn = true, mood = 'calm', timer = null, step = 0;
    try { sfxOn = localStorage.getItem('mythos_sfx') !== '0'; musOn = localStorage.getItem('mythos_mus') !== '0'; } catch (e) {}

    function init() {
        if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
        musBus = ctx.createGain(); musBus.gain.value = 0.35; musBus.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        if (musOn) startMusic();
    }

    function tone(f, dur, type, vol, to, delay, bus) {
        if (!ctx) return;
        var t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
        if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(bus || master); o.start(t); o.stop(t + dur + 0.05);
    }
    function noise(dur, vol, ftype, f0, f1, delay) {
        if (!ctx) return;
        var t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = noiseBuf; fl.type = ftype || 'bandpass'; fl.frequency.setValueAtTime(f0 || 1000, t);
        if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
    }
    function arp(notes, gap, type, vol, len) { notes.forEach(function (f, k) { tone(f, len || 0.3, type || 'triangle', vol || 0.16, null, k * gap); }); }

    var FX = {
        click:  function () { tone(660, 0.07, 'triangle', 0.12); },
        strike: function () { noise(0.14, 0.45, 'bandpass', 2200, 500); tone(190, 0.16, 'sawtooth', 0.22, 70); },
        hit:    function () { tone(150, 0.2, 'square', 0.2, 55); noise(0.09, 0.3, 'highpass', 1500); },
        hurt:   function () { tone(95, 0.32, 'sawtooth', 0.3, 40); noise(0.18, 0.3, 'lowpass', 900, 200); },
        guard:  function () { tone(520, 0.3, 'square', 0.1, 400); tone(1040, 0.25, 'triangle', 0.1); noise(0.05, 0.2, 'highpass', 4000); },
        dodge:  function () { noise(0.3, 0.4, 'bandpass', 400, 2600); },
        block:  function () { tone(700, 0.22, 'triangle', 0.14, 500); },
        miss:   function () { tone(320, 0.18, 'sine', 0.1, 140); },
        heal:   function () { arp([523, 659, 784], 0.07, 'triangle', 0.13, 0.25); },
        sig:    function () { tone(220, 0.55, 'sawtooth', 0.18, 900); arp([440, 554, 659, 880], 0.08, 'triangle', 0.15, 0.5); noise(0.4, 0.25, 'bandpass', 600, 3000); },
        favor:  function () { arp([392, 523, 659, 784, 1047, 1319], 0.07, 'sine', 0.16, 0.5); },
        charge: function () { tone(110, 0.6, 'sawtooth', 0.14, 260); },
        bless:  function () { arp([784, 988, 1175, 1568], 0.09, 'sine', 0.15, 0.45); },
        travel: function () { noise(0.5, 0.12, 'lowpass', 700, 300); },
        win:    function () { arp([392, 494, 587, 784, 988], 0.13, 'triangle', 0.2, 0.5); tone(196, 1.0, 'sine', 0.12, null, 0.1); },
        lose:   function () { arp([330, 277, 220, 165], 0.22, 'sawtooth', 0.17, 0.5); }
    };

    /* ---- background music: slow ambient notes on a Phrygian-flavoured scale, with a heartbeat drum in battle ---- */
    var SCALE = [146.83, 155.56, 174.61, 196.0, 220.0, 233.08, 261.63, 293.66];
    var MELODY = [0, -1, 3, -1, 4, -1, 2, 1, -1, 3, -1, 5, 4, -1, 2, -1, 0, -1, 1, -1, 2, 3, -1, 4, 6, -1, 5, -1, 3, 2, 1, -1];
    function tick() {
        if (!ctx || !musOn) return;
        var n = MELODY[step % MELODY.length], battle = mood === 'battle';
        if (n >= 0) tone(SCALE[n] * (battle ? 1 : 2), battle ? 0.35 : 0.9, battle ? 'sawtooth' : 'triangle', battle ? 0.05 : 0.09, null, 0, musBus);
        if (step % 16 === 0) { tone(73.42, 3.2, 'sine', 0.16, null, 0, musBus); tone(110, 3.2, 'sine', 0.08, null, 0, musBus); }
        if (battle && step % 2 === 0) tone(80, 0.18, 'sine', 0.35, 45, 0, musBus);
        step++;
    }
    function startMusic() { if (!ctx || timer) return; step = 0; tick(); timer = setInterval(tick, mood === 'battle' ? 300 : 620); }
    function stopMusic() { if (timer) { clearInterval(timer); timer = null; } }

    document.addEventListener('visibilitychange', function () {
        if (!ctx) return;
        if (document.hidden) ctx.suspend(); else ctx.resume();
    });

    return {
        init: init,
        play: function (name) { if (sfxOn && ctx && FX[name]) FX[name](); },
        mood: function (m) { if (m === mood) return; mood = m; if (timer) { stopMusic(); if (musOn) startMusic(); } },
        isSfx: function () { return sfxOn; },
        isMusic: function () { return musOn; },
        setSfx: function (on) { sfxOn = !!on; try { localStorage.setItem('mythos_sfx', on ? '1' : '0'); } catch (e) {} if (on) { init(); FX.click(); } },
        setMusic: function (on) { musOn = !!on; try { localStorage.setItem('mythos_mus', on ? '1' : '0'); } catch (e) {} if (on) { init(); startMusic(); } else stopMusic(); }
    };
})();
