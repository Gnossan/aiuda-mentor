// src/main.js — Entry point för AIuda Mentor (webapp)

import { S } from "./state.js";
import { auth, onAuth, loggaIn, loggaUt, hämtaToken } from "./auth.js";
import { laddaEllerSkapaNyckel, visaLösenordsDialog, registreraLaggTillBubbla } from "./kryptering.js";
import { uppdateraXPVisning } from "./xp.js";
import { laggTillBubbla } from "./ui.js";
import { initBokmärke, sättBokmärke, getCharOffset } from "./bokmärke.js";
import { initHighlight } from "./highlight.js";
import { initResizerFrånStorage } from "./resize.js";
import { laddaAnteckningarOchTasks, läggTillTask, sparaAnteckningarOchTasks, läggTillKälla, renderaLäslogg, sparaLäslogg, laddaLogg } from "./notat.js";
import { sparaMentorSession, sparaHistorik } from "./session.js";
import { laddaProjektlista, öppnaProjekt, starta } from "./projekt.js";
import { byggSystemprompt, skicka, initQuiz, initAvbryt } from "./chatt.js";
import { läslogg, setLäslogg } from "./state.js";
import { hämtaReaderAnnotation } from "./api.js";

// Registrera laggTillBubbla så kryptering.js kan använda det
registreraLaggTillBubbla(laggTillBubbla);

// Modell är låst till Sonnet
S.valdModell = "claude-sonnet-4-6";

// ── Språkbyte ──────────────────────────────────────────────────────────────

const SPRAK = ["sv", "en", "en-GB", "da", "de", "es", "fr", "it", "no"];

function tillampaSprak(t) {
    S.t = t;
    document.getElementById("välkommen-rubrik")?.setAttribute("data-i18n", "");
    // Uppdatera alla element med data-i18n-attribut
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const nyckel = el.dataset.i18n;
        if (t[nyckel]) el.textContent = t[nyckel];
    });
    document.title = "AIuda Mentor™";
}

document.getElementById("sprak-knapp")?.addEventListener("click", () => {
    const idx = SPRAK.indexOf(localStorage.getItem("lang") || "sv");
    const nästaLang = SPRAK[(idx + 1) % SPRAK.length];
    localStorage.setItem("lang", nästaLang);
    tillampaSprak(AR_LOCALES[nästaLang] || AR_LOCALES.sv);
    document.getElementById("sprak-knapp").title = nästaLang;
});

function tillampaTemat(tema) {
    const ljust = tema === "ljust";
    document.body.classList.toggle("ljust", ljust);
    document.getElementById("tema-knapp").textContent = ljust ? "🌙" : "☀";
}

// ── Auth via Firebase ──────────────────────────────────────────────────────

onAuth(async (user) => {
    if (!user) {
        document.getElementById("login-vy").style.display = "flex";
        document.getElementById("välkommen").style.display = "none";
        return;
    }

    document.getElementById("login-vy").style.display = "none";
    document.getElementById("välkommen").style.display = "flex";

    await laddaEllerSkapaNyckel(user.email);
    await laddaProjektlista();
});

document.getElementById("login-knapp")?.addEventListener("click", () => loggaIn());
document.getElementById("logga-ut-knapp")?.addEventListener("click", () => loggaUt());

// ── Init inställningar ─────────────────────────────────────────────────────

const mentorXP = parseInt(localStorage.getItem("mentorXP") || "0");
const tema = localStorage.getItem("tema") || "mörkt";
const lang = localStorage.getItem("lang") || "sv";

S.totalXP = mentorXP;
uppdateraXPVisning();
tillampaTemat(tema);
tillampaSprak(AR_LOCALES[lang] || AR_LOCALES.sv);

// Shift+scroll: textstorlek
const FONT_SEKTIONER_MENTOR = ["meddelanden", "projekt-liste", "anteckningar-area", "task-lista", "käll-lista", "läslogg-lista", "logg-lista", "chatt-header"];
const FONT_MIN_M = 10, FONT_MAX_M = 22, FONT_DEFAULT_M = 13;

const mentorFontSizes = JSON.parse(localStorage.getItem("mentorFontSizes") || "{}");
FONT_SEKTIONER_MENTOR.forEach(id => {
    const el = document.getElementById(id);
    if (el && mentorFontSizes[id]) el.style.fontSize = mentorFontSizes[id] + "px";
});

document.addEventListener("wheel", (e) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const sektionEl = e.target.closest(FONT_SEKTIONER_MENTOR.map(id => "#" + id).join(", "));
    if (!sektionEl) return;
    const nuvarande = parseFloat(sektionEl.style.fontSize) || FONT_DEFAULT_M;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const ny = delta > 0 ? Math.max(FONT_MIN_M, nuvarande - 1) : Math.min(FONT_MAX_M, nuvarande + 1);
    sektionEl.style.fontSize = ny + "px";
    const sizes = JSON.parse(localStorage.getItem("mentorFontSizes") || "{}");
    localStorage.setItem("mentorFontSizes", JSON.stringify({ ...sizes, [sektionEl.id]: ny }));
}, { passive: false });

// ── Flikar ─────────────────────────────────────────────────────────────────

document.querySelectorAll(".flik").forEach(flik => {
    flik.addEventListener("click", () => {
        document.querySelectorAll(".flik").forEach(f => f.classList.remove("aktiv"));
        document.querySelectorAll(".flik-vy").forEach(v => v.classList.remove("aktiv"));
        flik.classList.add("aktiv");
        document.getElementById(`vy-${flik.dataset.flik}`).classList.add("aktiv");
    });
});

// ── Anteckningar & tasks ───────────────────────────────────────────────────

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
});

inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); skicka(); }
});

// ── Spara session ──────────────────────────────────────────────────────────

document.getElementById("spara-session").addEventListener("click", sparaMentorSession);

// ── Lägg till URL som källa (ersätter GET_ACTIVE_TAB) ─────────────────────

document.getElementById("lägg-till-sida").addEventListener("click", async () => {
    if (!S.aktivtProjekt) return;

    // I webapp: fråga användaren om URL
    const url = prompt("Klistra in URL till sidan du vill lägga till:");
    if (!url || !url.startsWith("http")) return;

    const title = url;
    läggTillKälla(title, url);
    laggTillBubbla("user", `📎 [${title}](${url})`);

    const kontext = `[Användaren har lagt till en webbsida som källa]\nURL: ${url}\n\nReferera till denna sida när det är relevant i konversationen.`;
    S.historik.push({ role: "user", content: kontext, silent: true });
    await sparaHistorik();
});

// ── Läslogg (Reader-annotation via URL) ───────────────────────────────────

document.getElementById("lägg-till-läslogg").addEventListener("click", async () => {
    if (!S.aktivtProjekt) return;
    const knapp = document.getElementById("lägg-till-läslogg");

    const url = prompt("Klistra in URL till en sida du annoterat med AIuda Reader:");
    if (!url || !url.startsWith("http")) return;

    knapp.textContent = "⏳";
    knapp.disabled = true;

    const svar = await hämtaReaderAnnotation(url).catch(() => null);

    knapp.textContent = "📖";
    knapp.disabled = false;

    if (!svar?.found) {
        laggTillBubbla("assistant", "_Ingen Reader-annotation hittades för den URL:en._");
        return;
    }

    if (läslogg.some(e => e.url === url)) {
        laggTillBubbla("assistant", `_${svar.title || url} finns redan i läsloggen._`);
        return;
    }

    const entry = {
        url,
        title: svar.title || url,
        sammanfattning: svar.sammanfattning || "",
        kategorier: svar.kategorier || [],
        tid: new Date().toISOString()
    };

    setLäslogg([...läslogg, entry]);
    renderaLäslogg();
    setTimeout(sparaLäslogg, 2000);
    läggTillKälla(svar.title, url);

    const kontext = `[Reader-annotation tillagd]\nSida: ${svar.title}\nURL: ${url}\nSammanfattning: ${svar.sammanfattning}\nKategorier: ${(svar.kategorier || []).map(k => k.namn).join(", ")}\n\nAnvänd denna annotation som bakgrundskunskap i konversationen.`;
    S.historik.push({ role: "user", content: kontext, silent: true });
    await sparaHistorik();

    document.querySelectorAll(".flik").forEach(f => f.classList.remove("aktiv"));
    document.querySelectorAll(".flik-vy").forEach(v => v.classList.remove("aktiv"));
    document.querySelector("[data-flik='läslogg']").classList.add("aktiv");
    document.getElementById("vy-läslogg").classList.add("aktiv");
});

// ── Klick-hantering i meddelanden ─────────────────────────────────────────

document.getElementById("meddelanden").addEventListener("click", (e) => {
    const länk = e.target.closest("a");
    if (länk?.href) { e.preventDefault(); window.open(länk.href, "_blank"); return; }

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
    visaLösenordsDialog(auth.currentUser?.email);
});

// ── Hjälp & info ───────────────────────────────────────────────────────────

document.getElementById("hjälp-knapp").addEventListener("click", () => {
    window.open("https://aiuda.se/help.html", "_blank");
});

document.getElementById("info-knapp")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const popup = document.getElementById("info-popup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", () => {
    const popup = document.getElementById("info-popup");
    if (popup) popup.style.display = "none";
});

// ── Tema-knapp ─────────────────────────────────────────────────────────────

document.getElementById("tema-knapp").addEventListener("click", () => {
    const ljust = document.body.classList.toggle("ljust");
    const tema = ljust ? "ljust" : "mörkt";
    document.getElementById("tema-knapp").textContent = ljust ? "🌙" : "☀";
    localStorage.setItem("tema", tema);
});

// ── Stripe återvändo ───────────────────────────────────────────────────────

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("kop") === "ok") {
    history.replaceState({}, "", window.location.pathname);
    // Visa bekräftelse
    const banner = document.createElement("div");
    banner.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#2a3d1a;border:1px solid #5a8a3a;border-radius:6px;padding:10px 20px;font-family:'DM Mono',monospace;font-size:12px;color:#a0e070;z-index:9999;";
    banner.textContent = "✓ Betalning mottagen — 1 000 000 tokens tillagda";
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}

// ── Initiera subsystem ─────────────────────────────────────────────────────

initBokmärke();
initHighlight();
initResizerFrånStorage();
initQuiz();
