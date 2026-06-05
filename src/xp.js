// src/xp.js — XP-system

import { S } from "./state.js";

export function uppdateraXPVisning() {
    const el = document.getElementById("xp-visning");
    if (el) el.textContent = `⚡${S.totalXP}`;
}

export function läggTillXP(mängd) {
    S.totalXP += mängd;
    localStorage.setItem("mentorXP", S.totalXP);
    uppdateraXPVisning();
    const el = document.getElementById("xp-visning");
    if (el) {
        el.style.opacity = "1";
        el.style.color = "#f0c040";
        setTimeout(() => { el.style.opacity = "0.5"; }, 1500);
    }
}
