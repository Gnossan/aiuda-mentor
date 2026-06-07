// src/saldo.js — visa användarens tokensaldo i nav-headern

import { hämtaSaldo, startaCheckout } from "./api.js";

function formatera(antal) {
    if (antal >= 1_000_000) return (antal / 1_000_000).toFixed(antal % 1_000_000 === 0 ? 0 : 1) + "M";
    if (antal >= 1_000) return Math.round(antal / 1_000) + "k";
    return String(antal);
}

export async function uppdateraSaldoVisning() {
    const el = document.getElementById("saldo-visning");
    if (!el) return;
    const svar = await hämtaSaldo().catch(() => null);
    if (!svar || svar.error) {
        el.textContent = "◆ —";
        return;
    }
    const saldo = svar.tokenSaldo ?? 0;
    el.textContent = `◆ ${formatera(saldo)}`;
    el.title = `Tokensaldo: ${saldo.toLocaleString("sv-SE")} — klicka för att köpa fler`;
    el.style.color = saldo <= 0 ? "#e07070" : "#70b0e0";
}

export function initSaldoVisning() {
    const el = document.getElementById("saldo-visning");
    if (!el) return;
    el.addEventListener("click", async () => {
        const svar = await startaCheckout("mentor_tokens_1m");
        if (svar?.url) window.location.href = svar.url;
    });
    uppdateraSaldoVisning();
}
