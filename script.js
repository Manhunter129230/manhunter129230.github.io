const mainPanel    = document.getElementById('main-panel');
const tabs         = document.querySelectorAll('nav button');
const bgmusic      = document.getElementById('bgmusic');
const audioControl = document.getElementById('audio-control');

// --- SAFE AUDIO PLAY ---
function safePlay(audio) {
    if (!audio) return;
    const p = audio.play();
    if (p !== undefined) p.catch(() => {});
}

// --- RIPPLE ---
function createRipple(event) {
    const el = event.currentTarget;
    const circle = document.createElement('span');
    const d = Math.max(el.clientWidth, el.clientHeight);
    const rect = el.getBoundingClientRect();
    circle.style.width = circle.style.height = d + 'px';
    circle.style.left = (event.clientX - rect.left - d / 2) + 'px';
    circle.style.top  = (event.clientY - rect.top  - d / 2) + 'px';
    circle.classList.add('ripple');
    const ex = el.getElementsByClassName('ripple')[0];
    if (ex) ex.remove();
    el.appendChild(circle);
}
document.querySelectorAll('.ripple-btn, .ripple-container').forEach(el => el.addEventListener('click', createRipple));

// --- TAB SWITCHING ---
let currentSection = null;

function measureAndSetHeight(section, callback) {
    const images = section.querySelectorAll('img');
    if (!images.length) { callback(section.scrollHeight); return; }
    let loaded = 0;
    const done = () => { if (++loaded >= images.length) callback(section.scrollHeight); };
    images.forEach(img => {
        if (img.complete) done();
        else {
            img.addEventListener('load',  done, { once: true });
            img.addEventListener('error', done, { once: true });
        }
    });
}

function changeTopic(id) {
    if (currentSection === id) return;
    tabs.forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    const incoming = document.getElementById(id);
    const outgoing = currentSection ? document.getElementById(currentSection) : null;
    if (outgoing) { outgoing.classList.remove('active'); outgoing.style.display = ''; }
    incoming.style.visibility = 'hidden';
    incoming.style.display    = 'block';
    requestAnimationFrame(() => {
        measureAndSetHeight(incoming, (h) => {
            mainPanel.style.height = (h + 70) + 'px';
            setTimeout(() => {
                incoming.style.display    = '';
                incoming.style.visibility = '';
                incoming.classList.add('active');
                if (id === 'certificates') {
                    incoming.querySelectorAll('.cert-card').forEach((c, i) => {
                        c.classList.remove('visible');
                        setTimeout(() => c.classList.add('visible'), 120 + i * 120);
                    });
                }
            }, 100);
        });
    });
    currentSection = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- AUDIO + VOLUME ---
let volumePanelOpen = false;
const volumePanel   = document.getElementById('volume-panel');
const volSlider     = document.getElementById('volume-slider');
const volValue      = document.getElementById('volume-value');

bgmusic.volume = 0.3;

audioControl.addEventListener('click', () => {
    volumePanelOpen = !volumePanelOpen;
    volumePanel.classList.toggle('open', volumePanelOpen);
});

document.addEventListener('click', (e) => {
    if (volumePanelOpen && !audioControl.contains(e.target) && !volumePanel.contains(e.target)) {
        volumePanelOpen = false;
        volumePanel.classList.remove('open');
    }
});

volSlider.addEventListener('input', () => {
    bgmusic.volume = volSlider.value / 100;
    volValue.textContent = volSlider.value + '%';
    updateTrack();
});

function updateTrack() {
    const p = volSlider.value + '%';
    volSlider.style.background = `linear-gradient(to right,#f9d423 0%,#ff4e50 ${p},rgba(255,255,255,0.1) ${p})`;
}
updateTrack();

// --- CANVAS VISUALISER (simulated — no Web Audio API) ---
const canvas = document.getElementById('vol-canvas');
const ctx    = canvas.getContext('2d');

function startVisualiser() {
    let phase = 0;
    (function loop() {
        requestAnimationFrame(loop);
        if (bgmusic.paused) { drawIdle(); return; }
        phase += 0.055;
        const vol  = volSlider.value / 100;
        const fake = new Uint8Array(20);
        for (let i = 0; i < 20; i++) {
            fake[i] = Math.max(0, vol * 255 * (0.25 + 0.75 * Math.abs(
                Math.sin(phase + i * 0.65) * Math.sin(phase * 0.3 + i * 0.4)
            )));
        }
        drawBars(fake);
    })();
}

function drawBars(data) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const count = 20, gap = 2;
    const barW  = (W - gap * (count - 1)) / count;
    for (let i = 0; i < count; i++) {
        const norm = (data[i] || 0) / 255;
        const barH = Math.max(3, norm * H * 0.92);
        const x    = i * (barW + gap);
        const grad = ctx.createLinearGradient(0, H, 0, 0);
        grad.addColorStop(0,   `rgba(249,212,35,${0.4 + (volSlider.value/100) * 0.6})`);
        grad.addColorStop(0.6, `rgba(255,100,40,0.8)`);
        grad.addColorStop(1,   `rgba(255,78,80,${0.3 + norm * 0.7})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, H - barH, barW, barH, 1.5);
        ctx.fill();
        if (norm > 0.65) {
            ctx.save();
            ctx.shadowColor = 'rgba(249,212,35,0.5)';
            ctx.shadowBlur  = 6;
            ctx.fillStyle   = grad;
            ctx.beginPath();
            ctx.roundRect(x, H - barH, barW, barH, 1.5);
            ctx.fill();
            ctx.restore();
        }
    }
}

function drawIdle() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const count = 20, gap = 2;
    const barW  = (W - gap * (count - 1)) / count;
    for (let i = 0; i < count; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath();
        ctx.roundRect(i * (barW + gap), H - 3, barW, 3, 1);
        ctx.fill();
    }
}

drawIdle();

// --- TYPING ---
function typeHeading(text, id, speed = 60) {
    const el = document.getElementById(id);
    el.textContent = '';
    let i = 0;
    const iv = setInterval(() => { el.textContent += text[i++]; if (i >= text.length) clearInterval(iv); }, speed);
}

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    bgmusic.volume = 0.3;
    setTimeout(() => {
        typeHeading("Welcome to Raeed's World", 'typed-heading');
        changeTopic('about');
    }, 200);
});

// Start music on first interaction (bypasses browser autoplay block)
function startMusic() {
    safePlay(bgmusic);
    startVisualiser();
    document.removeEventListener('click', startMusic);
    document.removeEventListener('touchstart', startMusic);
    document.removeEventListener('keydown', startMusic);
}
document.addEventListener('click', startMusic);
document.addEventListener('touchstart', startMusic);
document.addEventListener('keydown', startMusic);

// --- LIGHTBOX ---
function openLightbox(src, title) {
    const lb    = document.getElementById('lightbox');
    const inner = lb.querySelector('.lightbox-inner');
    document.getElementById('lightbox-img').src           = src;
    document.getElementById('lightbox-title').textContent = title;
    inner.style.animation = 'none';
    lb.classList.add('open');
    requestAnimationFrame(() => { inner.style.animation = ''; });
    document.body.style.overflow = 'hidden';
}
function closeLightbox() {
    const lb = document.getElementById('lightbox');
    lb.classList.add('closing');
    setTimeout(() => { lb.classList.remove('open', 'closing'); document.body.style.overflow = ''; }, 300);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// --- SCROLL BAR ---
const scrollBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = (dh > 0 ? (window.scrollY / dh) * 100 : 0) + '%';
}, { passive: true });

// --- RESIZE ---
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (currentSection) mainPanel.style.height = (document.getElementById(currentSection).scrollHeight + 70) + 'px';
    }, 100);
});
