// src/resize.js — drag-handles för kolumnbredder

export function initResizer(resizerId, vänsterEl, högerEl, spara) {
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

export function initResizerFrånStorage() {
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
}
