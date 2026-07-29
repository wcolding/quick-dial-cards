(function () {
    var $ = function (s) { return document.querySelector(s) }, $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)) };
    var cards = $$('section.card');
    var store = { get: function (k) { try { return localStorage.getItem(k) } catch (e) { return null } }, set: function (k, v) { try { localStorage.setItem(k, v) } catch (e) { } } };

    /* home: brand grid */
    var brands = {};
    cards.forEach(function (c) { var b = c.dataset.brand; (brands[b] = brands[b] || []).push(c) });
    var bx = $('#brands');
    Object.keys(brands).forEach(function (b) {
        var n = brands[b].length, btn = document.createElement('button');
        btn.innerHTML = '<span>' + b + '</span><span class="n">' + n + ' system' + (n > 1 ? 's' : '') + '</span>';
        btn.onclick = function () { n === 1 ? go(brands[b][0].id) : showModels(b); };
        bx.appendChild(btn);
    });
    function modelBtn(c) {
        var btn = document.createElement('button'); btn.className = 'modelbtn';
        btn.innerHTML = '<span><span class="mb-b">' + c.dataset.model + '</span><small>' + c.dataset.brand + '</small></span><span class="tag ' + c.dataset.badgecls + '">' + c.dataset.badgetxt + '</span>';
        btn.onclick = function () { go(c.id) }; return btn;
    }
    function showModels(b) {
        var m = $('#models'); m.innerHTML = '';
        var back = document.createElement('button'); back.className = 'backrow'; back.textContent = '← All brands';
        back.onclick = function () { m.hidden = true; bx.hidden = false; $('.bigask').hidden = false; $$('.reassure').forEach(function (x) { x.hidden = false }); };
        m.appendChild(back);
        brands[b].forEach(function (c) { m.appendChild(modelBtn(c)) });
        bx.hidden = true; $('.bigask').hidden = true; $$('.reassure').forEach(function (x) { x.hidden = true }); m.hidden = false;
    }

    /* search */
    var idx = cards.map(function (c) { return { c: c, t: (c.dataset.title || '').toLowerCase(), all: c.textContent.toLowerCase() } });
    $('#q').addEventListener('input', function () {
        var q = this.value.trim().toLowerCase(), r = $('#results');
        if (!q) { r.hidden = true; bx.hidden = false; $('.bigask').hidden = false; $$('.reassure').forEach(function (x) { x.hidden = false }); $('#models').hidden = true; return; }
        var hits = idx.filter(function (e) { return e.t.indexOf(q) > -1 });
        if (hits.length < 6) idx.forEach(function (e) { if (e.t.indexOf(q) === -1 && e.all.indexOf(q) > -1 && hits.indexOf(e) === -1) hits.push(e); });
        r.innerHTML = '';
        if (!hits.length) { r.innerHTML = '<p class="nores">No match — try part of the model name (e.g. “ULX”, “6000”), or <a href="https://github.com/gothamsound/quick-dial-cards/issues/new?template=new-system.yml" target="_blank" rel="noopener">request this system</a>.</p>'; }
        hits.slice(0, 8).forEach(function (e) { r.appendChild(modelBtn(e.c)) });
        bx.hidden = true; $('.bigask').hidden = true; $$('.reassure').forEach(function (x) { x.hidden = true }); $('#models').hidden = true; r.hidden = false;
    });

    function goHome() {
        var q = document.getElementById('q'); q.value = '';
        document.getElementById('results').hidden = true; document.getElementById('models').hidden = true;
        bx.hidden = false; document.querySelector('.bigask').hidden = false;
        var rs = document.querySelectorAll('.reassure'); for (var i = 0; i < rs.length; i++) rs[i].hidden = false;
        if (location.hash) location.hash = ''; else { document.getElementById('home').hidden = false; }
        window.scrollTo(0, 0);
    }
    document.getElementById('homebtn').onclick = goHome;
    document.querySelector('header a[aria-label="Home"]').onclick = function (e) { e.preventDefault(); goHome(); };

    /* routing */
    var wrap = $('#cardwrap'), home = $('#home'), current = null;
    function go(slug) { location.hash = slug; }
    function setMode(m) {
        wrap.classList.remove('mode-tx', 'mode-rx'); wrap.classList.add('mode-' + m);
        $('#seg-tx').className = m === 'tx' ? 'on-tx' : ''; $('#seg-rx').className = m === 'rx' ? 'on-rx' : '';
        store.set('qdc-mode', m);
    }
    $('#seg-tx').onclick = function () { setMode('tx') }; $('#seg-rx').onclick = function () { setMode('rx') };
    $('#back').onclick = function () { location.hash = ''; };
    function route() {
        var slug = location.hash.replace('#', ''), c = slug && document.getElementById(slug);
        cards.forEach(function (x) { x.hidden = true });
        if (c && c.classList.contains('card')) {
            c.hidden = false; current = c; home.hidden = true; wrap.hidden = false; document.body.classList.add('in-card');
            wrap.classList.toggle('no-seg', !c.querySelector('.procs'));
            var kt = c.querySelector('.proc.tx .proc-k'), kr = c.querySelector('.proc.rx .proc-k');
            var dt = kt && kt.textContent !== 'TRANSMITTER', dr = kr && kr.textContent !== 'PORTABLE RECEIVER' && kr.textContent !== 'RECEIVER (RACK)';
            document.getElementById('seg-tx').innerHTML = dt ? kt.textContent : 'TX — Transmitter<small>beltpack / handheld</small>';
            document.getElementById('seg-rx').innerHTML = dr ? kr.textContent : (kr && kr.textContent === 'RECEIVER (RACK)' ? 'RX — Rack receiver<small>no portable in-series</small>' : 'RX — Portable receiver<small>camera hop / bag rig</small>');
            setMode(store.get('qdc-mode') || 'tx'); store.set('qdc-last', slug);
            window.scrollTo(0, 0);
        } else {
            home.hidden = false; wrap.hidden = true; document.body.classList.remove('in-card'); renderLast();
        }
    }
    window.addEventListener('hashchange', route);

    /* last used */
    function renderLast() {
        var lu = $('#lastused'), slug = store.get('qdc-last'), c = slug && document.getElementById(slug);
        lu.innerHTML = '';
        if (!c) return;
        var b = document.createElement('button');
        b.innerHTML = '<span class="lu-k">Jump back to</span>' + c.dataset.title;
        b.onclick = function () { go(slug) }; lu.appendChild(b);
    }

    /* assigned frequency (persona 2: keep it huge & visible) */
    var f = $('#freq'); f.value = store.get('qdc-freq') || '';
    f.addEventListener('input', function () { store.set('qdc-freq', this.value) });

    route();
})();
