importScripts('locales.js');
console.log("AIuda Mentor background.js laddad");

const BACKEND = "https://annotated-reader-backend.vercel.app";
const FIREBASE_API_KEY = "AIzaSyCmClubetYGavOEVHBUHKQ-_sZZdt-LIWc";

// --- Auth ---
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.type === "AUTH_COMPLETE") {
        chrome.storage.local.set({
            arToken: message.token,
            arRefreshToken: message.refreshToken || null,
            arUser: { email: message.email, name: message.name, photo: message.photo }
        });
        sendResponse({ ok: true });
    }

    // --- Meddelanden från AIuda Reader ---
    if (message.type === "LÄGG_TILL_KÄLLA") {
        // Reader skickar markerad text + URL från aktiv sida
        chrome.storage.local.get("researchSessionId", ({ researchSessionId }) => {
            if (!researchSessionId) return;
            // Öppna sidopanelen och skicka källan dit
            chrome.sidePanel.open({ windowId: sender.tab?.windowId });
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    type: "NY_KÄLLA",
                    url: message.url,
                    fras: message.fras,
                    kategori: message.kategori || "Relevant fynd"
                });
            }, 600);
        });
        sendResponse({ ok: true });
    }
});

async function hämtaToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get("arToken", ({ arToken }) => resolve(arToken || null));
    });
}

async function förnyaToken() {
    const { arRefreshToken } = await chrome.storage.local.get("arRefreshToken");
    if (!arRefreshToken) return null;
    try {
        const resp = await fetch(
            `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(arRefreshToken)}`
            }
        );
        if (!resp.ok) return null;
        const data = await resp.json();
        await chrome.storage.local.set({ arToken: data.id_token, arRefreshToken: data.refresh_token });
        return data.id_token;
    } catch (e) {
        console.error("Token-förnyelse misslyckades:", e);
        return null;
    }
}

async function fetchMedToken(url, options, token) {
    let resp = await fetch(url, {
        ...options,
        headers: { ...options.headers, "Authorization": `Bearer ${token}` }
    });
    if (resp.status === 401) {
        const nyToken = await förnyaToken();
        if (nyToken) {
            resp = await fetch(url, {
                ...options,
                headers: { ...options.headers, "Authorization": `Bearer ${nyToken}` }
            });
        }
    }
    return resp;
}

function loggaTokens(typ, usage) {
    const total = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    const cacheLäst = usage.cache_read_input_tokens || 0;
    console.log(`[${typ}] input: ${usage.input_tokens} | output: ${usage.output_tokens} | cache_read: ${cacheLäst} | TOTALT: ${total}`);
}

// --- Meddelanden från sidopanelen ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "CHAT") {
        chrome.storage.local.get(["modell", "temperature"], async (result) => {
            const modell = result.modell || "claude-opus-4-7";
            const temperature = result.temperature ?? 1.0;
            const token = await hämtaToken();
            if (!token) { sendResponse({ error: "Ej inloggad" }); return; }

            const response = await fetchMedToken(
                `${BACKEND}/api/chat`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        historik: message.historik,
                        systemprompt: message.systemprompt,
                        model: modell,
                        temperature
                    })
                },
                token
            );

            if (response.status === 429) {
                const errData = await response.json().catch(() => ({}));
                sendResponse({ error: "quota_exceeded", plan: errData.plan });
                return;
            }
            const data = await response.json();
            if (data.result?.usage) loggaTokens("CHAT", data.result.usage);
            sendResponse({ result: data.result, error: data.error, plan: data.plan });
        });
        return true;
    }

    if (message.type === "SEARCH") {
        hämtaToken().then(async token => {
            if (!token) { sendResponse({ error: "not_logged_in" }); return; }
            const response = await fetchMedToken(
                `${BACKEND}/api/search`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: message.query })
                },
                token
            );
            if (!response.ok) { sendResponse({ error: "fetch_error" }); return; }
            const data = await response.json();
            sendResponse({ results: data.results });
        });
        return true;
    }

    if (message.type === "TOOLBAR_SEARCH") {
        chrome.search.query({ text: message.query, disposition: "NEW_TAB" });
        sendResponse({});
        return true;
    }

    if (message.type === "SAVE_MENTOR_LOG") {
        hämtaToken().then(token => {
            if (!token) { sendResponse({ error: "Ej inloggad" }); return; }
            fetchMedToken(`${BACKEND}/api/mentor-log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(message.entry)
            }, token).then(async r => {
                const data = await r.json();
                sendResponse(data);
            }).catch(e => sendResponse({ error: e.message }));
        });
        return true;
    }

    if (message.type === "GET_MENTOR_LOG") {
        hämtaToken().then(token => {
            if (!token) { sendResponse({ error: "Ej inloggad" }); return; }
            fetchMedToken(`${BACKEND}/api/mentor-log`, { method: "GET" }, token)
                .then(async r => {
                    const data = await r.json();
                    sendResponse(data);
                }).catch(e => sendResponse({ error: e.message }));
        });
        return true;
    }

    if (message.type === "ÖPPNA_PANEL") {
        chrome.storage.local.get(["researchFraga", "researchSessionId"], ({ researchFraga, researchSessionId }) => {
            const sessionId = researchSessionId || ("ar_research_" + Date.now());
            if (!researchSessionId) chrome.storage.local.set({ researchSessionId: sessionId });
            chrome.sidePanel.open({ windowId: sender.tab?.windowId });
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    type: "OPEN_PANEL",
                    research: true,
                    fraga: researchFraga,
                    markeringId: sessionId
                });
            }, 600);
        });
        sendResponse({});
        return true;
    }
});

// --- Öppna sidopanelen via action-klick ---
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});
