// src/mentor.js — Entry point för AIuda Mentor

import { S } from "./state.js";
import { laddaEllerSkapaNyckel, visaLösenordsDialog, registreraLaggTillBubbla } from "./kryptering.js";
import { uppdateraXPVisning } from "./xp.js";
import { laggTillBubbla } from "./ui.js";
import { initBokmärke, sättBokmärke, getCharOffset } from "./bokmärke.js";
import { initHighlight } from "./highlight.js";
import { initResizerFrånStorage } from "./resize.js";
import { laddaAnteckningarOchTasks, läggTillTask, renderaTasks, sparaAnteckningarOchTasks, läggTillKälla, renderaLäslogg, sparaLäslogg, laddaLogg } from "./notat.js";
import { sparaMentorSession, sparaHistorik } from "./session.js";
import { laddaProjektlista, öppnaProjekt, starta } from "./projekt.js";
import { byggSystemprompt, skicka, initQuiz, initAvbryt } from "./chatt.js";
import { läslogg, setLäslogg } from "./state.js";

// Registrera laggTillBubbla så kryptering.js kan använda det (undviker cirkulär import)
registreraLaggTillBubbla(laggTillBubbla);

// ── Modell-knappar ─────────────────────────────────────────────────────────

const MODELLER = [
    { id: "claude-sonnet-4-6",          label: "S", titel: "Sonnet (standard)" },
    { id: "claude-haiku-4-5-20251001",   label: "H", titel: "Haiku (snabb)" },
    { id: "claude-opus-4-8",             label: "O", titel: "Opus (djupast — kan timeout:a)" }
];

function uppdateraModellKnapp() {
    const knapp = document.getElementById("modell-knapp");
    const m = MODELLER.find(m => m.id === S.valdModell) || MODELLER[0];
    knapp.textContent = m.label;
    knapp.title = m.titel;
    knapp.style.color = m.label === "O" ? "#ff9944" : "";
}

function visaOpusVarning(onOk) {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;";
    ov.innerHTML = `
        <div style="background:#1a1610;border:1px solid #555;border-radius:10px;padding:24px;width:320px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.7;">
            <div style="font-weight:600;margin-bottom:10px;color:#ff9944;">⚠ Opus — kraftfullare men långsammare</div>
            <p style="opacity:0.8;margin-bottom:16px;">Opus ger djupare och mer nyanserade svar, men kan timeout:a vid långa konversationer (60s gräns på servern).</p>
            <p style="opacity:0.6;font-size:11px;margin-bottom:16px;">Rekommenderas för kortare sessioner eller när samtalskvaliteten är viktigare än svarstiden.</p>
            <div style="display:flex;gap:8px;">
                <button id="opus-ok" style="flex:1;padding:9px;background:#ff9944;color:#1a1610;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-family:inherit;">Använd Opus</button>
                <button id="opus-avbryt" style="flex:1;padding:9px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:5px;cursor:pointer;font-family:inherit;">Avbryt</button>
            </div>
        </div>`;
    document.body.appendChild(ov);
    ov.querySelector("#opus-ok").addEventListener("click", () => { ov.remove(); onOk(); });
    ov.querySelector("#opus-avbryt").addEventListener("click", () => { ov.remove(); });
}

document.getElementById("modell-knapp").addEventListener("click", () => {
    const index = MODELLER.findIndex(m => m.id === S.valdModell);
    const nästa = MODELLER[(index + 1) % MODELLER.length];

    if (nästa.label === "O") {
        visaOpusVarning(() => {
            S.valdModell = nästa.id;
            chrome.storage.local.set({ mentorModell: S.valdModell });
            uppdateraModellKnapp();
        });
    } else {
        S.valdModell = nästa.id;
        chrome.storage.local.set({ mentorModell: S.valdModell });
        uppdateraModellKnapp();
    }
});

// ── Språk & tema ───────────────────────────────────────────────────────────

const SPRAK_ORDNING = ["sv", "en", "en-GB", "de", "fr", "es", "it", "no", "da"];

function tillampaSprak(nyT) {
    S.t = nyT;
    const el = (id) => document.getElementById(id);
    if (el("login-text"))           el("login-text").textContent       = S.t.mentorLoggaIn || "";
    if (el("login-knapp"))          el("login-knapp").textContent      = S.t.mentorLoggaInKnapp || "Logga in";
    if (el("välkommen-rubrik"))     el("välkommen-rubrik").innerHTML   = (S.t.mentorVälkommen || "Välkommen till AIuda Mentor™") + '<sup style="font-size:8px;opacity:0.5;vertical-align:super;">™</sup>';
    if (el("välkommen-beskrivning"))el("välkommen-beskrivning").innerHTML = (S.t.mentorVäljProjekt || "").replace("\n","<br>");
    if (el("nytt-projekt-rubrik"))  el("nytt-projekt-rubrik").textContent  = S.t.mentorNyttProjekt || "Nytt projekt";
    if (el("projekt-namn-input"))   el("projekt-namn-input").placeholder   = S.t.mentorProjektnamn || "Projektnamn";
    if (el("fraga-input"))          el("fraga-input").placeholder          = S.t.mentorFrageställning || "Din frågeställning…";
    if (el("starta-knapp"))         el("starta-knapp").textContent         = S.t.mentorStarta || "Starta →";
    if (el("input"))                el("input").placeholder                = S.t.mentorStällFraga || "Ställ en fråga…";
    if (el("flik-notat"))           el("flik-notat").textContent           = S.t.mentorNotat || "📝 Notat";
    if (el("flik-tasks"))           el("flik-tasks").textContent           = S.t.mentorTasks || "✅ Tasks";
    if (el("flik-källor"))          el("flik-källor").textContent          = S.t.mentorKällor || "🔗 Källor";
    if (el("flik-läst"))            el("flik-läst").textContent            = S.t.mentorLäst || "📖 Läst";
    if (el("flik-logg"))            el("flik-logg").textContent            = S.t.mentorLogg || "📋 Logg";
    if (el("spara-anteckningar"))   el("spara-anteckningar").textContent   = S.t.mentorSpara || "Spara";
    if (el("nytt-projekt-knapp"))   el("nytt-projekt-knapp").textContent   = "＋ " + (S.t.mentorNyttProjekt || "Nytt projekt");
}

document.getElementById("sprak-knapp").addEventListener("click", () => {
    const nuvarandeLang = Object.keys(AR_LOCALES).find(k => AR_LOCALES[k] === S.t) || "sv";
    const index = SPRAK_ORDNING.indexOf(nuvarandeLang);
    const nästaLang = SPRAK_ORDNING[(index + 1) % SPRAK_ORDNING.length];
    chrome.storage.local.set({ lang: nästaLang });
    tillampaSprak(AR_LOCALES[nästaLang] || AR_LOCALES.sv);
    document.getElementById("sprak-knapp").title = nästaLang;
});

function tillampaTemat(tema) {
    const ljust = tema === "ljust";
    document.body.classList.toggle("ljust", ljust);
    document.getElementById("tema-knapp").textContent = ljust ? "🌙" : "☀";
}

// ── Init (ladda inställningar, starta auth-flöde) ──────────────────────────

chrome.storage.local.get(["lang", "tema", "arToken", "arUser", "mentorModell", "mentorXP"], async (result) => {
    const valtSprak = AR_LOCALES[result.lang] || AR_LOCALES.sv;
    if (result.mentorModell) S.valdModell = result.mentorModell;
    if (result.mentorXP) { S.totalXP = result.mentorXP; uppdateraXPVisning(); }
    uppdateraModellKnapp();
    tillampaTemat(result.tema || "mörkt");
    if (!result.arToken) {
        document.getElementById("login-vy").style.display = "flex";
        document.getElementById("välkommen").style.display = "none";
        tillampaSprak(valtSprak);
        return;
    }

    tillampaSprak(valtSprak);

    const email = result.arUser?.email || null;
    await laddaEllerSkapaNyckel(email);
    await laddaProjektlista();
});

document.getElementById("login-knapp")?.addEventListener("click", () => {
    chrome.tabs.create({ url: `https://annotated-reader-backend.vercel.app/auth.html?ext_id=${chrome.runtime.id}` });
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.arToken?.newValue) {
        document.getElementById("login-vy").style.display = "none";
        document.getElementById("välkommen").style.display = "flex";
        laddaProjektlista();
    }
});

// ── Flikar ─────────────────────────────────────────────────────────────────

document.querySelectorAll(".flik").forEach(flik => {
    flik.addEventListener("click", () => {
        document.querySelectorAll(".flik").forEach(f => f.classList.remove("aktiv"));
        document.querySelectorAll(".flik-vy").forEach(v => v.classList.remove("aktiv"));
        flik.classList.add("aktiv");
        document.getElementById(`vy-${flik.dataset.flik}`).classList.add("aktiv");
    });
});

// ── Anteckningar & tasks-knappar ───────────────────────────────────────────

document.getElementById("spara-anteckningar").addEventListener("click", async () => {
    await sparaAnteckningarOchTasks(true);
    const knapp = document.getElementById("spara-anteckningar");
    knapp.textContent = "Sparat ✓";
    knapp.classList.add("sparad");
    setTimeout(() => { knapp.textContent = "Spara"; knapp.classList.remove("sparad"); }, 1500);
});

let anteckningarTimeout;
document.getElementById("anteckningar-area").addEventListener("input", () => {
    clearTimeout(anteckningarTimeout);
    anteckningarTimeout = setTimeout(sparaAnteckningarOchTasks, 1500);
});

document.getElementById("lägg-till-task").addEventListener("click", läggTillTask);
document.getElementById("ny-task-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); läggTillTask(); }
});

// ── Projekt-knappar ────────────────────────────────────────────────────────

document.getElementById("nytt-projekt-knapp").addEventListener("click", () => {
    document.getElementById("välkommen").style.display = "none";
    document.getElementById("ny-fraga-panel").style.display = "block";
    document.getElementById("spara-session").style.display = "none";
    document.getElementById("projekt-namn-input").focus();
});

document.getElementById("starta-knapp").addEventListener("click", starta);
document.getElementById("fraga-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); starta(); }
});

// ── Chatt-knappar ──────────────────────────────────────────────────────────

document.getElementById("skicka").addEventListener("click", () => skicka());
document.getElementById("skicka-kort").addEventListener("click", () => skicka(true));
initAvbryt();

const inputEl = document.getElementById("input");
inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + "px";

    const pos = inputEl.selectionStart;
    const text = inputEl.value;
    const radStart = text.lastIndexOf("\n", pos - 1) + 1;
    const radText = text.slice(radStart, pos);
    if (/^(\d+\.\s|-\s)$/.test(radText)) {
        inputEl.setRangeText("\t", radStart, radStart, "start");
        inputEl.selectionStart = inputEl.selectionEnd = pos + 1;
    }
});

inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); skicka(); return; }

    if (e.key === "Enter" && e.shiftKey) {
        const ta = inputEl;
        const pos = ta.selectionStart;
        const text = ta.value;
        const radStart = text.lastIndexOf("\n", pos - 1) + 1;
        const radText = text.slice(radStart, pos);

        const numMatch = radText.match(/^(\s*)(\d+)\.\s(.*)$/);
        const streckMatch = radText.match(/^(\s*)-\s(.*)$/);

        if (numMatch) {
            e.preventDefault();
            const indent = numMatch[1];
            const innehall = numMatch[3].trim();
            if (!innehall) {
                ta.setRangeText("\n", radStart, pos, "end");
            } else {
                ta.setRangeText(`\n${indent}${parseInt(numMatch[2]) + 1}. `, pos, pos, "end");
            }
            ta.style.height = "auto";
            ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
        } else if (streckMatch) {
            e.preventDefault();
            const indent = streckMatch[1];
            const innehall = streckMatch[2].trim();
            if (!innehall) {
                ta.setRangeText("\n", radStart, pos, "end");
            } else {
                ta.setRangeText(`\n${indent}- `, pos, pos, "end");
            }
            ta.style.height = "auto";
            ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
        }
    }
});

// ── Klistra in-hantering ───────────────────────────────────────────────────

window.addEventListener("paste", (e) => {
    const input = document.getElementById("input");
    const active = document.activeElement;
    if (!input || !S.aktivtProjekt || active?.tagName === "TEXTAREA" || active?.tagName === "INPUT") return;
    const text = e.clipboardData?.getData("text/plain") || "";
    if (!text) return;
    e.preventDefault();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
});

// ── Spara session ──────────────────────────────────────────────────────────

document.getElementById("spara-session").addEventListener("click", sparaMentorSession);

// ── Lägg till aktiv webbsida som källa ────────────────────────────────────

document.getElementById("lägg-till-sida").addEventListener("click", async () => {
    if (!S.aktivtProjekt) return;
    const knapp = document.getElementById("lägg-till-sida");
    knapp.textContent = "⏳";
    knapp.disabled = true;

    const svar = await chrome.runtime.sendMessage({ type: "GET_ACTIVE_TAB" });

    knapp.textContent = "📎";
    knapp.disabled = false;

    if (svar?.error || !svar?.url) {
        laggTillBubbla("assistant", "_Ingen aktiv webbsida hittades._");
        return;
    }

    const { url, title } = svar;
    läggTillKälla(title, url);
    laggTillBubbla("user", `📎 [${title}](${url})`);

    const kontext = `[Användaren har lagt till en webbsida som källa]\nTitel: ${title}\nURL: ${url}\n\nReferera till denna sida när det är relevant i konversationen.`;
    S.historik.push({ role: "user", content: kontext, silent: true });
    await sparaHistorik();
});

// ── Läslogg ────────────────────────────────────────────────────────────────

document.getElementById("lägg-till-läslogg").addEventListener("click", async () => {
    if (!S.aktivtProjekt) return;
    const knapp = document.getElementById("lägg-till-läslogg");
    knapp.textContent = "⏳";
    knapp.disabled = true;

    const svar = await chrome.runtime.sendMessage({ type: "GET_READER_ANNOTATION" });

    knapp.textContent = "📖";
    knapp.disabled = false;

    if (svar?.error || svar?.ej_annoterad) {
        laggTillBubbla("assistant", svar?.ej_annoterad
            ? "_Den aktiva sidan är inte annoterad med Reader ännu._"
            : "_Kunde inte hämta annotation — är Reader installerad och aktiv?_");
        return;
    }

    const { annotation, url, title } = svar;

    if (läslogg.some(e => e.url === url)) {
        laggTillBubbla("assistant", `_${title || url} finns redan i läsloggen._`);
        return;
    }

    const entry = {
        url,
        title: title || url,
        sammanfattning: annotation.sammanfattning || "",
        kategorier: annotation.kategorier || [],
        tid: new Date().toISOString()
    };

    setLäslogg([...läslogg, entry]);
    renderaLäslogg();
    setTimeout(sparaLäslogg, 2000);

    läggTillKälla(title, url);

    const kontext = `[Reader-annotation tillagd]\nSida: ${title}\nURL: ${url}\nSammanfattning: ${annotation.sammanfattning}\nKategorier: ${(annotation.kategorier || []).map(k => k.namn).join(", ")}\n\nAnvänd denna annotation som bakgrundskunskap i konversationen.`;
    S.historik.push({ role: "user", content: kontext, silent: true });
    await sparaHistorik();

    document.querySelectorAll(".flik").forEach(f => f.classList.remove("aktiv"));
    document.querySelectorAll(".flik-vy").forEach(v => v.classList.remove("aktiv"));
    document.querySelector("[data-flik='läslogg']").classList.add("aktiv");
    document.getElementById("vy-läslogg").classList.add("aktiv");
});

// ── Klick-hantering i meddelanden (bokmärke, länkar) ──────────────────────

document.getElementById("meddelanden").addEventListener("click", (e) => {
    const länk = e.target.closest("a");
    if (länk?.href) { e.preventDefault(); chrome.tabs.create({ url: länk.href }); return; }

    if (e.target.classList.contains("aiuda-bm-marker")) {
        sättBokmärke(-1, 0);
        return;
    }

    const bubbla = e.target.closest(".bubbla");
    if (!bubbla) return;
    if (e.target.closest(".aiuda-hl")) return;
    if (window.getSelection()?.toString().trim()) return;

    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (!range) return;
    const bubbleIdx = parseInt(bubbla.dataset.bubbleIdx);
    const charOffset = getCharOffset(bubbla, range);
    sättBokmärke(bubbleIdx, charOffset);
});

// ── Kryptering-knapp ───────────────────────────────────────────────────────

document.getElementById("kryptering-knapp").addEventListener("click", () => {
    chrome.storage.local.get("arUser", ({ arUser }) => visaLösenordsDialog(arUser?.email));
});

// ── Hjälp & info ───────────────────────────────────────────────────────────

document.getElementById("hjälp-knapp").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://aiuda.se/help.html" });
});

document.getElementById("info-knapp").addEventListener("click", (e) => {
    e.stopPropagation();
    const popup = document.getElementById("info-popup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", () => {
    document.getElementById("info-popup").style.display = "none";
});

// ── Tema-knapp ─────────────────────────────────────────────────────────────

document.getElementById("tema-knapp").addEventListener("click", () => {
    const ljust = document.body.classList.toggle("ljust");
    const tema = ljust ? "ljust" : "mörkt";
    document.getElementById("tema-knapp").textContent = ljust ? "🌙" : "☀";
    chrome.storage.local.set({ tema });
});

// ── Shift+scroll: textstorlek per fönsterdel ──────────────────────────────

const FONT_SEKTIONER_MENTOR = ["meddelanden", "projekt-liste", "anteckningar-area", "task-lista", "käll-lista", "läslogg-lista", "logg-lista"];
const FONT_MIN_M = 10, FONT_MAX_M = 22, FONT_DEFAULT_M = 13;

chrome.storage.local.get("mentorFontSizes", ({ mentorFontSizes = {} }) => {
    FONT_SEKTIONER_MENTOR.forEach(id => {
        const el = document.getElementById(id);
        if (el && mentorFontSizes[id]) el.style.fontSize = mentorFontSizes[id] + "px";
    });
});

document.addEventListener("wheel", (e) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const sektionEl = e.target.closest(FONT_SEKTIONER_MENTOR.map(id => "#" + id).join(", "));
    if (!sektionEl) return;
    const nuvarande = parseFloat(sektionEl.style.fontSize) || FONT_DEFAULT_M;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const ny = delta > 0
        ? Math.max(FONT_MIN_M, nuvarande - 1)
        : Math.min(FONT_MAX_M, nuvarande + 1);
    sektionEl.style.fontSize = ny + "px";
    chrome.storage.local.get("mentorFontSizes", ({ mentorFontSizes = {} }) => {
        chrome.storage.local.set({ mentorFontSizes: { ...mentorFontSizes, [sektionEl.id]: ny } });
    });
}, { passive: false });

// ── Initiera alla subsystem ────────────────────────────────────────────────

initBokmärke();
initHighlight();
initResizerFrånStorage();
initQuiz();
