// src/bokmärke.js — bokmärken och kontrastjustering

import { S } from "./state.js";

// ── Hjälp: char-offset ─────────────────────────────────────────────────────

export function getCharOffset(bubbleEl, range) {
    const walker = document.createTreeWalker(bubbleEl, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let node;
    while ((node = walker.nextNode())) {
        if (node === range.startContainer) return offset + range.startOffset;
        offset += node.textContent.length;
    }
    return offset;
}

export function insättBokmärkesMarkör(bubbleEl, charOffset) {
    const walker = document.createTreeWalker(bubbleEl, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let node;
    while ((node = walker.nextNode())) {
        const len = node.textContent.length;
        if (offset + len >= charOffset) {
            const range = document.createRange();
            const localOffset = Math.min(charOffset - offset, len);
            range.setStart(node, localOffset);
            range.collapse(true);
            const marker = document.createElement("span");
            marker.className = "aiuda-bm-marker";
            marker.title = "Bokmärke — klicka för att ta bort";
            marker.textContent = "🔖";
            range.insertNode(marker);
            return;
        }
        offset += len;
    }
}

// ── Sätt / ta bort bokmärke ────────────────────────────────────────────────

export function sättBokmärke(bubbleIdx, charOffset) {
    document.querySelector(".aiuda-bm-marker")?.remove();

    const hoppBtn = document.getElementById("bokmärk-hopp");

    if (bubbleIdx >= 0) {
        S.bokmärke = { bubbleIdx, charOffset };
        const el = document.querySelector(`[data-bubble-idx="${bubbleIdx}"]`);
        if (el) insättBokmärkesMarkör(el, charOffset);
        if (hoppBtn) hoppBtn.style.display = "inline-block";
    } else {
        S.bokmärke = null;
        if (hoppBtn) hoppBtn.style.display = "none";
    }

    if (S.sessionId) {
        localStorage.setItem(S.sessionId, JSON.stringify({ namn: S.aktivtProjekt?.namn, fraga: S.aktivtProjekt?.fraga, historik: S.historik, bokmärke: S.bokmärke, kontrastKarta: S.kontrastKarta }));
    }
}

export function återställBokmärke() {
    if (!S.bokmärke) return;
    const el = document.querySelector(`[data-bubble-idx="${S.bokmärke.bubbleIdx}"]`);
    if (el) {
        insättBokmärkesMarkör(el, S.bokmärke.charOffset);
        document.getElementById("bokmärk-hopp").style.display = "inline-block";
    }
}

export function återställKontrast() {
    for (const [nyckel, opacity] of Object.entries(S.kontrastKarta)) {
        const [bubbleIdx, elPart] = nyckel.split(":");
        const bubbla = document.querySelector(`[data-bubble-idx="${bubbleIdx}"]`);
        if (!bubbla) continue;
        if (elPart === "self") {
            bubbla.style.opacity = opacity;
            bubbla.dataset.kontrastOpacity = opacity;
        } else {
            const syskon = Array.from(bubbla.querySelectorAll("p, li, h1, h2, h3, h4, blockquote, pre, td, th"));
            const el = syskon[parseInt(elPart)];
            if (el) { el.style.opacity = opacity; el.dataset.kontrastOpacity = opacity; }
        }
    }
}

export function kontrastNyckel(bubbla, textEl) {
    const bubbleIdx = bubbla.dataset.bubbleIdx ?? "-1";
    if (bubbla.classList.contains("user")) return `${bubbleIdx}:self`;
    const syskon = Array.from(bubbla.querySelectorAll("p, li, h1, h2, h3, h4, blockquote, pre, td, th"));
    const elIdx = syskon.indexOf(textEl);
    return `${bubbleIdx}:${elIdx}`;
}

// ── Initiera bokmärke- och kontrast-listeners ──────────────────────────────

export function initBokmärke() {
    document.getElementById("bokmärk-hopp").addEventListener("click", () => {
        const marker = document.querySelector(".aiuda-bm-marker");
        if (marker) marker.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Alt+scroll i chattbubblor: kontrastjustering
    let kontrastSparTimer = null;
    document.getElementById("meddelanden").addEventListener("wheel", (e) => {
        if (!e.altKey) return;
        e.preventDefault();

        const under = document.elementFromPoint(e.clientX, e.clientY);
        const bubbla = under?.closest(".bubbla");
        if (!bubbla) return;
        const textEl = under.closest("p, li, h1, h2, h3, h4, blockquote, pre, td, th")
                    ?? (bubbla.classList.contains("user") ? bubbla : null);
        if (!textEl) return;

        const nuvarande = parseFloat(textEl.dataset.kontrastOpacity) || 1;
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const nästa = Math.min(1, Math.max(0.15, Math.round((nuvarande + delta) * 10) / 10));
        textEl.dataset.kontrastOpacity = nästa;
        textEl.style.opacity = nästa;

        const nyckel = kontrastNyckel(bubbla, textEl);
        if (nästa < 1) {
            S.kontrastKarta[nyckel] = nästa;
        } else {
            delete S.kontrastKarta[nyckel];
        }

        clearTimeout(kontrastSparTimer);
        kontrastSparTimer = setTimeout(() => {
            if (S.sessionId) localStorage.setItem(S.sessionId, JSON.stringify({ namn: S.aktivtProjekt?.namn, fraga: S.aktivtProjekt?.fraga, historik: S.historik, bokmärke: S.bokmärke, kontrastKarta: S.kontrastKarta }));
        }, 800);
    }, { passive: false });

    // Alt+scroll i höger sidopanel
    document.getElementById("höger").addEventListener("wheel", (e) => {
        if (!e.altKey) return;
        e.preventDefault();

        const under = document.elementFromPoint(e.clientX, e.clientY);
        const textEl = under?.closest(
            ".task-item, .käll-entry, .logg-entry, " +
            "p, li, h1, h2, h3, h4, blockquote, pre, td, th"
        );
        if (!textEl) return;

        const nuvarande = parseFloat(textEl.dataset.kontrastOpacity) || 1;
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const nästa = Math.min(1, Math.max(0.15, Math.round((nuvarande + delta) * 10) / 10));
        textEl.dataset.kontrastOpacity = nästa;
        textEl.style.opacity = nästa;
    }, { passive: false });
}
