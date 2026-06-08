const header = document.querySelector('header');
const nav = document.querySelector('nav');
const footer = document.querySelector('footer');
const mainPanel = document.getElementById('main-panel');
const tabs = document.querySelectorAll('nav button');

const bgmusic = document.getElementById('bgmusic');
const clicksound = document.getElementById('clicksound');
const errorSound = document.getElementById('errorSound');
const audioControl = document.getElementById('audio-control');

// --- RIPPLE EFFECT ---
function createRipple(event) {
    const element = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;
    const rect = element.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    const existingRipple = element.getElementsByClassName("ripple")[0];
    if (existingRipple) existingRipple.remove();
    element.appendChild(circle);
}
document.querySelectorAll('.ripple-btn, .ripple-container').forEach(el => el.addEventListener('click', createRipple));

let currentSection = null;

// --- SMOOTH MORPHING LOGIC ---
function changeTopic(id) {
  if (currentSection === id) return;
  clicksound.play();
  
  tabs.forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');

  const incomingSection = document.getElementById(id);
  const outgoingSection = currentSection ? document.getElementById(currentSection) : null;

  // Prepare Incoming
  incomingSection.style.visibility = 'hidden'; 
  incomingSection.style.display = 'block'; 
  
  // Measure and Morph
  requestAnimationFrame(() => {
      const contentHeight = incomingSection.scrollHeight;
      const totalHeight = contentHeight + 70; // 70px padding
      
      mainPanel.style.height = totalHeight + 'px';

      if (outgoingSection) {
          outgoingSection.classList.remove('active');
      }
      
      setTimeout(() => {
          incomingSection.style.visibility = 'visible';
          incomingSection.classList.add('active');
          // Stagger cert cards if entering certificates section
          if (id === 'certificates') {
              const cards = incomingSection.querySelectorAll('.cert-card');
              cards.forEach((card, i) => {
                  card.classList.remove('visible');
                  setTimeout(() => card.classList.add('visible'), 120 + i * 120);
              });
          }
      }, 100); 
  });

  currentSection = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- AUDIO CONTROL ---
let musicPlaying = false;
audioControl.addEventListener('click', () => {
  const playIcon = document.getElementById('audio-icon-play');
  const pauseIcon = document.getElementById('audio-icon-pause');
  if (musicPlaying) {
    bgmusic.pause();
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  } else {
    bgmusic.play();
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  }
  musicPlaying = !musicPlaying;
});

// --- TYPING ANIMATION ---
function typeHeading(text, elementId, speed = 60) {
    const el = document.getElementById(elementId);
    el.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
        el.textContent += text[i];
        i++;
        if (i >= text.length) clearInterval(interval);
    }, speed);
}

// --- PAGE LOAD ENTRANCE ---
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        typeHeading("Welcome to Raeed's World", 'typed-heading');
        changeTopic('about');
    }, 200);
    bgmusic.volume = 0.3;
});

// --- LIGHTBOX ---
function openLightbox(src, title) {
    const lightbox = document.getElementById('lightbox');
    const inner = lightbox.querySelector('.lightbox-inner');
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-title').textContent = title;
    // Re-trigger animation each time
    inner.style.animation = 'none';
    lightbox.classList.add('open');
    requestAnimationFrame(() => {
        inner.style.animation = '';
    });
    document.body.style.overflow = 'hidden';
}
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('closing');
    setTimeout(() => {
        lightbox.classList.remove('open');
        lightbox.classList.remove('closing');
        document.body.style.overflow = '';
    }, 300);
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
});

// --- SCROLL PROGRESS BAR ---
const scrollBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollBar.style.width = pct + '%';
});

// --- RESIZE HANDLER ---
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (currentSection) {
            const sec = document.getElementById(currentSection);
            const totalHeight = sec.scrollHeight + 70;
            mainPanel.style.height = totalHeight + 'px';
        }
    }, 100);
});
