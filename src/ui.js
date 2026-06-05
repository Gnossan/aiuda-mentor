// src/ui.js — bubbel- och UI-hjälpfunktioner

import { S } from "./state.js";
import DOMPurify from "dompurify";
import { marked } from "marked";

export function formateraBubblaTid(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const idag = new Date();
    const ärIdag = d.toDateString() === idag.toDateString();
    if (ärIdag) return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
        + " " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export function laggTillBubbla(roll, text, skrolla = true, tid = null) {
    const idx = S.bubblaNummer++;
    const div = document.createElement("div");
    div.className = `bubbla ${roll}`;
    div.dataset.bubbleIdx = idx;
    if (roll === "assistant") div.innerHTML = DOMPurify.sanitize(marked.parse(text));
    else div.textContent = text;

    const container = document.getElementById("meddelanden");
    container.appendChild(div);

    if (tid) {
        const tidEl = document.createElement("div");
        tidEl.className = "bubbla-tid";
        tidEl.textContent = formateraBubblaTid(tid);
        container.appendChild(tidEl);
    }

    if (skrolla) {
        if (roll === "assistant") div.scrollIntoView({ behavior: "smooth", block: "start" });
        else container.scrollTop = container.scrollHeight;
    }
}

export function visaTänker() {
    const div = document.createElement("div");
    div.className = "ar-tänker";
    div.innerHTML = "<span></span><span></span><span></span>";
    const container = document.getElementById("meddelanden");
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}
