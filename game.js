const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

// --- UTILS ---
function shuffle(arr) {
    let a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function fmtTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function addLog(html) {
    const el = document.createElement('div');
    el.className = 'entry';
    el.innerHTML = html;
    $('#log').prepend(el);
}

function setProgress(p) {
    $('#progressBar').style.width = `${p}%`;
}

// --- STARS ---
function drawStars() {
    const box = $('#stars');
    for (let i = 0; i < 80; i++) {
        const s = document.createElement('i');
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.opacity = (Math.random() * 0.7 + 0.3).toFixed(2);
        s.style.transform = `scale(${Math.random() * 1.2 + 0.3})`;
        box.appendChild(s);
    }
}

// --- CONFETTI ---
let confettiInterval;

function blastConfetti() {
    const canvas = $('#confetti');
    const ctx = canvas.getContext('2d');
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const N = 180;
    const parts = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: -20,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        vx: -1 + Math.random() * 2,
        vy: 2 + Math.random() * 3,
        r: Math.random() * Math.PI,
        s: Math.random() * 0.1 + 0.02
    }));

    let t = 0;
    clearInterval(confettiInterval); // detener cualquier confeti anterior
    confettiInterval = setInterval(() => {
        ctx.clearRect(0, 0, W, H);
        parts.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.r += p.s;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.r);
            const g = ctx.createLinearGradient(0, 0, p.w, p.h);
            const colors = [
                ['#7c5cff', '#21d4fd'],
                ['#21d4fd', '#a6ffcb'],
                ['#a6ffcb', '#7c5cff'],
                ['#ffd166', '#7c5cff']
            ];
            const c = colors[Math.floor(Math.random() * colors.length)];
            g.addColorStop(0, c[0]);
            g.addColorStop(1, c[1]);
            ctx.fillStyle = g;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        t++;
        if (t > 90) { // 90 frames ≈ 1.5s a 60fps
            clearInterval(confettiInterval);
            ctx.clearRect(0, 0, W, H); // limpiar canvas al final
        }
    }, 16);
}

// --- STATE ---
const state = { level: 1, score: 0, streak: 0, time: 0, timerId: null, answered: false };

// --- LEVELS ---
const LEVELS = [
    {
        type: 'mcq',
        title: 'Nivel 1 — Referencia anafórica',
        q: '«María habló con Ana. <b>Ella</b> le pidió un favor». ¿A quién se refiere <b>Ella</b>?',
        options: [
            { t: 'A María', correct: true, why: 'Referencia anafórica al antecedente más cercano y coherente (María habló… Ella pidió).' },
            { t: 'A Ana', correct: false, why: 'Podría ser ambiguo, pero el sujeto agente de la primera oración favorece a María.' },
            { t: 'A ambas', correct: false, why: 'La correferencia debe ser única para mantener la cohesión.' },
            { t: 'A ninguna', correct: false, why: 'Hay un antecedente explícito: María.' }
        ],
        tip: 'La <b>referencia anafórica</b> retoma un elemento ya mencionado (antecedente).'
    },
    {
        type: 'drag',
        title: 'Nivel 2 — Conectores por función',
        q: 'Clasifica los conectores según su función: adición, causa y contraste.',
        groups: [
            { name: 'Adición', id: 'add' },
            { name: 'Causa', id: 'cause' },
            { name: 'Contraste', id: 'contra' }
        ],
        items: [
            { t: 'además', g: 'add' }, { t: 'asimismo', g: 'add' }, { t: 'porque', g: 'cause' }, { t: 'ya que', g: 'cause' },
            { t: 'sin embargo', g: 'contra' }, { t: 'no obstante', g: 'contra' }, { t: 'encima', g: 'add' }, { t: 'puesto que', g: 'cause' }
        ],
        tip: 'Los conectores aportan relaciones lógicas: sumar, explicar, o contraponer ideas.'
    },
    {
        type: 'mcq',
        title: 'Nivel 3 — Elipsis',
        q: 'Selecciona la opción con <b>elipsis</b> bien aplicada.',
        options: [
            { t: 'Ayer compré pan; hoy, leche.', correct: true, why: 'Se omite el verbo “compré” en la segunda parte: elipsis verbal correcta.' },
            { t: 'Ayer compré; pan hoy, leche.', correct: false, why: 'Orden anómalo que rompe la cohesión.' },
            { t: 'Ayer el pan compré hoy la leche.', correct: false, why: 'No es elipsis; es desorden sintáctico.' },
            { t: 'Ayer compré pan; hoy compré leche.', correct: false, why: 'Cohesiona, pero no hay elipsis: se repite el verbo.' }
        ],
        tip: 'La elipsis suprime información recuperable por el contexto.'
    },
    {
        type: 'hangman',
        title: 'Nivel 4 — Sustitución léxica (sinónimos)',
        q: 'Adivina el término de cohesión: “reemplazar una palabra por otra de significado parecido para evitar repeticiones”.',
        word: 'SINONIMIA',
        tip: 'Piensa en “igual significado”. Mayúsculas sin tildes.'
    },
    {
        type: 'mcq',
        title: 'Nivel 5 — Hiperónimo / Hipónimo',
        q: 'Elige el <b>hiperónimo</b> que cohesiona con “perro, gato, hámster”.',
        options: [
            { t: 'mascota', correct: true, why: '“Mascota” agrupa a los tres como categoría superior: hiperónimo.' },
            { t: 'collar', correct: false, why: 'Relacionado pero no es un hiperónimo.' },
            { t: 'carnívoro', correct: false, why: 'Categoría biológica parcial y no engloba al hámster.' },
            { t: 'felino', correct: false, why: 'Hipónimo de gato, no hiperónimo.' }
        ],
        tip: 'El hiperónimo nombra la clase general; el hipónimo, un elemento de esa clase.'
    },
    {
        type: 'mcq',
        title: 'Nivel 6 — Deixis temporal y espacial',
        q: '¿Qué elemento deíctico completa mejor?: “Nos vemos ___ en ___”.',
        options: [
            { t: 'mañana / aquí', correct: true, why: 'Deixis temporal (mañana) y espacial (aquí) según el punto de habla.' },
            { t: 'ayer / allí', correct: false, why: '“Ayer” no es futuro coherente con “nos vemos”.' },
            { t: 'siempre / nunca', correct: false, why: 'No son deícticos situacionales concretos.' },
            { t: 'pronto / debajo', correct: false, why: '“Debajo” no señala un lugar de encuentro natural.' }
        ],
        tip: 'La deixis localiza en tiempo, espacio o persona desde el hablante.'
    },
    {
        type: 'mcq',
        title: 'Nivel 7 — Repetición controlada',
        q: '¿Cuál mantiene mejor la cohesión evitando redundancias? “El volcán entró en erupción. ___ causó evacuaciones.”',
        options: [
            { t: 'El fenómeno', correct: true, why: 'Repite la referencia de forma nominal sin redundar.' },
            { t: 'El volcán otra vez', correct: false, why: 'Repetición innecesaria.' },
            { t: 'Eso mismo que pasó', correct: false, why: 'Deixis vaga.' },
            { t: 'La situación volcánica que se produjo', correct: false, why: 'Circunloquio pesado.' }
        ],
        tip: 'La cohesión equilibra claridad y economía: evita repeticiones inútiles.'
    },
    {
        type: 'mcq',
        title: 'Nivel 8 — Completa con conector',
        q: 'Completa: “Estudió con constancia; ___, aprobó con nota”.',
        options: [
            { t: 'por lo tanto', correct: true, why: 'Conector de consecuencia.' },
            { t: 'sin embargo', correct: false, why: 'Introduce contraste, no consecuencia.' },
            { t: 'por ejemplo', correct: false, why: 'Introduce ejemplificación.' },
            { t: 'en cambio', correct: false, why: 'Contraste.' }
        ],
        tip: 'Consecuencia: por lo tanto, por eso, en consecuencia…'
    }
];

// --- RENDER MCQ ---
function renderMCQ(lv) {
    const tpl = document.importNode($('#tpl-mcq').content, true);
    tpl.querySelector('.question').innerHTML = lv.q;
    const box = tpl.querySelector('.options');
    shuffle(lv.options).forEach(opt => {
        const div = document.createElement('button');
        div.className = 'option';
        div.innerHTML = opt.t;
        div.addEventListener('click', () => handleAnswer(opt.correct, opt.why));
        box.appendChild(div);
    });
    return tpl;
}

// --- RENDER DRAG ---
function renderDrag(lv) {
    const tpl = document.importNode($('#tpl-drag').content, true);
    tpl.querySelector('.question').innerHTML = lv.q;
    const tokens = tpl.getElementById('tokens');
    const drops = tpl.getElementById('drops');

    lv.groups.forEach(g => {
        const d = document.createElement('div');
        d.className = 'drop';
        d.dataset.g = g.id;
        d.innerHTML = `<div class="pill">${g.name}</div>`;
        d.addEventListener('dragover', e => { e.preventDefault(); d.classList.add('ghost') });
        d.addEventListener('dragleave', () => d.classList.remove('ghost'));
        d.addEventListener('drop', e => {
            e.preventDefault();
            d.classList.remove('ghost');
            const id = e.dataTransfer.getData('text/plain');
            const el = document.getElementById(id);
            if (!el) return;
            d.appendChild(el);
        });
        drops.appendChild(d);
    });

    shuffle(lv.items).forEach((it, idx) => {
        const t = document.createElement('div');
        t.className = 'token';
        t.draggable = true;
        t.id = 'tok' + idx;
        t.textContent = it.t;
        t.dataset.g = it.g;
        t.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', t.id); });
        tokens.appendChild(t);
    });

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.marginTop = '14px';
    btn.textContent = 'Comprobar';
    btn.addEventListener('click', () => {
        let ok = 0;
        lv.items.forEach((it, idx) => {
            const el = document.getElementById('tok' + idx);
            const parent = el.parentElement.closest('.drop');
            const correct = parent && parent.dataset.g === it.g;
            el.style.outline = `2px solid ${correct ? 'var(--success)' : 'var(--danger)'}`;
            if (correct) ok++;
        });
        handleAnswer(ok === lv.items.length, ok === lv.items.length ? '¡Perfecto! Clasificaste todos los conectores correctamente.' : `Clasificaste ${ok}/${lv.items.length}. Revisa los que quedaron en otra categoría.`);
    });
    tpl.appendChild(btn);
    return tpl;
}

// --- RENDER HANGMAN ---
function renderHangman(lv) {
    const tpl = document.importNode($('#tpl-hangman').content, true);
    tpl.querySelector('.question').innerHTML = lv.q;
    const W = lv.word.toUpperCase();
    const guessed = new Set();
    const wordEl = tpl.getElementById('hmWord');
    const lettersEl = tpl.getElementById('hmLetters');

    function refresh() {
        const out = W.split('').map(ch => ch === ' ' ? ' ' : (guessed.has(ch) ? ch : '_')).join(' ');
        wordEl.textContent = out;
        if (!out.includes('_')) handleAnswer(true, `La palabra era <b>${W}</b>. ¡Bien!`);
    }

    'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').forEach(ch => {
        const b = document.createElement('button');
        b.textContent = ch;
        b.addEventListener('click', () => {
            if (guessed.has(ch)) return;
            guessed.add(ch);
            b.disabled = true;
            refresh();
        });
        lettersEl.appendChild(b);
    });

    refresh();
    return tpl;
}

// --- RENDER LEVEL ---
function renderLevel(idx) {
    const lv = LEVELS[idx];
    $('#title').textContent = lv.title;
    const content = $('#content');
    content.innerHTML = '';
    let view;
    if (lv.type === 'mcq') view = renderMCQ(lv);
    if (lv.type === 'drag') view = renderDrag(lv);
    if (lv.type === 'hangman') view = renderHangman(lv);
    content.appendChild(view);
    setProgress(idx / LEVELS.length * 100);
    $('#level').textContent = state.level;
    addLog(`<b>${lv.title}</b><i>${lv.tip || ''}</i>`);
    state.answered = false;
}

// --- HANDLE ANSWER ---
function handleAnswer(correct, why) {
    if (state.answered) return;
    state.answered = true;
    const add = correct ? (100 + state.streak * 20) : 0;
    if (correct) { state.score += add; state.streak++; blastConfetti(); } else state.streak = 0;
    $('#score').textContent = state.score;
    $('#streak').textContent = state.streak;
    addLog(`${correct ? '✅' : '❌'} <span>${why || ''}</span> <i>${correct ? '+' + add + ' pts' : ''}</i>`);
    $$('.option').forEach(el => {
        const isCorrect = LEVELS[state.level - 1].options?.find(o => o.t === el.innerHTML)?.correct;
        if (isCorrect === true) el.classList.add('correct');
        if (isCorrect === false && el === document.activeElement) el.classList.add('incorrect');
    });
    setTimeout(nextLevel, 900);
}

// --- NEXT LEVEL ---
function nextLevel() {
    if (state.level < LEVELS.length) {
        state.level++;
        renderLevel(state.level - 1);
    } else endGame();
}

// --- END GAME ---
function endGame() {
    setProgress(100);
    const content = $('#content');
    content.innerHTML = `
    <div style="display:grid; gap:16px; place-items:center; text-align:center">
      <h3 style="margin:0">🏁 ¡Juego completado!</h3>
      <p class="muted">Tu puntaje final fue de <b>${state.score}</b> puntos con una racha máxima de ${state.streak}.</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap">
        <button class="btn" id="btnJugarOtra">Jugar otra vez</button>
        <button class="btn ghost" id="btnVerResumen">Ver resumen</button>
      </div>
    </div>`;
    $('#title').textContent = 'Resumen de la cohesión textual';
    $('#btnJugarOtra')?.addEventListener('click', () => reset(true));
    $('#btnVerResumen')?.addEventListener('click', showSummary);
    blastConfetti(); blastConfetti();
}

// --- SHOW SUMMARY ---
function showSummary() {
    addLog(`<b>Resumen</b><i>Referencia, conectores, elipsis, sinonimia, hiperónimo/hipónimo, deixis, repetición controlada y consecuencia.</i>`);
    const tips = [
        'Referencia anafórica: retoma un antecedente ya mencionado.',
        'Conectores: adición (además), causa (porque), contraste (sin embargo).',
        'Elipsis: omite lo recuperable por contexto.',
        'Sinonimia: sustituir por palabra de significado semejante.',
        'Hiperónimo: categoría general que engloba a otras.',
        'Deixis: localiza en tiempo, espacio o persona.',
        'Repetición controlada: evita redundancias innecesarias.',
        'Consecuencia: por lo tanto, por eso, en consecuencia.'
    ];
    tips.forEach(t => addLog(`<b>ℹ️</b><i>${t}</i>`));
}

// --- RESET ---
function reset(skipIntro = false) {
    state.level = 1; state.score = 0; state.streak = 0; state.answered = false;
    $('#score').textContent = 0; $('#streak').textContent = 0; $('#level').textContent = 1;
    $('#log').innerHTML = '<div class="entry"><b>¡Nueva partida!</b><i>Demuestra tu dominio de la cohesión textual.</i></div>';
    setProgress(0); renderLevel(0);
    if (!skipIntro) blastConfetti();
}

// --- TIMER ---
function startTimer() {
    clearInterval(state.timerId); state.time = 0; $('#time').textContent = '00:00';
    state.timerId = setInterval(() => { state.time++; $('#time').textContent = fmtTime(state.time); }, 1000);
}

// --- CONTROLES ---
$('#btnReiniciar').addEventListener('click', () => reset());
$('#btnPista').addEventListener('click', () => {
    const lv = LEVELS[state.level - 1];
    addLog(`<b>💡 Pista</b><i>${lv.tip || 'Piensa con calma, el texto te guía.'}</i>`);
});
$('#btnSaltar').addEventListener('click', () => {
    addLog('<b>⏭️ Saltaste</b><i>Pierdes la oportunidad de sumar puntos en este nivel.</i>');
    state.streak = 0; $('#streak').textContent = 0; nextLevel();
});

// --- INIT ---
drawStars();
renderLevel(0);
startTimer();
