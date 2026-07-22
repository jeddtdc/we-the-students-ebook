// sections n stuff
const sectionIds = ["cover", "belief", "review", "discoveries", "recommendations", "summit", "closing"];
const sections = sectionIds.map(id => document.getElementById(id));
const railDots = Array.from(document.querySelectorAll(".rail-dot"));
const mobileBtns = Array.from(document.querySelectorAll("#mobilebar button"));
const rail = document.getElementById("rail");
const mobilebar = document.getElementById("mobilebar");
const darkSections = new Set(["cover", "closing"]);

function scrollToId(id) {
    const el = document.getElementById(id);

    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
}
railDots.forEach(btn => btn.addEventListener("click", () => scrollToId(btn.dataset.target)));
mobileBtns.forEach(btn => btn.addEventListener("click", () => scrollToId(btn.dataset.target)));

// progress bar
const progressEl = document.getElementById("progress");
function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    progressEl.style.width = pct + "%";
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let barManual = false;
let scrollYAtBarTouch = 0;

mobilebar.addEventListener("pointerdown", () => {
    barManual = true;
    scrollYAtBarTouch = window.scrollY;
}, { passive: true });

function syncMobileBar(btn) {
    if (!btn || barManual) return;

    // 0 on desktop, where the bar is hidden then theres nothing to do
    const max = mobilebar.scrollWidth - mobilebar.clientWidth;

    if (max <= 0) return;

    const centred = btn.offsetLeft - (mobilebar.clientWidth - btn.offsetWidth) / 2;

    mobilebar.scrollTo({
        left: Math.max(0, Math.min(centred, max)),
        behavior: reduceMotion.matches ? "auto" : "smooth"
    });
}

// active section tracking
function setActive(id) {
    railDots.forEach(d => d.classList.toggle("active", d.dataset.target === id));
    mobileBtns.forEach(d => d.classList.toggle("active", d.dataset.target === id));
    rail.classList.toggle("on-dark", darkSections.has(id));

    syncMobileBar(mobileBtns.find(d => d.dataset.target === id));
}

// where you at on the page brah
function currentSectionId() {
    const doc = document.documentElement;

    // right at the bottom the last section might not reach the line so just call it
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        return sections[sections.length - 1].id;
    }

    const line = window.innerHeight * 0.35;
    let current = sections[0].id;
    for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id;
    }
    return current;
}

// have it run on every scroll (but capped to once a frame so it stays smooth)
let activeId = null;
let ticking = false;

function onScroll() {
    if (barManual && Math.abs(window.scrollY - scrollYAtBarTouch) > 40) {
        barManual = false;
    }

    updateProgress();

    const id = currentSectionId();

    if (id !== activeId) {
        activeId = id;
        setActive(id);
    }

    ticking = false;
}

window.addEventListener("scroll", () => {
    if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
    }
}, { passive: true });
window.addEventListener("resize", onScroll, { passive: true });
onScroll();

// reveal on scroll
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// the 86% / 51% / 82% cards count up from 0 the first time you see them
const statEls = document.querySelectorAll(".stat-num[data-target]");
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || "";
            const duration = 1100;
            const startTime = performance.now();
            function tick(now) {
                const p = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                const val = Math.round(eased * target);
                el.textContent = val + suffix;
                if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            statObserver.unobserve(el);
        }
    });
}, { threshold: 0.4 });
statEls.forEach(el => statObserver.observe(el));

// the 3.2 -> 6.1 bar fills itself when you scroll to it
const meterFill = document.getElementById("meterFill");
const meterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            meterFill.style.width = "61%";
            meterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.4 });

const meterEl = document.getElementById("meter");

if (meterEl) {
    meterObserver.observe(meterEl);
}
