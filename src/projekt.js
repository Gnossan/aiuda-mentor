// src/projekt.js — projektlista, val, radering, nytt projekt

import { S } from "./state.js";
import { kryptera, dekryptera } from "./kryptering.js";
import { laggTillBubbla } from "./ui.js";
import { laddaAnteckningarOchTasks, renderaKällor, renderaLäslogg, laddaLogg } from "./notat.js";
import { sparaHistorik } from "./session.js";
import { återställBokmärke, återställKontrast } from "./bokmärke.js";
import { setLäslogg } from "./state.js";
import { byggSystemprompt, startaKonversation } from "./chatt.js";

// ── Projektlista ───────────────────────────────────────────────────────────

export async function laddaProjektlista() {
    const svar = await chrome.runtime.sendMessage({ type: "LIST_PROJEKT" });
    const lista = document.getElementById("projekt-liste");

    if (!svar?.projekt?.length) {
        lista.innerHTML = `<div style="padding:12px 16px;font-size:11px;opacity:0.3;">Inga projekt ännu.</div>`;
        return;
    }

    const projekt = await Promise.all(svar.projekt.map(async p => {
        if (p.krypteradMetadata && S.krypteringsNyckel) {
            try {
                const meta = await dekryptera(p.krypteradMetadata);
                if (meta) return { ...p, namn: meta.namn, fraga: meta.fraga };
            } catch { /* fallback */ }
        }
        return p;
    }));

    lista.innerHTML = DOMPurify.sanitize(projekt.map(p => `
        <div class="projekt-item" data-id="${p.id}" data-namn="${encodeURIComponent(p.namn)}" data-fraga="${encodeURIComponent(p.fraga)}">
            <div class="projekt-item-namn">${p.namn || p.fraga.slice(0, 35)}</div>
            <div class="projekt-item-fraga">${p.fraga}</div>
        </div>
    `).join(""));

    lista.querySelectorAll(".projekt-item").forEach(el => {
        el.addEventListener("click", () => {
            lista.querySelectorAll(".projekt-item").forEach(e => e.classList.remove("aktiv"));
            el.classList.add("aktiv");
            öppnaProjekt({
                id: el.dataset.id,
                projektId: el.dataset.id,
                namn: decodeURIComponent(el.dataset.namn),
                fraga: decodeURIComponent(el.dataset.fraga)
            });
        });

        el.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            visaProjektMeny(el, decodeURIComponent(el.dataset.namn), decodeURIComponent(el.dataset.fraga), el.dataset.id);
        });
    });
}

function visaProjektMeny(el, namn, fraga, id) {
    document.getElementById("projekt-meny")?.remove();

    const meny = document.createElement("div");
    meny.id = "projekt-meny";
    meny.style.cssText = `position:fixed;background:#2a2218;border:1px solid #444;border-radius:6px;padding:4px 0;font-size:12px;z-index:9999;min-width:140px;box-shadow:0 4px 12px rgba(0,0,0,0.4);`;

    const rect = el.getBoundingClientRect();
    meny.style.left = rect.right + 4 + "px";
    meny.style.top = rect.top + "px";

    const döpOmKnapp = document.createElement("div");
    döpOmKnapp.textContent = "✏ Döp om";
    döpOmKnapp.style.cssText = "padding:8px 14px;cursor:pointer;color:#f5f0e8;";
    döpOmKnapp.onmouseover = () => döpOmKnapp.style.background = "rgba(255,255,255,0.07)";
    döpOmKnapp.onmouseout = () => döpOmKnapp.style.background = "";
    döpOmKnapp.addEventListener("click", () => { meny.remove(); döpOmProjekt(id, namn, fraga); });

    const raderaKnapp = document.createElement("div");
    raderaKnapp.textContent = "🗑 Radera";
    raderaKnapp.style.cssText = "padding:8px 14px;cursor:pointer;color:#ff6b6b;";
    raderaKnapp.onmouseover = () => raderaKnapp.style.background = "rgba(255,255,255,0.07)";
    raderaKnapp.onmouseout = () => raderaKnapp.style.background = "";
    raderaKnapp.addEventListener("click", () => { meny.remove(); raderaProjekt(id, namn); });

    meny.append(döpOmKnapp, raderaKnapp);
    document.body.appendChild(meny);
    setTimeout(() => document.addEventListener("click", () => meny.remove(), { once: true }), 0);
}

async function döpOmProjekt(id, gammaltNamn, fraga) {
    const nyttNamn = await new Promise(resolve => {
        const ov = document.createElement("div");
        ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;";
        ov.innerHTML = `
            <div style="background:#1a1610;border:1px solid #444;border-radius:10px;padding:24px;width:320px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="font-weight:600;margin-bottom:12px;color:#f0c040;">✏ Döp om projekt</div>
                <input id="döp-om-input" type="text" value="${gammaltNamn}" style="width:100%;padding:8px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:12px;box-sizing:border-box;">
                <div style="display:flex;gap:8px;">
                    <button id="döp-om-ok" style="flex:1;padding:9px;background:#f0c040;color:#1a1610;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-family:inherit;">Spara</button>
                    <button id="döp-om-avbryt" style="flex:1;padding:9px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:5px;cursor:pointer;font-family:inherit;">Avbryt</button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        const input = ov.querySelector("#döp-om-input");
        input.focus(); input.select();
        ov.querySelector("#döp-om-ok").addEventListener("click", () => { ov.remove(); resolve(input.value.trim()); });
        ov.querySelector("#döp-om-avbryt").addEventListener("click", () => { ov.remove(); resolve(null); });
        input.addEventListener("keydown", e => { if (e.key === "Enter") { ov.remove(); resolve(input.value.trim()); } });
    });

    if (!nyttNamn || nyttNamn === gammaltNamn) return;
    if (S.aktivtProjekt?.id === id) {
        S.aktivtProjekt.namn = nyttNamn;
        document.getElementById("projekt-namn-chatt").textContent = nyttNamn;
        byggSystemprompt();
    }
    if (S.krypteringsNyckel) {
        const krypteradMetadata = await kryptera({ namn: nyttNamn, fraga });
        chrome.runtime.sendMessage({ type: "SAVE_HISTORIK", data: { projektId: id, krypteradMetadata } });
    }
    await laddaProjektlista();
}

async function raderaProjekt(id, namn) {
    const bekräftad = await new Promise(resolve => {
        const ov = document.createElement("div");
        ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;";
        ov.innerHTML = `
            <div style="background:#1a1610;border:1px solid #444;border-radius:10px;padding:24px;width:320px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="font-weight:600;margin-bottom:8px;color:#ff6b6b;">🗑 Radera projekt</div>
                <p style="opacity:0.8;margin-bottom:16px;">Radera <strong>${namn || id}</strong>?<br>Det går inte att ångra.</p>
                <div style="display:flex;gap:8px;">
                    <button id="radera-ok" style="flex:1;padding:9px;background:#ff6b6b;color:#fff;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-family:inherit;">Radera</button>
                    <button id="radera-avbryt" style="flex:1;padding:9px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:5px;cursor:pointer;font-family:inherit;">Avbryt</button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        ov.querySelector("#radera-ok").addEventListener("click", () => { ov.remove(); resolve(true); });
        ov.querySelector("#radera-avbryt").addEventListener("click", () => { ov.remove(); resolve(false); });
    });

    if (!bekräftad) return;
    await chrome.runtime.sendMessage({ type: "DELETE_PROJEKT", projektId: id });
    if (S.aktivtProjekt?.id === id) {
        S.aktivtProjekt = null;
        S.historik = [];
        S.bubblaNummer = 0;
        S.bokmärke = null;
        S.kontrastKarta = {};
        document.querySelector(".aiuda-bm-marker")?.remove();
        document.getElementById("bokmärk-hopp").style.display = "none";
        document.getElementById("meddelanden").innerHTML = "";
        document.getElementById("meddelanden").style.display = "none";
        document.getElementById("input-area").style.display = "none";
        document.getElementById("spara-session").style.display = "none";
        document.getElementById("info-knapp").style.display = "none";
        document.getElementById("välkommen").style.display = "flex";
    }
    await laddaProjektlista();
}

// ── Öppna projekt ──────────────────────────────────────────────────────────

export async function öppnaProjekt(projekt) {
    S.sessionId = projekt.id;
    S.aktivtProjekt = projekt;
    S.sessionKällor = [];
    renderaKällor();
    setLäslogg([]);
    renderaLäslogg();
    S.nuvarandeSessionId = "session_" + Date.now();

    document.getElementById("projekt-namn-chatt").textContent = projekt.namn || projekt.fraga.slice(0, 40);
    document.getElementById("projekt-fraga-chatt").textContent = projekt.fraga;
    document.getElementById("välkommen").style.display = "none";
    document.getElementById("ny-fraga-panel").style.display = "none";
    document.getElementById("meddelanden").style.display = "flex";
    document.getElementById("input-area").style.display = "flex";
    document.getElementById("spara-session").style.display = "inline-block";
    document.getElementById("testa-mig-knapp").style.display = "inline-block";
    document.getElementById("info-knapp").style.display = "inline-block";
    document.getElementById("info-projekt-id").textContent = S.sessionId;
    document.getElementById("info-session-id").textContent = S.nuvarandeSessionId;

    byggSystemprompt();

    await laddaAnteckningarOchTasks();

    document.getElementById("meddelanden").innerHTML = "";
    S.bubblaNummer = 0;
    S.bokmärke = null;
    S.kontrastKarta = {};
    document.getElementById("bokmärk-hopp").style.display = "none";
    let laddadHistorik = null;
    let laddadFrånFirebase = false;

    const sparadLokal = await chrome.storage.local.get(S.sessionId);
    S.bokmärke = sparadLokal[S.sessionId]?.bokmärke || null;
    S.kontrastKarta = sparadLokal[S.sessionId]?.kontrastKarta || {};

    try {
        const fjärr = await chrome.runtime.sendMessage({ type: "LOAD_HISTORIK", projektId: S.sessionId });
        if (fjärr?.krypteradHistorik && S.krypteringsNyckel) {
            const dekrypterad = await dekryptera(fjärr.krypteradHistorik);
            if (dekrypterad) { laddadHistorik = dekrypterad; laddadFrånFirebase = true; }
        }
    } catch {}

    if (!laddadHistorik) {
        laddadHistorik = sparadLokal[S.sessionId]?.historik || null;
    }

    if (laddadHistorik?.length > 0) {
        S.historik = laddadHistorik;
        S.sessionStartIndex = S.historik.length;
        if (!laddadFrånFirebase) sparaHistorik(true);
        S.historik.forEach(msg => {
            if (msg.silent) return;
            const text = typeof msg.content === "string" ? msg.content : msg.content[0]?.text || "";
            laggTillBubbla(msg.role, text, false, msg.tid || null);
        });
        document.getElementById("meddelanden").scrollTop = document.getElementById("meddelanden").scrollHeight;
        if (S.bokmärke) återställBokmärke();
        återställKontrast();
    } else {
        S.historik = [];
        S.sessionStartIndex = 0;
        await startaKonversation();
    }

    laddaLogg();
}

// ── Nytt projekt ───────────────────────────────────────────────────────────

export async function starta() {
    const fraga = document.getElementById("fraga-input").value.trim();
    const namn = document.getElementById("projekt-namn-input").value.trim() || fraga.slice(0, 40);
    if (!fraga) return;

    const projektId = "projekt_" + Date.now();
    S.aktivtProjekt = { id: projektId, projektId, namn, fraga };

    chrome.storage.local.set({
        researchFraga: fraga, researchSessionId: projektId,
        researchProjektId: projektId, researchProjektNamn: namn, researchAktiv: true
    });

    document.getElementById("ny-fraga-panel").style.display = "none";
    document.getElementById("fraga-input").value = "";
    document.getElementById("projekt-namn-input").value = "";

    öppnaProjekt(S.aktivtProjekt);
    await laddaProjektlista();
}
