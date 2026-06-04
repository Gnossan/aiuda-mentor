// src/kryptering.js — kryptering, nyckelhantering, dialoger

import { S } from "./state.js";

// ── Hjälpfunktioner ────────────────────────────────────────────────────────

function bufferTillBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64TillBuffer(base64) {
    const bin = atob(base64);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
}

// ── Kryptera / Dekryptera ──────────────────────────────────────────────────

export async function kryptera(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const krypterad = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, S.krypteringsNyckel, data);
    return { data: bufferTillBase64(krypterad), iv: bufferTillBase64(iv) };
}

export async function dekryptera(payload) {
    try {
        const iv = base64TillBuffer(payload.iv);
        const data = base64TillBuffer(payload.data);
        const dekrypterad = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, S.krypteringsNyckel, data);
        return JSON.parse(new TextDecoder().decode(dekrypterad));
    } catch { return null; }
}

// ── Nyckelexport / -import ─────────────────────────────────────────────────

export async function exporteraNyckelMedLösenord(lösenord) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(lösenord), "PBKDF2", false, ["deriveKey"]);
    const wrappingKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["wrapKey"]
    );
    const wrappedKey = await crypto.subtle.wrapKey("raw", S.krypteringsNyckel, wrappingKey, { name: "AES-GCM", iv });
    return { wrappedKey: bufferTillBase64(wrappedKey), salt: bufferTillBase64(salt), iv: bufferTillBase64(iv) };
}

export async function importeraNyckelMedLösenord(lösenord, nyckelData) {
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

// ── Lösenordshanterare ─────────────────────────────────────────────────────

async function sparaILösenordshanterare(email, lösenord) {
    if (!window.PasswordCredential || !email) return;
    try {
        await navigator.credentials.store(new PasswordCredential({ id: email, password: lösenord }));
    } catch (e) { console.warn("Kunde inte spara i lösenordshanterare:", e.message); }
}

// ── Onboarding / dialog: ny nyckel ────────────────────────────────────────

// Callback registreras av mentor.js (entry point) för att undvika cirkulär import
let _laggTillBubblaFn = null;
export function registreraLaggTillBubbla(fn) { _laggTillBubblaFn = fn; }

export function visaKrypteringsOnboardingMsg() {
    if (_laggTillBubblaFn) {
        _laggTillBubblaFn("assistant", "🔐 Dina anteckningar krypteras automatiskt på din enhet — AIuda kan inte läsa dem.\n\nKlicka **🔑** i verktygsfältet om du vill skydda dem med ett lösenord och komma åt dem från fler datorer.");
    }
}

// ── Import-dialog (befintlig nyckel i Firebase) ────────────────────────────

export async function visaLösenordsImportDialog(nyckelData, email) {
    return new Promise(resolve => {
        const dialog = document.createElement("div");
        dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:28px;width:340px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.7;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:10px;font-size:13px;">🔐 ${S.t?.mentorLåsUppTitel || "Välkommen tillbaka"}</div>
                <p style="opacity:0.85;margin-bottom:6px;">${S.t?.mentorLåsUppText1 || "Av sekretesskäl är dina projekt krypterade."}</p>
                <p style="opacity:0.6;font-size:11px;margin-bottom:16px;">${S.t?.mentorLåsUppText2 || "Ange ditt lösenord för att låsa upp dem."}</p>
                <input id="import-lösenord" type="password" placeholder="${S.t?.mentorStällFraga || "Ditt lösenord"}" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="import-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;">${S.t?.mentorLåsUppFel || "Fel lösenord — försök igen"}</div>
                <button id="import-ok" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">${S.t?.mentorLåsUppKnapp || "Hämta mina anteckningar →"}</button>
                <button id="import-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.5;font-size:11px;">${S.t?.mentorLåsUppBörjaOm || "Börja om på den här datorn"}</button>
            </div>`;
        document.body.appendChild(dialog);
        setTimeout(() => document.getElementById("import-lösenord")?.focus(), 50);
        document.getElementById("import-ok").addEventListener("click", async () => {
            const lösenord = document.getElementById("import-lösenord").value;
            if (!lösenord) return;
            try {
                S.krypteringsNyckel = await importeraNyckelMedLösenord(lösenord, nyckelData);
                await sparaILösenordshanterare(email, lösenord);
                dialog.remove(); resolve();
            } catch {
                const felEl = document.getElementById("import-fel");
                felEl.textContent = "Fel lösenord — försök igen";
                felEl.style.display = "block";
            }
        });
        document.getElementById("import-lösenord").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("import-ok").click(); });
        document.getElementById("import-skip").addEventListener("click", async () => {
            S.krypteringsNyckel = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
            dialog.remove(); resolve();
        });
    });
}

// ── Ny lösenords-dialog (skapa / byta lösenord) ───────────────────────────

export async function visaLösenordsDialog(email) {
    return new Promise(resolve => {
        const dialog = document.createElement("div");
        dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:28px;width:340px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.7;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:10px;font-size:13px;">🔑 ${S.t?.mentorSkyddaTitel || "Skydda dina anteckningar"}</div>
                <p style="opacity:0.85;margin-bottom:6px;">${S.t?.mentorSkyddaText1 || "Välj ett lösenord för att skydda dina anteckningar."}</p>
                <p style="opacity:0.5;font-size:11px;margin-bottom:16px;">${S.t?.mentorSkyddaText2 || "Utan lösenord är anteckningarna låsta till den här datorn."}</p>
                <input id="ny-lösenord" type="password" placeholder="Välj ett lösenord (minst 8 tecken)" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <input id="ny-lösenord-2" type="password" placeholder="Skriv lösenordet igen" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="lösenord-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;"></div>
                <button id="lösenord-spara" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">${S.t?.mentorSkyddaKnapp || "Skydda mina anteckningar →"}</button>
                <button id="lösenord-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.5;font-size:11px;">${S.t?.mentorSkyddaHoppa || "Bara den här datorn — inget lösenord"}</button>
            </div>`;
        document.body.appendChild(dialog);
        setTimeout(() => document.getElementById("ny-lösenord")?.focus(), 50);
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

// ── Ladda eller skapa nyckel ───────────────────────────────────────────────

export async function laddaEllerSkapaNyckel(email) {
    await chrome.storage.local.remove("aiudaEncryptedKey");

    const fjärrNyckel = await chrome.runtime.sendMessage({ type: "GET_ENCRYPTION_KEY" });

    if (fjärrNyckel?.wrappedKey) {
        if (window.PasswordCredential) {
            try {
                const cred = await navigator.credentials.get({ password: true, mediation: "optional" });
                if (cred?.password) {
                    try {
                        S.krypteringsNyckel = await importeraNyckelMedLösenord(cred.password, fjärrNyckel);
                        return;
                    } catch { /* fel lösenord — faller igenom till manuell dialog */ }
                }
            } catch { /* Credential API ej tillgänglig */ }
        }
        await visaLösenordsImportDialog(fjärrNyckel, email);
        return;
    }

    S.krypteringsNyckel = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
    visaKrypteringsOnboardingMsg();
}
