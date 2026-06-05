// src/session.js — spara/ladda mentor-session till logg

import { S } from "./state.js";
import { kryptera } from "./kryptering.js";
import { laggTillBubbla } from "./ui.js";
import { läggTillXP } from "./xp.js";
import { laddaLogg } from "./notat.js";
import { sparaHistorikRemote, sparaMentorLogg, chat } from "./api.js";

export async function sparaHistorik(synkaFirebase = false) {
    if (!S.sessionId) return;
    localStorage.setItem(S.sessionId, JSON.stringify({
        namn: S.aktivtProjekt?.namn, fraga: S.aktivtProjekt?.fraga,
        historik: S.historik, bokmärke: S.bokmärke, kontrastKarta: S.kontrastKarta
    }));
    if (synkaFirebase && S.krypteringsNyckel) {
        try {
            const krypteradHistorik = await kryptera(S.historik);
            const krypteradMetadata = await kryptera({ namn: S.aktivtProjekt?.namn || "", fraga: S.aktivtProjekt?.fraga || "" });
            sparaHistorikRemote({ projektId: S.sessionId, krypteradHistorik, krypteradMetadata });
        } catch (e) { console.warn("Backend-sync misslyckades:", e.message); }
    }
}

export async function sparaMentorSession() {
    if (!S.aktivtProjekt || S.historik.filter(m => !m.silent).length < 2) return;

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

    const sessionHistorik = S.historik.slice(S.sessionStartIndex).filter(m => !m.silent);

    if (sessionHistorik.length < 1) {
        sparaKnapp.textContent = "–";
        setTimeout(() => { sparaKnapp.textContent = "💾"; sparaKnapp.disabled = false; }, 1500);
        return;
    }

    const summaryHistorik = [
        ...sessionHistorik,
        { role: "user", content: summaryPrompt }
    ];

    const svar = await chat(S.systemprompt, summaryHistorik);
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
    if (!S.krypteringsNyckel) {
        laggTillBubbla("assistant", "⚠️ Kan inte spara — krypteringsnyckeln saknas. Klicka 🔑 för att sätta ett återställningslösenord.");
        sparaKnapp.textContent = "💾"; sparaKnapp.disabled = false;
        return;
    }
    const krypteratInnehåll = await kryptera(känsligtInnehåll);

    const entry = {
        fraga: S.aktivtProjekt.fraga,
        namn: S.aktivtProjekt.namn,
        projektId: S.sessionId,
        sessionId: S.nuvarandeSessionId,
        krypterat: krypteratInnehåll
    };

    const resultat = await sparaMentorLogg(entry);

    if (resultat?.id) {
        sparaKnapp.textContent = "✓";
        sparaKnapp.classList.add("aktiv");
        laddaLogg();
        läggTillXP(10);
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
