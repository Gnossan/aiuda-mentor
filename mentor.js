// AIuda Mentor — fristående fönster
let historik = [];
let systemprompt = "";
let sessionId = null;
let aktivtProjekt = null;
let nuvarandeSessionId = "session_" + Date.now();
let sessionStartIndex = 0;
let t = AR_LOCALES.sv; // Default svenska
let krypteringsNyckel = null;
let tasks = [];
let anteckningarSparade = "";

// ============================================================
// KRYPTERING (samma som sidepanel.js)
// ============================================================

async function laddaEllerSkapaNyckel(email) {
    // Ta bort eventuell gammal rånyckel från tidigare version (K-2)
    await chrome.storage.local.remove("aiudaEncryptedKey");

    const fjärrNyckel = await chrome.runtime.sendMessage({ type: "GET_ENCRYPTION_KEY" });

    if (fjärrNyckel?.wrappedKey) {
        // Prova auto-upplåsning via webbläsarens lösenordshanterare
        if (window.PasswordCredential) {
            try {
                const cred = await navigator.credentials.get({ password: true, mediation: "optional" });
                if (cred?.password) {
                    try {
                        krypteringsNyckel = await importeraNyckelMedLösenord(cred.password, fjärrNyckel);
                        return;
                    } catch { /* fel lösenord — faller igenom till manuell dialog */ }
                }
            } catch { /* Credential API ej tillgänglig */ }
        }
        // Manuell dialog om auto-upplåsning misslyckades
        await visaLösenordsImportDialog(fjärrNyckel, email);
        return;
    }

    // Ingen nyckel i Firebase → generera ny, håll bara i minnet
    krypteringsNyckel = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
    visaKrypteringsOnboarding();
}

async function sparaILösenordshanterare(email, lösenord) {
    if (!window.PasswordCredential || !email) return;
    try {
        await navigator.credentials.store(new PasswordCredential({ id: email, password: lösenord }));
    } catch (e) { console.warn("Kunde inte spara i lösenordshanterare:", e.message); }
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
    } catch { return null; }
}

function bufferTillBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64TillBuffer(base64) {
    const bin = atob(base64);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function exporteraNyckelMedLösenord(lösenord) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(lösenord), "PBKDF2", false, ["deriveKey"]);
    const wrappingKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["wrapKey"]
    );
    const wrappedKey = await crypto.subtle.wrapKey("raw", krypteringsNyckel, wrappingKey, { name: "AES-GCM", iv });
    return { wrappedKey: bufferTillBase64(wrappedKey), salt: bufferTillBase64(salt), iv: bufferTillBase64(iv) };
}

async function importeraNyckelMedLösenord(lösenord, nyckelData) {
    const salt = base64TillBuffer(nyckelData.salt);
    const iv = base64TillBuffer(nyckelData.iv);
    const wrappedKey = base64TillBuffer(nyckelData.wrappedKey);
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(lösenord), "PBKDF2", false, ["deriveKey"]);
    const wrappingKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["unwrapKey"]
    );
    return await crypto.subtle.unwrapKey("raw", wrappedKey, wrappingKey,
        { name: "AES-GCM", iv }, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
}

function visaKrypteringsOnboarding() {
    // Visa enkelt meddelande i chattområdet
    laggTillBubbla("assistant", "🔐 Dina anteckningar krypteras lokalt. Klicka 🔑 för att sätta ett återställningslösenord.");
}

async function visaLösenordsImportDialog(nyckelData, email) {
    return new Promise(resolve => {
        const dialog = document.createElement("div");
        dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:28px;width:340px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:12px;">🔐 Hämta dina anteckningar</div>
                <p style="opacity:0.8;margin-bottom:16px;">Du har anteckningar på en annan enhet. Ange ditt återställningslösenord.</p>
                <input id="import-lösenord" type="password" placeholder="Återställningslösenord" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="import-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;"></div>
                <button id="import-ok" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">Lås upp →</button>
                <button id="import-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.6;font-size:11px;">Börja med ny nyckel</button>
            </div>`;
        document.body.appendChild(dialog);
        document.getElementById("import-ok").addEventListener("click", async () => {
            const lösenord = document.getElementById("import-lösenord").value;
            if (!lösenord) return;
            try {
                krypteringsNyckel = await importeraNyckelMedLösenord(lösenord, nyckelData);
                await sparaILösenordshanterare(email, lösenord); // Spara i lösenordshanteraren
                dialog.remove(); resolve();
            } catch {
                const felEl = document.getElementById("import-fel");
                felEl.textContent = "Fel lösenord — försök igen";
                felEl.style.display = "block";
            }
        });
        document.getElementById("import-lösenord").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("import-ok").click(); });
        document.getElementById("import-skip").addEventListener("click", async () => {
            // Ny nyckel — bara i minnet, ingen raw-sparning i storage
            krypteringsNyckel = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
            dialog.remove(); resolve();
        });
    });
}

async function visaLösenordsDialog(email) {
    return new Promise(resolve => {
        const dialog = document.createElement("div");
        dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:28px;width:340px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:12px;">🔑 Återställningslösenord</div>
                <p style="opacity:0.8;margin-bottom:16px;">Sätt ett lösenord för att komma åt dina anteckningar från andra enheter.</p>
                <input id="ny-lösenord" type="password" placeholder="Välj ett lösenord (min 8 tecken)" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <input id="ny-lösenord-2" type="password" placeholder="Bekräfta lösenordet" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="lösenord-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;"></div>
                <button id="lösenord-spara" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">Spara →</button>
                <button id="lösenord-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.6;font-size:11px;">Hoppa över</button>
            </div>`;
        document.body.appendChild(dialog);
        document.getElementById("lösenord-spara").addEventListener("click", async () => {
            const lösenord = document.getElementById("ny-lösenord").value;
            const lösenord2 = document.getElementById("ny-lösenord-2").value;
            const felEl = document.getElementById("lösenord-fel");
            if (!lösenord || lösenord.length < 8) { felEl.textContent = "Minst 8 tecken"; felEl.style.display = "block"; return; }
            if (lösenord !== lösenord2) { felEl.textContent = "Lösenorden matchar inte"; felEl.style.display = "block"; return; }
            const nyckelData = await exporteraNyckelMedLösenord(lösenord);
            const resultat = await chrome.runtime.sendMessage({ type: "SAVE_ENCRYPTION_KEY", nyckelData });
            if (resultat?.ok) {
                await sparaILösenordshanterare(email, lösenord);
                dialog.remove(); resolve(true);
            } else { felEl.textContent = "Kunde inte spara"; felEl.style.display = "block"; }
        });
        document.getElementById("lösenord-skip").addEventListener("click", () => { dialog.remove(); resolve(false); });
    });
}

// ============================================================
// INIT
// ============================================================

chrome.storage.local.get(["lang", "tema", "arToken", "arUser"], async (result) => {
    t = AR_LOCALES[result.lang] || AR_LOCALES.sv;

    if (!result.arToken) {
        document.getElementById("login-vy").style.display = "flex";
        document.getElementById("välkommen").style.display = "none";
        return;
    }

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

// ============================================================
// PROJEKTLISTA
// ============================================================

async function laddaProjektlista() {
    const svar = await chrome.runtime.sendMessage({ type: "LIST_PROJEKT" });
    const lista = document.getElementById("projekt-liste");

    if (!svar?.projekt?.length) {
        lista.innerHTML = `<div style="padding:12px 16px;font-size:11px;opacity:0.3;">Inga projekt ännu.</div>`;
        return;
    }

    lista.innerHTML = DOMPurify.sanitize(svar.projekt.map(p => `
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
    });
}

// ============================================================
// NYTT PROJEKT
// ============================================================

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

async function starta() {
    const fraga = document.getElementById("fraga-input").value.trim();
    const namn = document.getElementById("projekt-namn-input").value.trim() || fraga.slice(0, 40);
    if (!fraga) return;

    const projektId = "projekt_" + Date.now();
    aktivtProjekt = { id: projektId, projektId, namn, fraga };

    chrome.storage.local.set({
        researchFraga: fraga, researchSessionId: projektId,
        researchProjektId: projektId, researchProjektNamn: namn, researchAktiv: true
    });

    document.getElementById("ny-fraga-panel").style.display = "none";
    document.getElementById("fraga-input").value = "";
    document.getElementById("projekt-namn-input").value = "";

    öppnaProjekt(aktivtProjekt);
    await laddaProjektlista();
}

// ============================================================
// ÖPPNA PROJEKT
// ============================================================

async function öppnaProjekt(projekt) {
    sessionId = projekt.id;
    aktivtProjekt = projekt;
    nuvarandeSessionId = "session_" + Date.now();

    document.getElementById("projekt-namn-chatt").textContent = projekt.namn || projekt.fraga.slice(0, 40);
    document.getElementById("projekt-fraga-chatt").textContent = projekt.fraga;
    document.getElementById("välkommen").style.display = "none";
    document.getElementById("ny-fraga-panel").style.display = "none";
    document.getElementById("meddelanden").style.display = "flex";
    document.getElementById("input-area").style.display = "flex";
    document.getElementById("spara-session").style.display = "inline-block";
    document.getElementById("info-knapp").style.display = "inline-block";
    document.getElementById("info-projekt-id").textContent = sessionId;
    document.getElementById("info-session-id").textContent = nuvarandeSessionId;

    byggSystemprompt();

    // Ladda anteckningar och tasks
    await laddaAnteckningarOchTasks();

    // Ladda historik
    document.getElementById("meddelanden").innerHTML = "";
    let laddadHistorik = null;
    let laddadFrånFirebase = false;

    try {
        const fjärr = await chrome.runtime.sendMessage({ type: "LOAD_HISTORIK", projektId: sessionId });
        if (fjärr?.krypteradHistorik && krypteringsNyckel) {
            const dekrypterad = await dekryptera(fjärr.krypteradHistorik);
            if (dekrypterad) { laddadHistorik = dekrypterad; laddadFrånFirebase = true; }
        }
    } catch {}

    if (!laddadHistorik) {
        const sparad = await chrome.storage.local.get(sessionId);
        laddadHistorik = sparad[sessionId]?.historik || null;
    }

    if (laddadHistorik?.length > 0) {
        historik = laddadHistorik;
        sessionStartIndex = historik.length;
        if (!laddadFrånFirebase) sparaHistorik(true);
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

    // Ladda logg för detta projekt
    laddaLogg();
}

function byggSystemprompt() {
    systemprompt = `You are an AI research assistant — AIuda Mentor. The user is researching: "${aktivtProjekt?.fraga}".

When you need external sources, links or references: silently include [SEARCH: optimized English query] anywhere in your response — the system handles it invisibly. Never mention that you are searching, never show the search tag, never fabricate URLs. Just present the results naturally.

When you receive a message starting with [Web search results for "..."]: use the content silently to inform your response. Never mention the search, never tell the user that search results were shown, never refer to "the results" or "the sources" explicitly unless it adds value. Just respond as if you already knew.

Early in the session, help the user refine their research question:
- If the question is too broad, suggest concrete scope limitations
- When proposing a revised question, format it as: **Revised research question:** "..."

Always respond in the same language as the user's message.`;
}

// ============================================================
// ANTECKNINGAR & TASKS
// ============================================================

async function laddaAnteckningarOchTasks() {
    // Försök ladda från Firebase om nyckel finns
    if (krypteringsNyckel) {
        try {
            const fjärr = await chrome.runtime.sendMessage({ type: "LOAD_ANTECKNINGAR", projektId: sessionId });
            if (fjärr?.krypteradAnteckningar) {
                const dekrypterad = await dekryptera(fjärr.krypteradAnteckningar);
                document.getElementById("anteckningar-area").value = dekrypterad.anteckningar || "";
                anteckningarSparade = dekrypterad.anteckningar || "";
                tasks = dekrypterad.tasks || [];
                renderaTasks();
                // Backfill lokalt cache
                await chrome.storage.local.set({
                    [`anteckningar_${sessionId}`]: { anteckningar: dekrypterad.anteckningar || "", tasks: dekrypterad.tasks || [] }
                });
                return;
            }
        } catch (e) { console.warn("Firebase-laddning av anteckningar misslyckades:", e.message); }
    }

    // Fallback: lokalt
    const sparad = await chrome.storage.local.get(`anteckningar_${sessionId}`);
    const data = sparad[`anteckningar_${sessionId}`] || {};
    document.getElementById("anteckningar-area").value = data.anteckningar || "";
    anteckningarSparade = data.anteckningar || "";
    tasks = data.tasks || [];
    renderaTasks();
}

async function sparaAnteckningarOchTasks(synkaFirebase = false) {
    const anteckningar = document.getElementById("anteckningar-area").value;
    await chrome.storage.local.set({
        [`anteckningar_${sessionId}`]: { anteckningar, tasks }
    });
    if (synkaFirebase && krypteringsNyckel) {
        try {
            const krypteradAnteckningar = await kryptera({ anteckningar, tasks });
            chrome.runtime.sendMessage({
                type: "SAVE_ANTECKNINGAR",
                data: { projektId: sessionId, krypteradAnteckningar }
            });
        } catch (e) { console.warn("Firebase-sync av anteckningar misslyckades:", e.message); }
    }
}

document.getElementById("spara-anteckningar").addEventListener("click", async () => {
    await sparaAnteckningarOchTasks(true);   // synka till Firebase
    const knapp = document.getElementById("spara-anteckningar");
    knapp.textContent = "Sparat ✓";
    knapp.classList.add("sparad");
    setTimeout(() => { knapp.textContent = "Spara"; knapp.classList.remove("sparad"); }, 1500);
});

// Auto-spara anteckningar vid inmatning (debounced)
let anteckningarTimeout;
document.getElementById("anteckningar-area").addEventListener("input", () => {
    clearTimeout(anteckningarTimeout);
    anteckningarTimeout = setTimeout(sparaAnteckningarOchTasks, 1500);
});

// Tasks
document.getElementById("lägg-till-task").addEventListener("click", läggTillTask);
document.getElementById("ny-task-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); läggTillTask(); }
});

function läggTillTask() {
    const input = document.getElementById("ny-task-input");
    const text = input.value.trim();
    if (!text || !aktivtProjekt) return;
    tasks.push({ id: Date.now(), text, klar: false });
    input.value = "";
    renderaTasks();
    sparaAnteckningarOchTasks(true);
}

function renderaTasks() {
    const lista = document.getElementById("task-lista");
    if (!tasks.length) {
        lista.innerHTML = `<div style="padding:12px;font-size:11px;opacity:0.3;">Inga tasks ännu.</div>`;
        return;
    }

    lista.innerHTML = "";
    tasks.forEach(task => {
        const div = document.createElement("div");
        div.className = `task-item ${task.klar ? "klar" : ""}`;
        div.dataset.id = task.id;
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = task.klar;
        cb.id = `task-${task.id}`;
        const label = document.createElement("label");
        label.htmlFor = `task-${task.id}`;
        label.textContent = task.text;          // textContent — ingen XSS-risk
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
            const task = tasks.find(t => t.id === id);
            if (task) { task.klar = cb.checked; renderaTasks(); sparaAnteckningarOchTasks(true); }
        });
    });

    lista.querySelectorAll(".task-ta-bort").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            tasks = tasks.filter(t => t.id !== id);
            renderaTasks();
            sparaAnteckningarOchTasks(true);
        });
    });
}

// ============================================================
// LOGG
// ============================================================

async function laddaLogg() {
    const loggLista = document.getElementById("logg-lista");
    loggLista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">Hämtar logg…</div>`;

    const svar = await chrome.runtime.sendMessage({
        type: "GET_MENTOR_LOG",
        projektId: aktivtProjekt?.projektId || aktivtProjekt?.id
    });

    if (!svar?.entries?.length) {
        loggLista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">Inga sparade sessioner ännu.</div>`;
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

function formateraLoggDatum(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
        + ", " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

// ============================================================
// FLIKAR (höger kolumn)
// ============================================================

document.querySelectorAll(".flik").forEach(flik => {
    flik.addEventListener("click", () => {
        document.querySelectorAll(".flik").forEach(f => f.classList.remove("aktiv"));
        document.querySelectorAll(".flik-vy").forEach(v => v.classList.remove("aktiv"));
        flik.classList.add("aktiv");
        document.getElementById(`vy-${flik.dataset.flik}`).classList.add("aktiv");
    });
});

// ============================================================
// CHATT
// ============================================================

async function startaKonversation() {
    const fraga = t.forklaraResearch || "Please introduce yourself as my research assistant.";
    historik.push({ role: "user", content: fraga, silent: true });
    await sparaHistorik();
    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt, historik });
    const assistantText = await hanteraAISvar(svar, tänker);
    laggTillBubbla("assistant", assistantText);
    historik.push({ role: "assistant", content: assistantText });
    await sparaHistorik(true);
}

async function sparaHistorik(synkaFirebase = false) {
    if (!sessionId) return;
    await chrome.storage.local.set({ [sessionId]: { namn: aktivtProjekt?.namn, fraga: aktivtProjekt?.fraga, historik } });
    if (synkaFirebase && krypteringsNyckel) {
        try {
            const krypteradHistorik = await kryptera(historik);
            chrome.runtime.sendMessage({ type: "SAVE_HISTORIK", data: { projektId: sessionId, namn: aktivtProjekt?.namn, fraga: aktivtProjekt?.fraga, krypteradHistorik } });
        } catch (e) { console.warn("Firebase-sync misslyckades:", e.message); }
    }
}

// ============================================================
// SPARA SESSION TILL LOGG
// ============================================================

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

    const sessionHistorik = historik.slice(sessionStartIndex).filter(m => !m.silent);

    if (sessionHistorik.length < 1) {
        sparaKnapp.textContent = "–";
        setTimeout(() => { sparaKnapp.textContent = "💾"; sparaKnapp.disabled = false; }, 1500);
        return;
    }

    const summaryHistorik = [
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

    const känsligtInnehåll = {
        sammanfattning: parsed.sammanfattning || "",
        insikter: parsed.insikter || [],
        kallor: parsed.kallor || [],
        nyckelord: parsed.nyckelord || []
    };
    if (!krypteringsNyckel) {
        laggTillBubbla("assistant", "⚠️ Kan inte spara — krypteringsnyckeln saknas. Klicka 🔑 för att sätta ett återställningslösenord.");
        sparaKnapp.textContent = "💾"; sparaKnapp.disabled = false;
        return;
    }
    const krypteratInnehåll = await kryptera(känsligtInnehåll);

    const entry = {
        fraga: aktivtProjekt.fraga,
        namn: aktivtProjekt.namn,
        projektId: sessionId,
        sessionId: nuvarandeSessionId,
        krypterat: krypteratInnehåll
    };

    const resultat = await chrome.runtime.sendMessage({ type: "SAVE_MENTOR_LOG", entry });

    if (resultat?.id) {
        sparaKnapp.textContent = "✓";
        sparaKnapp.classList.add("aktiv");
        // Uppdatera logg-fliken om den är öppen
        laddaLogg();
    } else {
        sparaKnapp.textContent = "✗";
        console.error("Fel vid logg-sparande:", resultat?.error);
    }
    setTimeout(() => {
        sparaKnapp.textContent = "💾";
        sparaKnapp.disabled = false;
        sparaKnapp.classList.remove("aktiv");
    }, 2000);
}

async function hanteraAISvar(svar, tänker) {
    let assistantText = tolkSvar(svar);
    const searchMatch = assistantText.match(/\[SEARCH:\s*(.+?)\]/);
    if (searchMatch) {
        const query = searchMatch[1].trim();
        if (query.length < 5) {
            tänker.remove();
            return assistantText.replace(/\[SEARCH:\s*.+?\]/g, "").trim() || assistantText;
        }
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
    if (svar?.error === "quota_exceeded") return "Du har använt alla krediter för denna månad.";
    return svar?.result?.content?.[0]?.text || "Något gick fel.";
}

document.getElementById("skicka").addEventListener("click", () => skicka());
document.getElementById("skicka-kort").addEventListener("click", () => skicka(true));
document.getElementById("input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); skicka(); }
    if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); skicka(true); }
});

window.addEventListener("paste", (e) => {
    const input = document.getElementById("input");
    const active = document.activeElement;
    // Om fokus redan är på ett inmatningsfält — låt webbläsaren hantera det normalt
    if (!input || !aktivtProjekt || active?.tagName === "TEXTAREA" || active?.tagName === "INPUT") return;
    const text = e.clipboardData?.getData("text/plain") || "";
    if (!text) return;
    e.preventDefault();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
});

async function skicka(kort = false) {
    const input = document.getElementById("input");
    const text = input.value.trim();
    if (!text || !aktivtProjekt) return;
    laggTillBubbla("user", text);
    const innehåll = kort
        ? `${text}\n\n[Kort reflektion — svara måttligt, lägg inte ut till ett nytt ämne]`
        : text;
    historik.push({ role: "user", content: innehåll });
    input.value = "";
    await sparaHistorik();
    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt, historik });
    const assistantText = await hanteraAISvar(svar, tänker);
    laggTillBubbla("assistant", assistantText);
    historik.push({ role: "assistant", content: assistantText });
    await sparaHistorik(true);
}

function laggTillBubbla(roll, text, skrolla = true) {
    const div = document.createElement("div");
    div.className = `bubbla ${roll}`;
    if (roll === "assistant") div.innerHTML = DOMPurify.sanitize(marked.parse(text));
    else div.textContent = text;
    const container = document.getElementById("meddelanden");
    container.appendChild(div);
    if (skrolla) {
        if (roll === "assistant") div.scrollIntoView({ behavior: "smooth", block: "start" });
        else container.scrollTop = container.scrollHeight;
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

document.getElementById("meddelanden").addEventListener("click", (e) => {
    const länk = e.target.closest("a");
    if (länk?.href) { e.preventDefault(); chrome.tabs.create({ url: länk.href }); }
});

// ============================================================
// DRAG-HANDLES — dynamiska kolumnbredder
// ============================================================

function initResizer(resizerId, vänsterEl, högerEl, spara) {
    const resizer = document.getElementById(resizerId);
    if (!resizer) return;

    let startX, startVänster, startHöger;

    resizer.addEventListener("mousedown", (e) => {
        startX = e.clientX;
        startVänster = vänsterEl.offsetWidth;
        startHöger = högerEl.offsetWidth;
        resizer.classList.add("dragging");

        const onMove = (e) => {
            const delta = e.clientX - startX;
            const nyVänster = Math.max(parseInt(vänsterEl.style.minWidth || 160), Math.min(parseInt(vänsterEl.style.maxWidth || 600), startVänster + delta));
            const nyHöger = Math.max(parseInt(högerEl.style.minWidth || 160), startHöger - delta);
            vänsterEl.style.width = nyVänster + "px";
            högerEl.style.width = nyHöger + "px";
            vänsterEl.style.minWidth = vänsterEl.style.minWidth || "160px";
            högerEl.style.minWidth = högerEl.style.minWidth || "160px";
        };

        const onUp = () => {
            resizer.classList.remove("dragging");
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            if (spara) chrome.storage.local.set(spara());
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        e.preventDefault();
    });
}

// Ladda sparade bredder och initialisera
chrome.storage.local.get(["mentorNavBredd", "mentorHögerBredd"], (result) => {
    if (result.mentorNavBredd) document.getElementById("nav").style.width = result.mentorNavBredd + "px";
    if (result.mentorHögerBredd) document.getElementById("höger").style.width = result.mentorHögerBredd + "px";

    initResizer("resizer-vänster", document.getElementById("nav"), document.getElementById("chatt"), () => ({
        mentorNavBredd: document.getElementById("nav").offsetWidth
    }));
    initResizer("resizer-höger", document.getElementById("chatt"), document.getElementById("höger"), () => ({
        mentorHögerBredd: document.getElementById("höger").offsetWidth
    }));
});

// ============================================================
// KRYPTERING-KNAPP & TEMA
// ============================================================

document.getElementById("kryptering-knapp").addEventListener("click", () => {
    chrome.storage.local.get("arUser", ({ arUser }) => visaLösenordsDialog(arUser?.email));
});

// ⋯ info-popup
document.getElementById("info-knapp").addEventListener("click", (e) => {
    e.stopPropagation();
    const popup = document.getElementById("info-popup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", () => {
    document.getElementById("info-popup").style.display = "none";
});

document.getElementById("tema-knapp").addEventListener("click", () => {
    document.body.classList.toggle("ljust");
    document.getElementById("tema-knapp").textContent = document.body.classList.contains("ljust") ? "🌙" : "☀";
});
