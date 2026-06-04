// src/notat.js — anteckningar, tasks, källor, läslogg

import { S } from "./state.js";
import { anteckningarSparade, setAnteckningarSparade, läslogg, setLäslogg } from "./state.js";
import { kryptera, dekryptera } from "./kryptering.js";
import { läggTillXP } from "./xp.js";
import { laggTillBubbla } from "./ui.js";

// ── Anteckningar & Tasks ───────────────────────────────────────────────────

export async function laddaAnteckningarOchTasks() {
    if (S.krypteringsNyckel) {
        try {
            const fjärr = await chrome.runtime.sendMessage({ type: "LOAD_ANTECKNINGAR", projektId: S.sessionId });
            if (fjärr?.krypteradAnteckningar) {
                const dekrypterad = await dekryptera(fjärr.krypteradAnteckningar);
                document.getElementById("anteckningar-area").value = dekrypterad.anteckningar || "";
                setAnteckningarSparade(dekrypterad.anteckningar || "");
                S.tasks = dekrypterad.tasks || [];
                renderaTasks();
                await chrome.storage.local.set({
                    [`anteckningar_${S.sessionId}`]: { anteckningar: dekrypterad.anteckningar || "", tasks: dekrypterad.tasks || [] }
                });
            }
            if (fjärr?.krypteradeKällor) {
                const dekKällor = await dekryptera(fjärr.krypteradeKällor);
                S.sessionKällor = (dekKällor || []).map(k => ({ ...k, tid: new Date(k.tid) }));
                renderaKällor();
            }
            if (fjärr?.krypteradLäslogg) {
                const dekLäslogg = await dekryptera(fjärr.krypteradLäslogg);
                setLäslogg(dekLäslogg || []);
                renderaLäslogg();
            }
            if (fjärr?.krypteradAnteckningar || fjärr?.krypteradeKällor || fjärr?.krypteradLäslogg) return;
        } catch (e) { console.warn("Firebase-laddning misslyckades:", e.message); }
    }

    const sparad = await chrome.storage.local.get(`anteckningar_${S.sessionId}`);
    const data = sparad[`anteckningar_${S.sessionId}`] || {};
    document.getElementById("anteckningar-area").value = data.anteckningar || "";
    setAnteckningarSparade(data.anteckningar || "");
    S.tasks = data.tasks || [];
    renderaTasks();
}

export async function sparaAnteckningarOchTasks(synkaFirebase = false) {
    const anteckningar = document.getElementById("anteckningar-area").value;
    await chrome.storage.local.set({
        [`anteckningar_${S.sessionId}`]: { anteckningar, tasks: S.tasks }
    });
    if (synkaFirebase && S.krypteringsNyckel) {
        try {
            const krypteradAnteckningar = await kryptera({ anteckningar, tasks: S.tasks });
            chrome.runtime.sendMessage({
                type: "SAVE_ANTECKNINGAR",
                data: { projektId: S.sessionId, krypteradAnteckningar }
            });
        } catch (e) { console.warn("Firebase-sync av anteckningar misslyckades:", e.message); }
    }
}

export function läggTillTask() {
    const input = document.getElementById("ny-task-input");
    const text = input.value.trim();
    if (!text || !S.aktivtProjekt) return;
    S.tasks.push({ id: Date.now(), text, klar: false });
    input.value = "";
    renderaTasks();
    sparaAnteckningarOchTasks(true);
}

export function renderaTasks() {
    const lista = document.getElementById("task-lista");
    if (!S.tasks.length) {
        lista.innerHTML = `<div style="padding:12px;font-size:11px;opacity:0.3;">${S.t?.mentorIngaTasks || "Inga tasks ännu"}</div>`;
        return;
    }

    lista.innerHTML = "";
    S.tasks.forEach(task => {
        const div = document.createElement("div");
        div.className = `task-item ${task.klar ? "klar" : ""}`;
        div.dataset.id = task.id;
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = task.klar;
        cb.id = `task-${task.id}`;
        const label = document.createElement("label");
        label.htmlFor = `task-${task.id}`;
        label.textContent = task.text;
        const btn = document.createElement("button");
        btn.className = "task-ta-bort";
        btn.dataset.id = task.id;
        btn.textContent = "✕";
        div.append(cb, label, btn);
        lista.appendChild(div);
    });

    lista.querySelectorAll("input[type=checkbox]").forEach(cb => {
        cb.addEventListener("change", () => {
            const id = parseInt(cb.closest(".task-item").dataset.id);
            const task = S.tasks.find(t => t.id === id);
            if (task) { task.klar = cb.checked; renderaTasks(); sparaAnteckningarOchTasks(true); }
        });
    });

    lista.querySelectorAll(".task-ta-bort").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            S.tasks = S.tasks.filter(t => t.id !== id);
            renderaTasks();
            sparaAnteckningarOchTasks(true);
        });
    });
}

// ── Källor ─────────────────────────────────────────────────────────────────

let källorTimeout;

export function läggTillKälla(titel, url) {
    if (!url || !url.startsWith("http")) return;
    if (S.sessionKällor.some(k => k.url === url)) return;
    S.sessionKällor.push({ titel: titel || url, url, tid: new Date() });
    renderaKällor();
    läggTillXP(2);
    clearTimeout(källorTimeout);
    källorTimeout = setTimeout(sparaKällor, 2000);
}

async function sparaKällor() {
    if (!S.krypteringsNyckel || !S.sessionId || !S.sessionKällor.length) return;
    try {
        const krypteradeKällor = await kryptera(S.sessionKällor.map(k => ({ ...k, tid: k.tid.toISOString() })));
        chrome.runtime.sendMessage({
            type: "SAVE_ANTECKNINGAR",
            data: { projektId: S.sessionId, krypteradeKällor }
        });
    } catch (e) { console.warn("Firebase-sync av källor misslyckades:", e.message); }
}

export function renderaKällor() {
    const lista = document.getElementById("käll-lista");
    if (!lista) return;
    if (!S.sessionKällor.length) {
        lista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">${S.t?.mentorIngaKällor || "Inga källor ännu"}</div>`;
        return;
    }
    lista.innerHTML = "";
    S.sessionKällor.forEach(k => {
        const div = document.createElement("div");
        div.className = "käll-entry";
        const titel = document.createElement("div");
        titel.className = "käll-titel";
        titel.textContent = k.titel;
        const url = document.createElement("div");
        url.className = "käll-url";
        url.textContent = k.url;
        url.title = k.url;
        url.addEventListener("click", () => chrome.tabs.create({ url: k.url }));
        const tid = document.createElement("div");
        tid.style.cssText = "font-size:10px;opacity:0.35;margin-top:2px;";
        tid.textContent = k.tid.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
            + " · " + k.tid.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
        div.append(titel, url, tid);
        lista.appendChild(div);
    });
}

export function extraheraKällorFrånText(text) {
    const mdReg = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = mdReg.exec(text)) !== null) {
        läggTillKälla(match[1], match[2]);
    }
}

// ── Läslogg ────────────────────────────────────────────────────────────────

let läsloggTimeout;

export function renderaLäslogg() {
    const lista = document.getElementById("läslogg-lista");
    if (!lista) return;
    const log = läslogg;  // from state
    if (!log.length) {
        lista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">Klicka 📖 för att lägga till annoterade sidor.</div>`;
        return;
    }
    lista.innerHTML = "";
    log.forEach(e => {
        const div = document.createElement("div");
        div.className = "logg-entry";
        const titel = document.createElement("div");
        titel.style.cssText = "font-weight:600;font-size:11px;margin-bottom:3px;";
        titel.textContent = e.title || e.url;
        const url = document.createElement("div");
        url.style.cssText = "font-size:10px;opacity:0.5;color:#f0c040;cursor:pointer;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
        url.textContent = e.url;
        url.addEventListener("click", () => chrome.tabs.create({ url: e.url }));
        const sammanfattning = document.createElement("div");
        sammanfattning.style.cssText = "font-size:11px;opacity:0.7;line-height:1.5;margin-bottom:4px;";
        sammanfattning.textContent = e.sammanfattning || "";
        const tid = document.createElement("div");
        tid.style.cssText = "font-size:10px;opacity:0.3;";
        tid.textContent = e.tid ? new Date(e.tid).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) + " " + new Date(e.tid).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "";
        const radera = document.createElement("button");
        radera.textContent = "✕";
        radera.style.cssText = "float:right;background:none;border:none;color:#f5f0e8;opacity:0.3;cursor:pointer;font-size:12px;padding:0;margin-left:6px;";
        radera.addEventListener("click", () => {
            setLäslogg(läslogg.filter(x => x.url !== e.url));
            renderaLäslogg();
            clearTimeout(läsloggTimeout);
            läsloggTimeout = setTimeout(sparaLäslogg, 2000);
        });
        titel.prepend(radera);
        div.append(titel, url, sammanfattning, tid);
        lista.appendChild(div);
    });
}

export async function sparaLäslogg() {
    if (!S.krypteringsNyckel || !S.sessionId || !läslogg.length) return;
    try {
        const krypteradLäslogg = await kryptera(läslogg);
        chrome.runtime.sendMessage({
            type: "SAVE_ANTECKNINGAR",
            data: { projektId: S.sessionId, krypteradLäslogg }
        });
    } catch (e) { console.warn("Firebase-sync av läslogg misslyckades:", e.message); }
}

// ── Logg ───────────────────────────────────────────────────────────────────

export async function laddaLogg() {
    const loggLista = document.getElementById("logg-lista");
    loggLista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">Hämtar logg…</div>`;

    const svar = await chrome.runtime.sendMessage({
        type: "GET_MENTOR_LOG",
        projektId: S.aktivtProjekt?.projektId || S.aktivtProjekt?.id
    });

    if (!svar?.entries?.length) {
        loggLista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">${S.t?.mentorIngaLogg || "Inga sparade sessioner ännu"}</div>`;
        return;
    }

    const poster = await Promise.all(svar.entries.map(async e => {
        let innehåll = { sammanfattning: "", nyckelord: [] };
        if (e.krypterat) {
            const dekrypterat = await dekryptera(e.krypterat);
            if (dekrypterat) innehåll = dekrypterat;
            else innehåll.sammanfattning = "🔐 Kan inte dekryptera";
        } else {
            innehåll = { sammanfattning: e.sammanfattning, nyckelord: e.nyckelord || [] };
        }
        return { ...e, ...innehåll };
    }));

    loggLista.innerHTML = DOMPurify.sanitize(poster.map(e => `
        <div class="logg-entry">
            <div class="logg-tidsstampel">${formateraLoggDatum(e.timestamp)}</div>
            <div class="logg-sammanfattning">${e.sammanfattning || ""}</div>
            ${e.nyckelord?.length ? `<div class="logg-nyckelord">${e.nyckelord.map(k => `<span>${k}</span>`).join("")}</div>` : ""}
        </div>
    `).join(""));
}

export function formateraLoggDatum(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
        + ", " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}
