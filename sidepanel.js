// AIuda Mentor — sidopanel
let historik = [];
let systemprompt = "";
let sessionId = null;      // Stabilt projekt-ID (historik-nyckel)
let aktivtProjekt = null;  // { id (=sessionId), projektId, namn, fraga }
let nuvarandeSessionId = "session_" + Date.now(); // Nytt per fönsteröppning
let t = AR_LOCALES.en;

// --- Init ---
chrome.storage.local.get(["lang", "tema", "fontSize", "researchSessionId", "researchFraga", "researchProjektNamn", "arToken"], (result) => {
    t = AR_LOCALES[result.lang] || AR_LOCALES.en;
    tillampaTemat(result.tema || "mörkt");
    tillampaFontSize(result.fontSize || 13);

    if (!result.arToken) {
        visaLoginVy();
        return;
    }

    if (result.researchSessionId && result.researchFraga) {
        aktivtProjekt = {
            id: result.researchSessionId,
            namn: result.researchProjektNamn || result.researchFraga.slice(0, 40),
            fraga: result.researchFraga
        };
        öppnaProjekt(aktivtProjekt);
    }
});

function visaLoginVy() {
    document.getElementById("login-vy").style.display = "flex";
    document.getElementById("login-vy").style.flexDirection = "column";
    document.getElementById("välkommen").style.display = "none";
}

document.getElementById("login-knapp").addEventListener("click", () => {
    const extId = chrome.runtime.id;
    chrome.tabs.create({ url: `https://annotated-reader-backend.vercel.app/auth.html?ext_id=${extId}` });
});

// Lyssna på login-bekräftelse och visa välkomstskärmen
chrome.storage.onChanged.addListener((changes) => {
    if (changes.arToken?.newValue) {
        document.getElementById("login-vy").style.display = "none";
        document.getElementById("välkommen").style.display = "flex";
        document.getElementById("välkommen").style.flexDirection = "column";
    }
});

// --- Tema ---
function tillampaTemat(tema) {
    document.body.classList.toggle("ljust", tema === "ljust");
    document.getElementById("tema-knapp").textContent = tema === "ljust" ? "🌙" : "☀";
}

function tillampaFontSize(size) {
    document.documentElement.style.setProperty("--ar-font-size", size + "px");
}

document.getElementById("tema-knapp").addEventListener("click", () => {
    const ljust = document.body.classList.toggle("ljust");
    document.getElementById("tema-knapp").textContent = ljust ? "🌙" : "☀";
    chrome.storage.local.set({ tema: ljust ? "ljust" : "mörkt" });
});

// --- Nytt projekt ---
function visaNyFragaPanel() {
    document.getElementById("välkommen").style.display = "none";
    document.getElementById("ny-fraga-panel").style.display = "block";
    document.getElementById("projekt-namn-input").focus();
}

document.getElementById("nytt-projekt-knapp").addEventListener("click", visaNyFragaPanel);
document.getElementById("nytt-projekt-header").addEventListener("click", visaNyFragaPanel);

document.getElementById("starta-knapp").addEventListener("click", starta);
document.getElementById("fraga-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); starta(); }
});

function starta() {
    const fraga = document.getElementById("fraga-input").value.trim();
    const namn = document.getElementById("projekt-namn-input").value.trim() || fraga.slice(0, 40);
    if (!fraga) return;

    const projektId = "projekt_" + Date.now();
    aktivtProjekt = { id: projektId, projektId, namn, fraga };

    chrome.storage.local.set({
        researchFraga: fraga,
        researchSessionId: projektId,
        researchProjektId: projektId,
        researchProjektNamn: namn,
        researchAktiv: true
    });

    document.getElementById("ny-fraga-panel").style.display = "none";
    document.getElementById("fraga-input").value = "";
    document.getElementById("projekt-namn-input").value = "";

    öppnaProjekt(aktivtProjekt);
}

// --- Öppna projekt ---
async function öppnaProjekt(projekt) {
    sessionId = projekt.id;
    aktivtProjekt = projekt;

    document.getElementById("välkommen").style.display = "none";
    document.getElementById("ny-fraga-panel").style.display = "none";
    document.getElementById("projekt-indikator").style.display = "block";
    document.getElementById("projekt-namn-text").textContent = projekt.namn;
    document.getElementById("projekt-fraga-text").textContent = projekt.fraga;
    document.getElementById("meddelanden").style.display = "flex";
    document.getElementById("input-area").style.display = "flex";
    document.getElementById("spara-session").style.display = "block";
    document.getElementById("visa-logg").style.display = "block";
    document.getElementById("sok-knapp").style.display = "block";

    byggSystemprompt();

    // Ladda historik
    document.getElementById("meddelanden").innerHTML = "";
    const sparad = await chrome.storage.local.get(sessionId);
    const sparadData = sparad[sessionId];

    if (sparadData?.historik?.length > 0) {
        historik = sparadData.historik;
        historik.forEach(msg => {
            if (msg.silent) return;
            const text = typeof msg.content === "string" ? msg.content : msg.content[0]?.text || "";
            laggTillBubbla(msg.role, text, false);
        });
        document.getElementById("meddelanden").scrollTop = document.getElementById("meddelanden").scrollHeight;
    } else {
        historik = [];
        await startaKonversation();
    }
}

function byggSystemprompt() {
    systemprompt = `You are an AI research assistant — AIuda Mentor. The user is researching: "${aktivtProjekt?.fraga}".

You have access to web search. When the user asks for links, sources or references, include [SEARCH: your optimized English search query] in your response — the system will perform a real web search and feed you the results, which you then present to the user. Never fabricate URLs.

Early in the session, help the user refine their research question:
- If the question is too broad, suggest concrete scope limitations
- If it's ambiguous, identify the ambiguity and propose a clearer formulation
- When proposing a revised question, format it as: **Revised research question:** "..."

Guidelines:
- Use [SEARCH: ...] when asked for external sources or links
- Formulate precise search queries for best results
- Evaluate search results for relevance before presenting them
- Users perceive provided links as AIuda-curated — be selective and explain why each source is relevant`;
}

// --- Meddelanden från background (t.ex. från Reader via cross-extension) ---
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "OPEN_PANEL" && message.research) {
        const projekt = {
            id: message.markeringId,
            namn: message.fraga?.slice(0, 40) || "Research",
            fraga: message.fraga || ""
        };
        öppnaProjekt(projekt);
        return;
    }

    if (message.type === "NY_KÄLLA" && aktivtProjekt) {
        const källText = `[Källa från ${message.url}]\n"${message.fras}"`;
        historik.push({ role: "user", content: källText, silent: true });
        sparaHistorik();
        laggTillBubbla("user", `📎 *${message.fras.slice(0, 80)}...*\n${message.url}`);
    }
});

// --- Starta konversation ---
async function startaKonversation() {
    const fraga = t.forklaraResearch || "I'm starting a research session. Please briefly introduce yourself as my research assistant and confirm my research question.";
    historik.push({ role: "user", content: fraga, silent: true });
    await sparaHistorik();

    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt, historik });
    const assistantText = await hanteraAISvar(svar, tänker);
    laggTillBubbla("assistant", assistantText);
    historik.push({ role: "assistant", content: assistantText });
    await sparaHistorik();
}

// --- Historik ---
async function sparaHistorik() {
    if (!sessionId) return;
    await chrome.storage.local.set({
        [sessionId]: { namn: aktivtProjekt?.namn, fraga: aktivtProjekt?.fraga, historik }
    });
}

// --- AI-svar med [SEARCH: ...]-hantering ---
async function hanteraAISvar(svar, tänker) {
    let assistantText = tolkSvar(svar);

    const searchMatch = assistantText.match(/\[SEARCH:\s*(.+?)\]/);
    if (searchMatch) {
        const query = searchMatch[1].trim();
        const renText = assistantText.replace(/\[SEARCH:\s*.+?\]/g, "").trim();

        if (renText) historik.push({ role: "assistant", content: renText, silent: true });

        const sokSvar = await chrome.runtime.sendMessage({ type: "SEARCH", query });

        if (sokSvar?.results?.length) {
            const sokContent = `[Web search results for "${query}"]\n` +
                sokSvar.results.map(r => `${r.title}\n${r.url}\n${r.snippet}`).join("\n\n");
            historik.push({ role: "user", content: sokContent, silent: true });

            const finalSvar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt, historik });
            assistantText = tolkSvar(finalSvar);
        } else {
            assistantText = renText || assistantText;
        }
    }

    tänker.remove();
    return assistantText;
}

function tolkSvar(svar) {
    if (svar?.error === "quota_exceeded") return t.kvotSlut || "Du har använt alla krediter för denna månad.";
    return svar?.result?.content?.[0]?.text || t.nagorGickFel || "Något gick fel.";
}

// --- Skicka meddelande ---
document.getElementById("skicka").addEventListener("click", skicka);
document.getElementById("input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); skicka(); }
});

async function skicka() {
    const input = document.getElementById("input");
    const text = input.value.trim();
    if (!text || !aktivtProjekt) return;

    laggTillBubbla("user", text);
    historik.push({ role: "user", content: text });
    input.value = "";
    await sparaHistorik();

    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt, historik });
    const assistantText = await hanteraAISvar(svar, tänker);
    laggTillBubbla("assistant", assistantText);
    historik.push({ role: "assistant", content: assistantText });
    await sparaHistorik();
}


// --- Sökning med webbläsarens sökmotor ---
document.getElementById("sok-knapp").addEventListener("click", () => {
    const query = document.getElementById("input").value.trim() || aktivtProjekt?.fraga;
    if (!query) return;
    chrome.runtime.sendMessage({ type: "TOOLBAR_SEARCH", query });
});

// --- UI-hjälpfunktioner ---
function laggTillBubbla(roll, text, skrolla = true) {
    const div = document.createElement("div");
    div.className = `bubbla ${roll}`;
    if (roll === "assistant") {
        div.innerHTML = marked.parse(text);
    } else {
        div.textContent = text;
    }
    const container = document.getElementById("meddelanden");
    container.appendChild(div);
    if (skrolla) {
        if (roll === "assistant") {
            div.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            container.scrollTop = container.scrollHeight;
        }
    }
}

function visaTänker() {
    const div = document.createElement("div");
    div.className = "ar-tänker";
    div.innerHTML = "<span></span><span></span><span></span>";
    const container = document.getElementById("meddelanden");
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

// --- Spara session till logg ---
document.getElementById("spara-session").addEventListener("click", sparaMentorSession);

async function sparaMentorSession() {
    if (!aktivtProjekt || historik.filter(m => !m.silent).length < 2) return;

    const sparaKnapp = document.getElementById("spara-session");
    sparaKnapp.textContent = "⏳";
    sparaKnapp.disabled = true;

    const summaryPrompt = `Summarize this research session as a JSON object. Return ONLY valid JSON, no other text.

{
  "sammanfattning": "2-3 sentences summarizing what was discussed, learned and decided",
  "insikter": ["key insight or decision 1", "key insight 2"],
  "kallor": [{"title": "source title", "url": "https://..."}],
  "nyckelord": ["keyword1", "keyword2"]
}

Rules: sammanfattning in conversation language, max 5 insikter, only real URLs, 3-8 nyckelord.`;

    const summaryHistorik = [
        ...historik.filter(m => !m.silent),
        { role: "user", content: summaryPrompt }
    ];

    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt, historik: summaryHistorik });
    const rawText = svar?.result?.content?.[0]?.text || "";

    let parsed = {};
    try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
        parsed = { sammanfattning: rawText.slice(0, 300) };
    }

    const entry = {
        fraga: aktivtProjekt.fraga,
        namn: aktivtProjekt.namn,
        sammanfattning: parsed.sammanfattning || "",
        insikter: parsed.insikter || [],
        kallor: parsed.kallor || [],
        nyckelord: parsed.nyckelord || [],
        projektId: aktivtProjekt.projektId || aktivtProjekt.id,
        sessionId: nuvarandeSessionId,
        lang: t === AR_LOCALES.sv ? "sv" : "en"
    };

    const resultat = await chrome.runtime.sendMessage({ type: "SAVE_MENTOR_LOG", entry });
    console.log("SAVE_MENTOR_LOG resultat:", JSON.stringify(resultat));

    if (resultat?.id) {
        sparaKnapp.textContent = "✓";
        sparaKnapp.classList.add("aktiv");
    } else {
        sparaKnapp.textContent = "✗";
        const fel = resultat?.error || "okänt fel";
        console.error("Fel vid sparande:", fel);
        // Visa felet i chatten
        laggTillBubbla("assistant", `_Kunde inte spara session: ${fel}_`);
    }
    setTimeout(() => {
        sparaKnapp.textContent = "💾";
        sparaKnapp.disabled = false;
        sparaKnapp.classList.remove("aktiv");
    }, 2000);
}

// --- Visa logg ---
document.getElementById("visa-logg").addEventListener("click", visaLogg);

function formateraLoggDatum(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
        + ", " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function stängLogg() {
    const loggVy = document.getElementById("logg-vy");
    const meddelandenEl = document.getElementById("meddelanden");
    const inputArea = document.getElementById("input-area");
    loggVy.style.display = "none";
    loggVy.innerHTML = "";
    meddelandenEl.style.display = "flex";
    inputArea.style.display = "flex";
    document.getElementById("visa-logg").classList.remove("aktiv");
}

async function visaLogg() {
    const loggVy = document.getElementById("logg-vy");
    const meddelandenEl = document.getElementById("meddelanden");
    const inputArea = document.getElementById("input-area");
    const loggKnapp = document.getElementById("visa-logg");

    // Redan öppen — stäng
    if (loggVy.style.display === "flex") {
        stängLogg();
        return;
    }

    // Dölj chatt och input
    meddelandenEl.style.display = "none";
    inputArea.style.display = "none";
    loggKnapp.classList.add("aktiv");

    // Visa logg med tillbaka-knapp
    loggVy.style.display = "flex";
    loggVy.style.flexDirection = "column";
    loggVy.innerHTML = `
        <div style="padding:10px 0 14px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:4px;display:flex;align-items:center;gap:10px;">
            <button id="logg-tillbaka" style="background:none;border:none;color:#f0c040;cursor:pointer;font-size:13px;padding:0;opacity:0.8;">← Tillbaka</button>
            <span style="font-size:10px;opacity:0.4;text-transform:uppercase;letter-spacing:0.08em;">Minnesanteckningar</span>
        </div>
        <div id="logg-innehall" style="flex:1;overflow-y:auto;">
            <div style="opacity:0.4;font-size:11px;padding:8px 0;">Hämtar…</div>
        </div>`;

    document.getElementById("logg-tillbaka").addEventListener("click", stängLogg);

    // Hämta bara poster för detta projekt
    const svar = await chrome.runtime.sendMessage({
        type: "GET_MENTOR_LOG",
        projektId: aktivtProjekt?.projektId || aktivtProjekt?.id
    });

    const innehall = document.getElementById("logg-innehall");
    if (!innehall) return;

    if (!svar?.entries?.length) {
        innehall.innerHTML = "<div style='opacity:0.4;font-size:11px;padding:8px 0;'>Inga sparade sessioner för detta projekt ännu.</div>";
        return;
    }

    innehall.innerHTML = svar.entries.map(e => `
        <div class="logg-entry">
            <div class="logg-tidsstampel">${formateraLoggDatum(e.timestamp)}</div>
            <div class="logg-sammanfattning">${e.sammanfattning || ""}</div>
            ${e.insikter?.length ? `<ul class="logg-insikter">${e.insikter.map(i => `<li>${i}</li>`).join("")}</ul>` : ""}
            ${e.nyckelord?.length ? `<div class="logg-nyckelord">${e.nyckelord.map(k => `<span>${k}</span>`).join("")}</div>` : ""}
        </div>
    `).join("");
}
