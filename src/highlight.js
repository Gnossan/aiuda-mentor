// src/highlight.js — highlight-verktyg i chattbubblor + orduppslagning
import DOMPurify from "dompurify";

import { S } from "./state.js";
import { sparaAnteckningarOchTasks } from "./notat.js";

export const HL_FÄRGER = [
    { namn: "viktigt",    label: "Viktigt",    bg: "rgba(255,210,0,0.35)",   border: "rgba(255,210,0,0.7)" },
    { namn: "fakta",      label: "Fakta",      bg: "rgba(80,200,120,0.35)",  border: "rgba(80,200,120,0.7)" },
    { namn: "kontext",    label: "Kontext",    bg: "rgba(90,160,255,0.35)",  border: "rgba(90,160,255,0.7)" },
    { namn: "definition", label: "Definition", bg: "rgba(190,110,255,0.35)", border: "rgba(190,110,255,0.7)" },
    { namn: "kritik",     label: "Kritik",     bg: "rgba(255,90,90,0.35)",   border: "rgba(255,90,90,0.7)" },
];

let hlToolbar = null;

function taBortHlToolbar() {
    hlToolbar?.remove();
    hlToolbar = null;
}

function läggTillINotat(text) {
    const area = document.getElementById("anteckningar-area");
    if (!area) return;
    const befintligt = area.value.trim();
    const ny = befintligt ? befintligt + "\n\n" + text : text;
    area.value = ny;
    area.dispatchEvent(new Event("input"));
}

function appliceraPennfärg(färg) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const markerad = sel.toString().trim();
    if (!markerad) return;

    try {
        const range = sel.getRangeAt(0);
        const span = document.createElement("span");
        span.className = "aiuda-hl";
        span.dataset.hlFärg = färg.namn;
        span.style.cssText = `background:${färg.bg};border-bottom:2px solid ${färg.border};border-radius:2px;cursor:pointer;padding:0 1px;`;
        span.title = `${färg.label} — klicka för att ta bort`;

        try {
            range.surroundContents(span);
        } catch {
            const fragment = range.extractContents();
            span.appendChild(fragment);
            range.insertNode(span);
        }

        sel.removeAllRanges();
        läggTillINotat(`[${färg.label}] "${markerad}"`);
        sparaAnteckningarOchTasks();
    } catch (e) {
        console.warn("Highlight misslyckades:", e.message);
    }
}

function visaHlToolbar(x, y) {
    taBortHlToolbar();

    const toolbar = document.createElement("div");
    toolbar.id = "aiuda-hl-toolbar";
    toolbar.style.cssText = `
        position:fixed;left:${x}px;top:${y - 44}px;
        background:#1a1610;border:1px solid #444;border-radius:8px;
        padding:6px 8px;display:flex;gap:6px;align-items:center;
        z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.5);
    `;

    HL_FÄRGER.forEach(f => {
        const knapp = document.createElement("button");
        knapp.title = f.label;
        knapp.style.cssText = `
            width:22px;height:22px;border-radius:50%;cursor:pointer;
            background:${f.bg};border:2px solid ${f.border};
            transition:transform 0.1s;
        `;
        knapp.addEventListener("mouseenter", () => knapp.style.transform = "scale(1.2)");
        knapp.addEventListener("mouseleave", () => knapp.style.transform = "");
        knapp.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            appliceraPennfärg(f);
            taBortHlToolbar();
        });
        toolbar.appendChild(knapp);
    });

    const radera = document.createElement("button");
    radera.textContent = "✕";
    radera.title = "Ta bort markering";
    radera.style.cssText = `
        width:22px;height:22px;border-radius:50%;cursor:pointer;
        background:transparent;border:1px solid #555;color:#f5f0e8;
        font-size:11px;opacity:0.6;transition:opacity 0.15s;
    `;
    radera.addEventListener("mouseenter", () => radera.style.opacity = "1");
    radera.addEventListener("mouseleave", () => radera.style.opacity = "0.6");
    radera.addEventListener("mousedown", (e) => {
        e.preventDefault();
        taBortHlToolbar();
    });
    toolbar.appendChild(radera);

    document.body.appendChild(toolbar);
    hlToolbar = toolbar;

    const r = toolbar.getBoundingClientRect();
    if (r.right > window.innerWidth) toolbar.style.left = `${x - r.width}px`;
    if (r.top < 0) toolbar.style.top = `${y + 10}px`;
}

// ── Orduppslagning ─────────────────────────────────────────────────────────

function visaLookupLadd(x, y, word) {
    document.getElementById("ar-lookup-popup")?.remove();
    const popup = document.createElement("div");
    popup.id = "ar-lookup-popup";
    popup.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#1a1610;color:#f5f0e8;padding:12px 14px;border-radius:8px;font-family:'DM Mono',monospace;font-size:13px;max-width:260px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.5);line-height:1.5;border:1px solid #333;`;
    popup.innerHTML = `<div style="font-weight:600;margin-bottom:8px;">${DOMPurify.sanitize(word)}</div><div><span class="ar-tänker-dot"></span><span class="ar-tänker-dot"></span><span class="ar-tänker-dot"></span></div>`;
    document.body.appendChild(popup);
}

function visaLookupPopup(x, y, word, definition) {
    document.getElementById("ar-lookup-popup")?.remove();
    const popup = document.createElement("div");
    popup.id = "ar-lookup-popup";
    popup.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#1a1610;color:#f5f0e8;padding:12px 14px;border-radius:8px;font-family:'DM Mono',monospace;font-size:13px;max-width:260px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.5);line-height:1.5;border:1px solid #333;`;
    const stäng = document.createElement("button");
    stäng.textContent = "×";
    stäng.style.cssText = "position:absolute;top:6px;right:8px;background:transparent;border:none;color:#f5f0e8;opacity:0.4;cursor:pointer;font-size:16px;line-height:1;";
    stäng.addEventListener("click", () => popup.remove());
    const rubrik = document.createElement("div");
    rubrik.style.cssText = "font-weight:600;margin-bottom:6px;padding-right:16px;color:#f0c040;";
    rubrik.textContent = word;
    const textEl = document.createElement("div");
    textEl.textContent = definition;
    popup.append(stäng, rubrik, textEl);
    document.body.appendChild(popup);
    setTimeout(() => { document.addEventListener("mousedown", () => popup.remove(), { once: true }); }, 100);
}

// ── Initiera alla listeners ────────────────────────────────────────────────

export function initHighlight() {
    let lookupKnapp = null;

    const lookupTargets = [
        document.getElementById("meddelanden"),
        document.getElementById("input")
    ];

    lookupTargets.forEach(target => target.addEventListener("mouseup", (e) => {
        if (e.target === lookupKnapp || e.target.closest?.("#ar-lookup-popup")) return;
        lookupKnapp?.remove();
        lookupKnapp = null;

        let text, rect;
        if (e.currentTarget.tagName === "TEXTAREA") {
            const ta = e.currentTarget;
            text = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
            if (!text || text.length > 300) return;
            rect = ta.getBoundingClientRect();
        } else {
            const urval = window.getSelection();
            if (!urval || urval.isCollapsed) return;
            text = urval.toString().trim().replace(/\s+/g, " ");
            if (!text || text.length > 300) return;
            rect = urval.getRangeAt(0).getBoundingClientRect();
        }

        const knapp = document.createElement("button");
        knapp.textContent = "?";
        const knappLeft = e.currentTarget.tagName === "TEXTAREA"
            ? rect.right - 28
            : Math.min(rect.right + 6, window.innerWidth - 36);
        const knappTop = e.currentTarget.tagName === "TEXTAREA"
            ? rect.top - 28
            : rect.top - 4;
        knapp.style.cssText = `
            position:fixed;
            left:${knappLeft}px;
            top:${knappTop}px;
            background:#1a1610;color:#f0c040;
            border:1px solid #f0c040;border-radius:50%;
            width:22px;height:22px;font-size:13px;font-weight:700;
            cursor:pointer;z-index:9998;padding:0;line-height:1;
            font-family:sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.4);
        `;
        document.body.appendChild(knapp);
        lookupKnapp = knapp;

        knapp.addEventListener("click", async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const knappRect = knapp.getBoundingClientRect();
            knapp.remove();
            lookupKnapp = null;

            const x = Math.min(knappRect.right + 8, window.innerWidth - 280);
            const y = Math.min(knappRect.bottom + 8, window.innerHeight - 120);

            visaLookupLadd(x, y, text);

            try {
                const resp = await fetch("https://annotated-reader-backend.vercel.app/api/word-lookup-free", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ word: text, lang: S.t?.datumLocale?.split("-")[0] || "en" })
                });
                const data = await resp.json();
                if (data.definition) {
                    visaLookupPopup(x, y, text, data.definition);
                } else {
                    document.getElementById("ar-lookup-popup")?.remove();
                }
            } catch {
                document.getElementById("ar-lookup-popup")?.remove();
            }
        });
    }));

    document.addEventListener("mousedown", (e) => {
        if (e.target === lookupKnapp) return;
        lookupKnapp?.remove();
        lookupKnapp = null;
    });

    // Highlight: textmarkering i chattbubblor
    document.getElementById("meddelanden")?.addEventListener("mouseup", (e) => {
        setTimeout(() => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

            const node = sel.anchorNode;
            if (!node) return;
            const bubbla = node.parentElement?.closest?.(".bubbla");
            if (!bubbla) return;

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            visaHlToolbar(rect.left, rect.top);
        }, 10);
    });

    // Klick på befintlig highlight — ta bort
    document.getElementById("meddelanden")?.addEventListener("click", (e) => {
        const hl = e.target.closest(".aiuda-hl");
        if (!hl) return;
        const parent = hl.parentNode;
        while (hl.firstChild) parent.insertBefore(hl.firstChild, hl);
        parent.removeChild(hl);
        taBortHlToolbar();
    });

    // Stäng toolbar vid klick utanför
    document.addEventListener("mousedown", (e) => {
        if (hlToolbar && !hlToolbar.contains(e.target)) taBortHlToolbar();
    });
}
