// src/chatt.js — chatt, systemprompt, quiz, kommandotolk

import { S } from "./state.js";
import { laggTillBubbla, visaTänker } from "./ui.js";
import { sparaHistorik } from "./session.js";
import { läggTillXP } from "./xp.js";
import { läggTillKälla, extraheraKällorFrånText, sparaAnteckningarOchTasks, laddaLogg } from "./notat.js";
import { läslogg, setLäslogg } from "./state.js";

// ── Systemprompt ───────────────────────────────────────────────────────────

export function byggSystemprompt() {
    S.systemprompt = `You are an AI research assistant — AIuda Mentor. The user is researching: "${S.aktivtProjekt?.fraga}".

When you need external sources, links or references: silently include [SEARCH: optimized English query] anywhere in your response — the system handles it invisibly. Never mention that you are searching, never show the search tag, never fabricate URLs. Just present the results naturally.

When you receive a message starting with [Web search results for "..."]: use the content silently to inform your response. Never mention the search, never tell the user that search results were shown, never refer to "the results" or "the sources" explicitly unless it adds value. Just respond as if you already knew.

Early in the session, help the user refine their research question:
- If the question is too broad, suggest concrete scope limitations
- When proposing a revised question, format it as: **Revised research question:** "..."

Always respond in the same language as the user's message.`;
}

// ── AI-svar-hantering ──────────────────────────────────────────────────────

export function tolkSvar(svar) {
    if (svar?.error === "quota_exceeded") return "Du har använt alla krediter för denna månad.";
    return svar?.result?.content?.[0]?.text || "Något gick fel.";
}

export async function hanteraAISvar(svar, tänker) {
    let assistantText = tolkSvar(svar);
    const searchMatch = assistantText.match(/\[SEARCH:\s*(.+?)\]/);
    if (searchMatch) {
        const query = searchMatch[1].trim();
        if (query.length < 5) {
            tänker.remove();
            return assistantText.replace(/\[SEARCH:\s*.+?\]/g, "").trim() || assistantText;
        }
        const renText = assistantText.replace(/\[SEARCH:\s*.+?\]/g, "").trim();
        if (renText) S.historik.push({ role: "assistant", content: renText, silent: true });
        const sokSvar = await chrome.runtime.sendMessage({ type: "SEARCH", query });
        if (sokSvar?.results?.length) {
            sokSvar.results.forEach(r => läggTillKälla(r.title, r.url));
            const sokContent = `[Web search results for "${query}"]\n` +
                sokSvar.results.map(r => `${r.title}\n${r.url}\n${r.snippet}`).join("\n\n");
            S.historik.push({ role: "user", content: sokContent, silent: true });
            const finalSvar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt: S.systemprompt, historik: S.historik, model: S.valdModell });
            assistantText = tolkSvar(finalSvar);
        } else {
            assistantText = renText || assistantText;
        }
    }
    extraheraKällorFrånText(assistantText);
    tänker.remove();
    return assistantText;
}

// ── Starta konversation ────────────────────────────────────────────────────

export async function startaKonversation() {
    const fraga = S.t?.forklaraResearch || "Please introduce yourself as my research assistant.";
    S.historik.push({ role: "user", content: fraga, silent: true });
    await sparaHistorik();
    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt: S.systemprompt, historik: S.historik, model: S.valdModell });
    const assistantText = await hanteraAISvar(svar, tänker);
    laggTillBubbla("assistant", assistantText);
    S.historik.push({ role: "assistant", content: assistantText });
    await sparaHistorik(true);
}

// ── Skicka fråga ───────────────────────────────────────────────────────────

let pågårSvar = false;
let avbrutit = false;

export function initAvbryt() {
    document.getElementById("avbryt-knapp").addEventListener("click", () => { avbrutit = true; });
}

export async function skicka(kort = false) {
    const input = document.getElementById("input");
    const text = input.value.trim();
    if (!text || !S.aktivtProjekt || pågårSvar) return;

    if (quizAktivt) {
        laggTillBubbla("user", text, true, new Date().toISOString());
        input.value = "";
        input.style.height = "44px";
        await hanteraQuizSvar(text);
        return;
    }

    pågårSvar = true;
    avbrutit = false;
    document.getElementById("avbryt-knapp").style.display = "inline-block";
    const nu = new Date().toISOString();
    laggTillBubbla("user", text, true, nu);
    S.historik.push({ role: "user", content: text, tid: nu });
    if (kort) {
        S.historik.push({ role: "user", content: "[Kort reflektion — svara måttligt, lägg inte ut till ett nytt ämne]", silent: true });
    }
    input.value = "";
    input.style.height = "44px";
    await sparaHistorik();
    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt: S.systemprompt, historik: S.historik, model: S.valdModell });
    document.getElementById("avbryt-knapp").style.display = "none";
    pågårSvar = false;
    if (avbrutit) {
        avbrutit = false;
        tänker.remove();
        return;
    }
    const assistantText = await hanteraAISvar(svar, tänker);
    const svarTid = new Date().toISOString();
    laggTillBubbla("assistant", assistantText, true, svarTid);
    S.historik.push({ role: "assistant", content: assistantText, tid: svarTid });
    await sparaHistorik(true);
}

// ── Quiz / läxförhör ───────────────────────────────────────────────────────

let quizAktivt = false;
let quizFragor = [];
let quizIndex = 0;
let quizPoäng = 0;
let quizTotalt = 0;

export function initQuiz() {
    document.getElementById("testa-mig-knapp").addEventListener("click", async () => {
        if (quizAktivt) return;
        if (S.historik.filter(m => !m.silent).length < 4) {
            laggTillBubbla("assistant", "_Chatten behöver lite mer innehåll innan jag kan testa dig. Fortsätt konversationen lite till._");
            return;
        }

        const knapp = document.getElementById("testa-mig-knapp");
        knapp.textContent = "⏳";
        knapp.disabled = true;

        const quizPrompt = `Based on our conversation, generate exactly 3 quiz questions to test the user's understanding. Return ONLY valid JSON, no other text:
{
  "questions": [
    {"question": "...", "ideal_answer": "brief ideal answer for evaluation"}
  ]
}
Questions should be open-ended, not yes/no. Language: same as the conversation.`;

        const sessionHistorik = S.historik.slice(S.sessionStartIndex).filter(m => !m.silent);
        const svar = await chrome.runtime.sendMessage({
            type: "CHAT",
            systemprompt: S.systemprompt,
            historik: [...sessionHistorik, { role: "user", content: quizPrompt }],
            model: S.valdModell
        });

        knapp.textContent = "🎓";
        knapp.disabled = false;

        const rawText = svar?.result?.content?.[0]?.text || "";
        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            if (!parsed?.questions?.length) throw new Error("No questions");

            quizFragor = parsed.questions;
            quizIndex = 0;
            quizPoäng = 0;
            quizTotalt = quizFragor.length;
            quizAktivt = true;

            laggTillBubbla("assistant", `🎓 **Läxförhör — ${quizTotalt} frågor**\n\nSvara med egna ord. Inga poäng för ordagranna svar — det handlar om förståelse.\n\n**Fråga 1 av ${quizTotalt}:**\n\n${quizFragor[0].question}`);
        } catch {
            laggTillBubbla("assistant", "_Kunde inte generera frågor just nu. Försök igen._");
        }
    });
}

async function hanteraQuizSvar(text) {
    const fråga = quizFragor[quizIndex];
    const evalPrompt = `The user was asked: "${fråga.question}"
Ideal answer: "${fråga.ideal_answer}"
User answered: "${text}"

Evaluate briefly (1-2 sentences) and give a score: "correct", "partial", or "incorrect".
Return JSON: {"feedback": "...", "score": "correct|partial|incorrect"}`;

    const tänker = visaTänker();
    const svar = await chrome.runtime.sendMessage({
        type: "CHAT",
        systemprompt: S.systemprompt,
        historik: [{ role: "user", content: evalPrompt }],
        model: "claude-haiku-4-5-20251001"
    });
    tänker.remove();

    const rawText = svar?.result?.content?.[0]?.text || "";
    let feedback = "", score = "incorrect";
    try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        feedback = parsed?.feedback || rawText;
        score = parsed?.score || "incorrect";
    } catch {
        feedback = rawText;
    }

    if (score === "correct") quizPoäng += 2;
    else if (score === "partial") quizPoäng += 1;

    const emoji = score === "correct" ? "✅" : score === "partial" ? "🟡" : "❌";
    quizIndex++;

    if (quizIndex < quizTotalt) {
        laggTillBubbla("assistant", `${emoji} ${feedback}\n\n**Fråga ${quizIndex + 1} av ${quizTotalt}:**\n\n${quizFragor[quizIndex].question}`);
    } else {
        quizAktivt = false;
        const maxPoäng = quizTotalt * 2;
        const procent = Math.round((quizPoäng / maxPoäng) * 100);
        laggTillBubbla("assistant", `${emoji} ${feedback}\n\n---\n\n🎓 **Klart! Resultat: ${quizPoäng}/${maxPoäng} poäng (${procent}%)**\n\n${procent >= 80 ? "Utmärkt! Du har greppat materialet väl." : procent >= 50 ? "Bra jobbat — lite mer att sätta sig in i." : "Fortsätt läsa och diskutera — kunskapen sätter sig med tid."}`);
        läggTillXP(quizPoäng * 5);
    }
}
