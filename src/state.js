// src/state.js — delad applikationsstate för AIuda Mentor

export const S = {
    historik: [],
    systemprompt: "",
    sessionId: null,
    aktivtProjekt: null,
    nuvarandeSessionId: "session_" + Date.now(),
    sessionStartIndex: 0,
    t: null,           // locale-objekt, sätts vid init
    krypteringsNyckel: null,
    tasks: [],
    sessionKällor: [],
    valdModell: "claude-sonnet-4-6",
    totalXP: 0,
    bokmärke: null,
    bubblaNummer: 0,
    kontrastKarta: {},
};

// Hjälpvariabler som inte passar in i S (icke-serialiserbara)
export let anteckningarSparade = "";
export function setAnteckningarSparade(v) { anteckningarSparade = v; }

export let läslogg = [];
export function setLäslogg(v) { läslogg = v; }
