// AIuda Mentor — sidopanel
let historik = [];
let systemprompt = "";
let sessionId = null;
let aktivtProjekt = null;
let nuvarandeSessionId = "session_" + Date.now();
let sessionStartIndex = 0;
let t = AR_LOCALES.en;
let krypteringsNyckel = null; // CryptoKey — lever bara i minnet

// ============================================================
// KRYPTERING (Web Crypto API — allt sker lokalt på enheten)
// ============================================================

async function laddaEllerSkapaNyckel() {
    const sparad = await chrome.storage.local.get("aiudaEncryptedKey");

    if (sparad.aiudaEncryptedKey) {
        // Lokal nyckel finns — ladda den
        const raw = base64TillBuffer(sparad.aiudaEncryptedKey);
        krypteringsNyckel = await crypto.subtle.importKey(
            "raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]
        );
        return;
    }

    // Ingen lokal nyckel — kolla om det finns en i Firebase (annan enhet)
    const fjärrNyckel = await chrome.runtime.sendMessage({ type: "GET_ENCRYPTION_KEY" });
    if (fjärrNyckel?.wrappedKey) {
        // Nyckel finns i Firebase — be om lösenord för att låsa upp
        await visaLösenordsImportDialog(fjärrNyckel);
        return;
    }

    // Ingen nyckel alls — generera ny och visa onboarding
    krypteringsNyckel = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
    const exporterad = await crypto.subtle.exportKey("raw", krypteringsNyckel);
    await chrome.storage.local.set({ aiudaEncryptedKey: bufferTillBase64(exporterad) });
    visaKrypteringsOnboarding();
}

// --- Exportera nyckel skyddad med lösenord (PBKDF2 + AES-GCM wrap) ---
async function exporteraNyckelMedLösenord(lösenord) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(lösenord), "PBKDF2", false, ["deriveKey"]
    );
    const wrappingKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["wrapKey"]
    );
    const wrappedKey = await crypto.subtle.wrapKey("raw", krypteringsNyckel, wrappingKey, { name: "AES-GCM", iv });

    return {
        wrappedKey: bufferTillBase64(wrappedKey),
        salt: bufferTillBase64(salt),
        iv: bufferTillBase64(iv)
    };
}

// --- Importera nyckel med lösenord på ny enhet ---
async function importeraNyckelMedLösenord(lösenord, nyckelData) {
    const salt = base64TillBuffer(nyckelData.salt);
    const iv = base64TillBuffer(nyckelData.iv);
    const wrappedKey = base64TillBuffer(nyckelData.wrappedKey);

    const keyMaterial = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(lösenord), "PBKDF2", false, ["deriveKey"]
    );
    const wrappingKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["unwrapKey"]
    );

    return await crypto.subtle.unwrapKey(
        "raw", wrappedKey, wrappingKey,
        { name: "AES-GCM", iv },
        { name: "AES-GCM", length: 256 },
        true, ["encrypt", "decrypt"]
    );
}

// --- Dialog: ange lösenord för att importera nyckel från ny enhet ---
async function visaLösenordsImportDialog(nyckelData) {
    return new Promise(resolve => {
        const dialog = document.createElement("div");
        dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`;
        dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:24px;max-width:300px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:12px;">🔐 Hämta dina anteckningar</div>
                <p style="opacity:0.8;margin-bottom:16px;">Du har anteckningar på en annan enhet. Ange ditt återställningslösenord för att komma åt dem.</p>
                <input id="import-lösenord" type="password" placeholder="Återställningslösenord" style="width:100%;padding:8px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="import-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;"></div>
                <button id="import-ok" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">Lås upp →</button>
                <button id="import-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.6;font-size:11px;">Börja med ny nyckel istället</button>
            </div>`;
        document.body.appendChild(dialog);

        document.getElementById("import-ok").addEventListener("click", async () => {
            const lösenord = document.getElementById("import-lösenord").value;
            if (!lösenord) return;
            try {
                krypteringsNyckel = await importeraNyckelMedLösenord(lösenord, nyckelData);
                const raw = await crypto.subtle.exportKey("raw", krypteringsNyckel);
                await chrome.storage.local.set({ aiudaEncryptedKey: bufferTillBase64(raw) });
                dialog.remove();
                resolve();
            } catch {
                const felEl = document.getElementById("import-fel");
                felEl.textContent = "Fel lösenord — försök igen";
                felEl.style.display = "block";
            }
        });

        document.getElementById("import-lösenord").addEventListener("keydown", e => {
            if (e.key === "Enter") document.getElementById("import-ok").click();
        });

        document.getElementById("import-skip").addEventListener("click", async () => {
            // Generera ny nyckel och börja om
            krypteringsNyckel = await crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
            );
            const raw = await crypto.subtle.exportKey("raw", krypteringsNyckel);
            await chrome.storage.local.set({ aiudaEncryptedKey: bufferTillBase64(raw) });
            dialog.remove();
            resolve();
        });
    });
}

// --- Dialog: sätt återställningslösenord ---
async function visaLösenordsDialog() {
    return new Promise(resolve => {
        const dialog = document.createElement("div");
        dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`;
        dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:24px;max-width:300px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:12px;">🔑 Återställningslösenord</div>
                <p style="opacity:0.8;margin-bottom:16px;">Ange ett lösenord för att kunna komma åt dina anteckningar från andra enheter.</p>
                <input id="ny-lösenord" type="password" placeholder="Välj ett lösenord" style="width:100%;padding:8px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <input id="ny-lösenord-2" type="password" placeholder="Bekräfta lösenordet" style="width:100%;padding:8px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="lösenord-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;"></div>
                <button id="lösenord-spara" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">Spara lösenord →</button>
                <button id="lösenord-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.6;font-size:11px;">Hoppa över (bara den här enheten)</button>
            </div>`;
        document.body.appendChild(dialog);

        document.getElementById("lösenord-spara").addEventListener("click", async () => {
            const lösenord = document.getElementById("ny-lösenord").value;
            const lösenord2 = document.getElementById("ny-lösenord-2").value;
            const felEl = document.getElementById("lösenord-fel");

            if (!lösenord) { felEl.textContent = "Ange ett lösenord"; felEl.style.display = "block"; return; }
            if (lösenord !== lösenord2) { felEl.textContent = "Lösenorden matchar inte"; felEl.style.display = "block"; return; }
            if (lösenord.length < 8) { felEl.textContent = "Lösenordet måste vara minst 8 tecken"; felEl.style.display = "block"; return; }

            const nyckelData = await exporteraNyckelMedLösenord(lösenord);
            const resultat = await chrome.runtime.sendMessage({ type: "SAVE_ENCRYPTION_KEY", nyckelData });
            if (resultat?.ok) {
                dialog.remove();
                resolve(true);
            } else {
                felEl.textContent = "Kunde inte spara — försök igen";
                felEl.style.display = "block";
            }
        });

        document.getElementById("lösenord-skip").addEventListener("click", () => {
            dialog.remove();
            resolve(false);
        });
    });
}

async function kryptera(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const krypterad = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, krypteringsNyckel, data);
    return { data: bufferTillBase64(krypterad), iv: bufferTillBase64(iv) };
}

async function dekryptera(payload) {
    try {
        const iv = base64TillBuffer(payload.iv);
        const data = base64TillBuffer(payload.data);
        const dekrypterad = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, krypteringsNyckel, data);
        return JSON.parse(new TextDecoder().decode(dekrypterad));
    } catch {
        return null; // Fel nyckel eller korrupt data
    }
}

function bufferTillBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64TillBuffer(base64) {
    const bin = atob(base64);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function visaKrypteringsOnboarding() {
    const dialog = document.createElement("div");
    dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;`;
    dialog.innerHTML = `
        <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:24px;max-width:300px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
            <div style="color:#f0c040;font-weight:600;margin-bottom:12px;">🔐 Dina anteckningar krypteras</div>
            <p style="opacity:0.8;margin-bottom:12px;">AIuda krypterar dina research-anteckningar lokalt. Vi kan inte läsa dem.</p>
            <p style="opacity:0.6;font-size:11px;margin-bottom:16px;">⚠ Utan återställningslösenord är anteckningarna låsta till den här enheten.</p>
            <button id="onboarding-lösenord" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">Sätt återställningslösenord →</button>
            <button id="onboarding-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.6;font-size:11px;">Hoppa över (bara den här enheten)</button>
        </div>`;
    document.body.appendChild(dialog);

    document.getElementById("onboarding-lösenord").addEventListener("click", async () => {
        dialog.remove();
        await visaLösenordsDialog();
    });
    document.getElementById("onboarding-skip").addEventListener("click", () => dialog.remove());
}

// --- Init ---
chrome.storage.local.get(["lang", "tema", "fontSize", "researchSessionId", "researchFraga", "researchProjektNamn", "arToken"], async (result) => {
    t = AR_LOCALES[result.lang] || AR_LOCALES.en;
    tillampaTemat(result.tema || "mörkt");
    tillampaFontSize(result.fontSize || 13);

    if (!result.arToken) {
        visaLoginVy();
        return;
    }

    await laddaEllerSkapaNyckel();

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

document.getElementById("kryptering-knapp").addEventListener("click", () => visaLösenordsDialog());

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

    // Ladda historik — försök Firebase först, fall tillbaka på lokal cache
    document.getElementById("meddelanden").innerHTML = "";
    let laddadHistorik = null;

    try {
        const fjärr = await chrome.runtime.sendMessage({ type: "LOAD_HISTORIK", projektId: sessionId });
        if (fjärr?.krypteradHistorik && krypteringsNyckel) {
            const dekrypterad = await dekryptera(fjärr.krypteradHistorik);
            if (dekrypterad) laddadHistorik = dekrypterad;
        }
    } catch {}

    // Fall tillbaka på lokal cache om Firebase misslyckades
    if (!laddadHistorik) {
        const sparad = await chrome.storage.local.get(sessionId);
        laddadHistorik = sparad[sessionId]?.historik || null;
    }

    if (laddadHistorik?.length > 0) {
        historik = laddadHistorik;
        sessionStartIndex = historik.length;
        // Uppdatera lokal cache med Firebase-data
        await chrome.storage.local.set({ [sessionId]: { namn: projekt.namn, fraga: projekt.fraga, historik } });
        historik.forEach(msg => {
            if (msg.silent) return;
            const text = typeof msg.content === "string" ? msg.content : msg.content[0]?.text || "";
            laggTillBubbla(msg.role, text, false);
        });
        document.getElementById("meddelanden").scrollTop = document.getElementById("meddelanden").scrollHeight;
    } else {
        historik = [];
        sessionStartIndex = 0;
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
async function sparaHistorik(synkaFirebase = false) {
    if (!sessionId) return;

    // Spara lokalt omedelbart (snabbt, alltid)
    await chrome.storage.local.set({
        [sessionId]: { namn: aktivtProjekt?.namn, fraga: aktivtProjekt?.fraga, historik }
    });

    // Synka till Firebase asynkront (krypterat) — bara när flagga är satt
    if (synkaFirebase && krypteringsNyckel) {
        try {
            const krypteradHistorik = await kryptera(historik);
            chrome.runtime.sendMessage({
                type: "SAVE_HISTORIK",
                data: {
                    projektId: sessionId,
                    namn: aktivtProjekt?.namn,
                    fraga: aktivtProjekt?.fraga,
                    krypteradHistorik
                }
            });
        } catch (e) {
            console.warn("Firebase-sync misslyckades:", e.message);
        }
    }
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
    await sparaHistorik(); // Lokalt direkt

    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt, historik });
    const assistantText = await hanteraAISvar(svar, tänker);
    laggTillBubbla("assistant", assistantText);
    historik.push({ role: "assistant", content: assistantText });
    await sparaHistorik(true); // Lokalt + Firebase-sync efter AI-svar
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

// --- Öppna länkar i webbläsaren (sidopanel öppnar inte flikar automatiskt) ---
document.getElementById("meddelanden").addEventListener("click", (e) => {
    const länk = e.target.closest("a");
    if (länk?.href) {
        e.preventDefault();
        chrome.tabs.create({ url: länk.href });
    }
});

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

    const summaryPrompt = `Summarize THIS SPECIFIC SESSION as a JSON object. Focus on what is NEW — what was explored, decided or discovered in THIS session that wasn't already established. Return ONLY valid JSON, no other text.

{
  "sammanfattning": "2-3 sentences about what was NEW in this session — new arguments, new distinctions, new directions taken",
  "insikter": ["new insight specific to this session", "new decision or turn taken"],
  "kallor": [{"title": "source title", "url": "https://..."}],
  "nyckelord": ["keyword1", "keyword2"]
}

Rules: sammanfattning in conversation language, max 5 insikter, only real URLs, 3-8 nyckelord.`;

    // Bygg summary-historik: tidigare sessioner som kontext + markering + ny session
    const tidigareHistorik = historik.slice(0, sessionStartIndex).filter(m => !m.silent);
    const sessionHistorik = historik.slice(sessionStartIndex).filter(m => !m.silent);

    if (sessionHistorik.length < 1) {
        sparaKnapp.textContent = "–";
        setTimeout(() => { sparaKnapp.textContent = "💾"; sparaKnapp.disabled = false; }, 1500);
        return;
    }

    // Ge Claude kontexten: vad som var känt sedan tidigare + vad som är nytt nu
    const summaryHistorik = [
        ...tidigareHistorik,
        { role: "user", content: "[SESSION BOUNDARY — the following messages are from the current session only. Summarize only what is new below this line.]" },
        { role: "assistant", content: "Understood. I will summarize only the new session below." },
        ...sessionHistorik,
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

    // Kryptera det känsliga innehållet innan det lämnar enheten
    const känsligtInnehåll = {
        sammanfattning: parsed.sammanfattning || "",
        insikter: parsed.insikter || [],
        kallor: parsed.kallor || [],
        nyckelord: parsed.nyckelord || []
    };
    const krypteratInnehåll = await kryptera(känsligtInnehåll);

    const entry = {
        // Okrypterat — behövs för filtrering och sortering
        fraga: aktivtProjekt.fraga,
        namn: aktivtProjekt.namn,
        projektId: aktivtProjekt.projektId || aktivtProjekt.id,
        sessionId: nuvarandeSessionId,
        lang: t === AR_LOCALES.sv ? "sv" : "en",
        // Krypterat innehåll
        krypterat: krypteratInnehåll
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

    // Dekryptera varje post
    const poster = await Promise.all(svar.entries.map(async e => {
        let innehåll = { sammanfattning: "", insikter: [], nyckelord: [] };
        if (e.krypterat) {
            const dekrypterat = await dekryptera(e.krypterat);
            if (dekrypterat) innehåll = dekrypterat;
            else innehåll.sammanfattning = "🔐 Kan inte dekryptera — fel enhet eller nyckel";
        } else {
            // Äldre okrypterade poster
            innehåll = { sammanfattning: e.sammanfattning, insikter: e.insikter || [], nyckelord: e.nyckelord || [] };
        }
        return { ...e, ...innehåll };
    }));

    innehall.innerHTML = poster.map(e => `
        <div class="logg-entry">
            <div class="logg-tidsstampel">${formateraLoggDatum(e.timestamp)}</div>
            <div class="logg-sammanfattning">${e.sammanfattning || ""}</div>
            ${e.insikter?.length ? `<ul class="logg-insikter">${e.insikter.map(i => `<li>${i}</li>`).join("")}</ul>` : ""}
            ${e.nyckelord?.length ? `<div class="logg-nyckelord">${e.nyckelord.map(k => `<span>${k}</span>`).join("")}</div>` : ""}
        </div>
    `).join("");
}
