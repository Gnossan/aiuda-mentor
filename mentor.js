// ⚠️  AUTOGENERERAD FIL — redigera inte direkt!
// Källkod finns i src/. Kör: npm run build
var AiudaMentor = (() => {
  // src/state.js
  var S = {
    historik: [],
    systemprompt: "",
    sessionId: null,
    aktivtProjekt: null,
    nuvarandeSessionId: "session_" + Date.now(),
    sessionStartIndex: 0,
    t: null,
    // locale-objekt, sätts vid init
    krypteringsNyckel: null,
    tasks: [],
    sessionK\u00E4llor: [],
    valdModell: "claude-sonnet-4-6",
    totalXP: 0,
    bokm\u00E4rke: null,
    bubblaNummer: 0,
    kontrastKarta: {}
  };
  var anteckningarSparade = "";
  function setAnteckningarSparade(v) {
    anteckningarSparade = v;
  }
  var l\u00E4slogg = [];
  function setL\u00E4slogg(v) {
    l\u00E4slogg = v;
  }

  // src/kryptering.js
  function bufferTillBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
  function base64TillBuffer(base64) {
    const bin = atob(base64);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  async function kryptera(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const krypterad = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, S.krypteringsNyckel, data);
    return { data: bufferTillBase64(krypterad), iv: bufferTillBase64(iv) };
  }
  async function dekryptera(payload) {
    try {
      const iv = base64TillBuffer(payload.iv);
      const data = base64TillBuffer(payload.data);
      const dekrypterad = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, S.krypteringsNyckel, data);
      return JSON.parse(new TextDecoder().decode(dekrypterad));
    } catch {
      return null;
    }
  }
  async function exporteraNyckelMedL\u00F6senord(l\u00F6senord) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(l\u00F6senord), "PBKDF2", false, ["deriveKey"]);
    const wrappingKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 31e4, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["wrapKey"]
    );
    const wrappedKey = await crypto.subtle.wrapKey("raw", S.krypteringsNyckel, wrappingKey, { name: "AES-GCM", iv });
    return { wrappedKey: bufferTillBase64(wrappedKey), salt: bufferTillBase64(salt), iv: bufferTillBase64(iv) };
  }
  async function importeraNyckelMedL\u00F6senord(l\u00F6senord, nyckelData) {
    const salt = base64TillBuffer(nyckelData.salt);
    const iv = base64TillBuffer(nyckelData.iv);
    const wrappedKey = base64TillBuffer(nyckelData.wrappedKey);
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(l\u00F6senord), "PBKDF2", false, ["deriveKey"]);
    const wrappingKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 31e4, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["unwrapKey"]
    );
    return await crypto.subtle.unwrapKey(
      "raw",
      wrappedKey,
      wrappingKey,
      { name: "AES-GCM", iv },
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }
  async function sparaIL\u00F6senordshanterare(email, l\u00F6senord) {
    if (!window.PasswordCredential || !email) return;
    try {
      await navigator.credentials.store(new PasswordCredential({ id: email, password: l\u00F6senord }));
    } catch (e) {
      console.warn("Kunde inte spara i l\xF6senordshanterare:", e.message);
    }
  }
  var _laggTillBubblaFn = null;
  function registreraLaggTillBubbla(fn) {
    _laggTillBubblaFn = fn;
  }
  function visaKrypteringsOnboardingMsg() {
    if (_laggTillBubblaFn) {
      _laggTillBubblaFn("assistant", "\u{1F510} Dina anteckningar krypteras automatiskt p\xE5 din enhet \u2014 AIuda kan inte l\xE4sa dem.\n\nKlicka **\u{1F511}** i verktygsf\xE4ltet om du vill skydda dem med ett l\xF6senord och komma \xE5t dem fr\xE5n fler datorer.");
    }
  }
  async function visaL\u00F6senordsImportDialog(nyckelData, email) {
    return new Promise((resolve) => {
      const dialog = document.createElement("div");
      dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;`;
      dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:28px;width:340px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.7;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:10px;font-size:13px;">\u{1F510} ${S.t?.mentorL\u00E5sUppTitel || "V\xE4lkommen tillbaka"}</div>
                <p style="opacity:0.85;margin-bottom:6px;">${S.t?.mentorL\u00E5sUppText1 || "Av sekretessk\xE4l \xE4r dina projekt krypterade."}</p>
                <p style="opacity:0.6;font-size:11px;margin-bottom:16px;">${S.t?.mentorL\u00E5sUppText2 || "Ange ditt l\xF6senord f\xF6r att l\xE5sa upp dem."}</p>
                <input id="import-l\xF6senord" type="password" placeholder="${S.t?.mentorSt\u00E4llFraga || "Ditt l\xF6senord"}" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="import-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;">${S.t?.mentorL\u00E5sUppFel || "Fel l\xF6senord \u2014 f\xF6rs\xF6k igen"}</div>
                <button id="import-ok" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">${S.t?.mentorL\u00E5sUppKnapp || "H\xE4mta mina anteckningar \u2192"}</button>
                <button id="import-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.5;font-size:11px;">${S.t?.mentorL\u00E5sUppB\u00F6rjaOm || "B\xF6rja om p\xE5 den h\xE4r datorn"}</button>
            </div>`;
      document.body.appendChild(dialog);
      setTimeout(() => document.getElementById("import-l\xF6senord")?.focus(), 50);
      document.getElementById("import-ok").addEventListener("click", async () => {
        const l\u00F6senord = document.getElementById("import-l\xF6senord").value;
        if (!l\u00F6senord) return;
        try {
          S.krypteringsNyckel = await importeraNyckelMedL\u00F6senord(l\u00F6senord, nyckelData);
          await sparaIL\u00F6senordshanterare(email, l\u00F6senord);
          dialog.remove();
          resolve();
        } catch {
          const felEl = document.getElementById("import-fel");
          felEl.textContent = "Fel l\xF6senord \u2014 f\xF6rs\xF6k igen";
          felEl.style.display = "block";
        }
      });
      document.getElementById("import-l\xF6senord").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("import-ok").click();
      });
      document.getElementById("import-skip").addEventListener("click", async () => {
        S.krypteringsNyckel = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
        dialog.remove();
        resolve();
      });
    });
  }
  async function visaL\u00F6senordsDialog(email) {
    return new Promise((resolve) => {
      const dialog = document.createElement("div");
      dialog.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;`;
      dialog.innerHTML = `
            <div style="background:#1a1610;border:1px solid #333;border-radius:10px;padding:28px;width:340px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.7;">
                <div style="color:#f0c040;font-weight:600;margin-bottom:10px;font-size:13px;">\u{1F511} ${S.t?.mentorSkyddaTitel || "Skydda dina anteckningar"}</div>
                <p style="opacity:0.85;margin-bottom:6px;">${S.t?.mentorSkyddaText1 || "V\xE4lj ett l\xF6senord f\xF6r att skydda dina anteckningar."}</p>
                <p style="opacity:0.5;font-size:11px;margin-bottom:16px;">${S.t?.mentorSkyddaText2 || "Utan l\xF6senord \xE4r anteckningarna l\xE5sta till den h\xE4r datorn."}</p>
                <input id="ny-l\xF6senord" type="password" placeholder="V\xE4lj ett l\xF6senord (minst 8 tecken)" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <input id="ny-l\xF6senord-2" type="password" placeholder="Skriv l\xF6senordet igen" style="width:100%;padding:9px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:8px;box-sizing:border-box;">
                <div id="l\xF6senord-fel" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;"></div>
                <button id="l\xF6senord-spara" style="width:100%;padding:10px;background:#f0c040;color:#1a1610;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-family:inherit;margin-bottom:8px;">${S.t?.mentorSkyddaKnapp || "Skydda mina anteckningar \u2192"}</button>
                <button id="l\xF6senord-skip" style="width:100%;padding:8px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:6px;cursor:pointer;font-family:inherit;opacity:0.5;font-size:11px;">${S.t?.mentorSkyddaHoppa || "Bara den h\xE4r datorn \u2014 inget l\xF6senord"}</button>
            </div>`;
      document.body.appendChild(dialog);
      setTimeout(() => document.getElementById("ny-l\xF6senord")?.focus(), 50);
      document.getElementById("l\xF6senord-spara").addEventListener("click", async () => {
        const l\u00F6senord = document.getElementById("ny-l\xF6senord").value;
        const l\u00F6senord2 = document.getElementById("ny-l\xF6senord-2").value;
        const felEl = document.getElementById("l\xF6senord-fel");
        if (!l\u00F6senord || l\u00F6senord.length < 8) {
          felEl.textContent = "Minst 8 tecken";
          felEl.style.display = "block";
          return;
        }
        if (l\u00F6senord !== l\u00F6senord2) {
          felEl.textContent = "L\xF6senorden matchar inte";
          felEl.style.display = "block";
          return;
        }
        const nyckelData = await exporteraNyckelMedL\u00F6senord(l\u00F6senord);
        const resultat = await chrome.runtime.sendMessage({ type: "SAVE_ENCRYPTION_KEY", nyckelData });
        if (resultat?.ok) {
          await sparaIL\u00F6senordshanterare(email, l\u00F6senord);
          dialog.remove();
          resolve(true);
        } else {
          felEl.textContent = "Kunde inte spara";
          felEl.style.display = "block";
        }
      });
      document.getElementById("l\xF6senord-skip").addEventListener("click", () => {
        dialog.remove();
        resolve(false);
      });
    });
  }
  async function laddaEllerSkapaNyckel(email) {
    await chrome.storage.local.remove("aiudaEncryptedKey");
    const fj\u00E4rrNyckel = await chrome.runtime.sendMessage({ type: "GET_ENCRYPTION_KEY" });
    if (fj\u00E4rrNyckel?.wrappedKey) {
      if (window.PasswordCredential) {
        try {
          const cred = await navigator.credentials.get({ password: true, mediation: "optional" });
          if (cred?.password) {
            try {
              S.krypteringsNyckel = await importeraNyckelMedL\u00F6senord(cred.password, fj\u00E4rrNyckel);
              return;
            } catch {
            }
          }
        } catch {
        }
      }
      await visaL\u00F6senordsImportDialog(fj\u00E4rrNyckel, email);
      return;
    }
    S.krypteringsNyckel = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    visaKrypteringsOnboardingMsg();
  }

  // src/xp.js
  function uppdateraXPVisning() {
    const el = document.getElementById("xp-visning");
    if (el) el.textContent = `\u26A1${S.totalXP}`;
  }
  function l\u00E4ggTillXP(m\u00E4ngd) {
    S.totalXP += m\u00E4ngd;
    chrome.storage.local.set({ mentorXP: S.totalXP });
    uppdateraXPVisning();
    const el = document.getElementById("xp-visning");
    if (el) {
      el.style.opacity = "1";
      el.style.color = "#f0c040";
      setTimeout(() => {
        el.style.opacity = "0.5";
      }, 1500);
    }
  }

  // src/ui.js
  function formateraBubblaTid(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const idag = /* @__PURE__ */ new Date();
    const \u00E4rIdag = d.toDateString() === idag.toDateString();
    if (\u00E4rIdag) return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  }
  function laggTillBubbla(roll, text, skrolla = true, tid = null) {
    const idx = S.bubblaNummer++;
    const div = document.createElement("div");
    div.className = `bubbla ${roll}`;
    div.dataset.bubbleIdx = idx;
    if (roll === "assistant") div.innerHTML = DOMPurify.sanitize(marked.parse(text));
    else div.textContent = text;
    const container = document.getElementById("meddelanden");
    container.appendChild(div);
    if (tid) {
      const tidEl = document.createElement("div");
      tidEl.className = "bubbla-tid";
      tidEl.textContent = formateraBubblaTid(tid);
      container.appendChild(tidEl);
    }
    if (skrolla) {
      if (roll === "assistant") div.scrollIntoView({ behavior: "smooth", block: "start" });
      else container.scrollTop = container.scrollHeight;
    }
  }
  function visaT\u00E4nker() {
    const div = document.createElement("div");
    div.className = "ar-t\xE4nker";
    div.innerHTML = "<span></span><span></span><span></span>";
    const container = document.getElementById("meddelanden");
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  // src/bokmärke.js
  function getCharOffset(bubbleEl, range) {
    const walker = document.createTreeWalker(bubbleEl, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let node;
    while (node = walker.nextNode()) {
      if (node === range.startContainer) return offset + range.startOffset;
      offset += node.textContent.length;
    }
    return offset;
  }
  function ins\u00E4ttBokm\u00E4rkesMark\u00F6r(bubbleEl, charOffset) {
    const walker = document.createTreeWalker(bubbleEl, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let node;
    while (node = walker.nextNode()) {
      const len = node.textContent.length;
      if (offset + len >= charOffset) {
        const range = document.createRange();
        const localOffset = Math.min(charOffset - offset, len);
        range.setStart(node, localOffset);
        range.collapse(true);
        const marker = document.createElement("span");
        marker.className = "aiuda-bm-marker";
        marker.title = "Bokm\xE4rke \u2014 klicka f\xF6r att ta bort";
        marker.textContent = "\u{1F516}";
        range.insertNode(marker);
        return;
      }
      offset += len;
    }
  }
  function s\u00E4ttBokm\u00E4rke(bubbleIdx, charOffset) {
    document.querySelector(".aiuda-bm-marker")?.remove();
    const hoppBtn = document.getElementById("bokm\xE4rk-hopp");
    if (bubbleIdx >= 0) {
      S.bokm\u00E4rke = { bubbleIdx, charOffset };
      const el = document.querySelector(`[data-bubble-idx="${bubbleIdx}"]`);
      if (el) ins\u00E4ttBokm\u00E4rkesMark\u00F6r(el, charOffset);
      if (hoppBtn) hoppBtn.style.display = "inline-block";
    } else {
      S.bokm\u00E4rke = null;
      if (hoppBtn) hoppBtn.style.display = "none";
    }
    if (S.sessionId) {
      chrome.storage.local.set({
        [S.sessionId]: { namn: S.aktivtProjekt?.namn, fraga: S.aktivtProjekt?.fraga, historik: S.historik, bokm\u00E4rke: S.bokm\u00E4rke, kontrastKarta: S.kontrastKarta }
      });
    }
  }
  function \u00E5terst\u00E4llBokm\u00E4rke() {
    if (!S.bokm\u00E4rke) return;
    const el = document.querySelector(`[data-bubble-idx="${S.bokm\u00E4rke.bubbleIdx}"]`);
    if (el) {
      ins\u00E4ttBokm\u00E4rkesMark\u00F6r(el, S.bokm\u00E4rke.charOffset);
      document.getElementById("bokm\xE4rk-hopp").style.display = "inline-block";
    }
  }
  function \u00E5terst\u00E4llKontrast() {
    for (const [nyckel, opacity] of Object.entries(S.kontrastKarta)) {
      const [bubbleIdx, elPart] = nyckel.split(":");
      const bubbla = document.querySelector(`[data-bubble-idx="${bubbleIdx}"]`);
      if (!bubbla) continue;
      if (elPart === "self") {
        bubbla.style.opacity = opacity;
        bubbla.dataset.kontrastOpacity = opacity;
      } else {
        const syskon = Array.from(bubbla.querySelectorAll("p, li, h1, h2, h3, h4, blockquote, pre, td, th"));
        const el = syskon[parseInt(elPart)];
        if (el) {
          el.style.opacity = opacity;
          el.dataset.kontrastOpacity = opacity;
        }
      }
    }
  }
  function kontrastNyckel(bubbla, textEl) {
    const bubbleIdx = bubbla.dataset.bubbleIdx ?? "-1";
    if (bubbla.classList.contains("user")) return `${bubbleIdx}:self`;
    const syskon = Array.from(bubbla.querySelectorAll("p, li, h1, h2, h3, h4, blockquote, pre, td, th"));
    const elIdx = syskon.indexOf(textEl);
    return `${bubbleIdx}:${elIdx}`;
  }
  function initBokm\u00E4rke() {
    document.getElementById("bokm\xE4rk-hopp").addEventListener("click", () => {
      const marker = document.querySelector(".aiuda-bm-marker");
      if (marker) marker.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    let kontrastSparTimer = null;
    document.getElementById("meddelanden").addEventListener("wheel", (e) => {
      if (!e.altKey) return;
      e.preventDefault();
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const bubbla = under?.closest(".bubbla");
      if (!bubbla) return;
      const textEl = under.closest("p, li, h1, h2, h3, h4, blockquote, pre, td, th") ?? (bubbla.classList.contains("user") ? bubbla : null);
      if (!textEl) return;
      const nuvarande = parseFloat(textEl.dataset.kontrastOpacity) || 1;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const n\u00E4sta = Math.min(1, Math.max(0.15, Math.round((nuvarande + delta) * 10) / 10));
      textEl.dataset.kontrastOpacity = n\u00E4sta;
      textEl.style.opacity = n\u00E4sta;
      const nyckel = kontrastNyckel(bubbla, textEl);
      if (n\u00E4sta < 1) {
        S.kontrastKarta[nyckel] = n\u00E4sta;
      } else {
        delete S.kontrastKarta[nyckel];
      }
      clearTimeout(kontrastSparTimer);
      kontrastSparTimer = setTimeout(() => {
        if (S.sessionId) chrome.storage.local.set({
          [S.sessionId]: { namn: S.aktivtProjekt?.namn, fraga: S.aktivtProjekt?.fraga, historik: S.historik, bokm\u00E4rke: S.bokm\u00E4rke, kontrastKarta: S.kontrastKarta }
        });
      }, 800);
    }, { passive: false });
    document.getElementById("h\xF6ger").addEventListener("wheel", (e) => {
      if (!e.altKey) return;
      e.preventDefault();
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const textEl = under?.closest(
        ".task-item, .k\xE4ll-entry, .logg-entry, p, li, h1, h2, h3, h4, blockquote, pre, td, th"
      );
      if (!textEl) return;
      const nuvarande = parseFloat(textEl.dataset.kontrastOpacity) || 1;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const n\u00E4sta = Math.min(1, Math.max(0.15, Math.round((nuvarande + delta) * 10) / 10));
      textEl.dataset.kontrastOpacity = n\u00E4sta;
      textEl.style.opacity = n\u00E4sta;
    }, { passive: false });
  }

  // src/notat.js
  async function laddaAnteckningarOchTasks() {
    if (S.krypteringsNyckel) {
      try {
        const fj\u00E4rr = await chrome.runtime.sendMessage({ type: "LOAD_ANTECKNINGAR", projektId: S.sessionId });
        if (fj\u00E4rr?.krypteradAnteckningar) {
          const dekrypterad = await dekryptera(fj\u00E4rr.krypteradAnteckningar);
          document.getElementById("anteckningar-area").value = dekrypterad.anteckningar || "";
          setAnteckningarSparade(dekrypterad.anteckningar || "");
          S.tasks = dekrypterad.tasks || [];
          renderaTasks();
          await chrome.storage.local.set({
            [`anteckningar_${S.sessionId}`]: { anteckningar: dekrypterad.anteckningar || "", tasks: dekrypterad.tasks || [] }
          });
        }
        if (fj\u00E4rr?.krypteradeK\u00E4llor) {
          const dekK\u00E4llor = await dekryptera(fj\u00E4rr.krypteradeK\u00E4llor);
          S.sessionK\u00E4llor = (dekK\u00E4llor || []).map((k) => ({ ...k, tid: new Date(k.tid) }));
          renderaK\u00E4llor();
        }
        if (fj\u00E4rr?.krypteradL\u00E4slogg) {
          const dekL\u00E4slogg = await dekryptera(fj\u00E4rr.krypteradL\u00E4slogg);
          setL\u00E4slogg(dekL\u00E4slogg || []);
          renderaL\u00E4slogg();
        }
        if (fj\u00E4rr?.krypteradAnteckningar || fj\u00E4rr?.krypteradeK\u00E4llor || fj\u00E4rr?.krypteradL\u00E4slogg) return;
      } catch (e) {
        console.warn("Firebase-laddning misslyckades:", e.message);
      }
    }
    const sparad = await chrome.storage.local.get(`anteckningar_${S.sessionId}`);
    const data = sparad[`anteckningar_${S.sessionId}`] || {};
    document.getElementById("anteckningar-area").value = data.anteckningar || "";
    setAnteckningarSparade(data.anteckningar || "");
    S.tasks = data.tasks || [];
    renderaTasks();
  }
  async function sparaAnteckningarOchTasks(synkaFirebase = false) {
    const anteckningar = document.getElementById("anteckningar-area").value;
    await chrome.storage.local.set({
      [`anteckningar_${S.sessionId}`]: { anteckningar, tasks: S.tasks }
    });
    if (synkaFirebase && S.krypteringsNyckel) {
      try {
        const krypteradAnteckningar = await kryptera({ anteckningar, tasks: S.tasks });
        chrome.runtime.sendMessage({
          type: "SAVE_ANTECKNINGAR",
          data: { projektId: S.sessionId, krypteradAnteckningar }
        });
      } catch (e) {
        console.warn("Firebase-sync av anteckningar misslyckades:", e.message);
      }
    }
  }
  function l\u00E4ggTillTask() {
    const input = document.getElementById("ny-task-input");
    const text = input.value.trim();
    if (!text || !S.aktivtProjekt) return;
    S.tasks.push({ id: Date.now(), text, klar: false });
    input.value = "";
    renderaTasks();
    sparaAnteckningarOchTasks(true);
  }
  function renderaTasks() {
    const lista = document.getElementById("task-lista");
    if (!S.tasks.length) {
      lista.innerHTML = `<div style="padding:12px;font-size:11px;opacity:0.3;">${S.t?.mentorIngaTasks || "Inga tasks \xE4nnu"}</div>`;
      return;
    }
    lista.innerHTML = "";
    S.tasks.forEach((task) => {
      const div = document.createElement("div");
      div.className = `task-item ${task.klar ? "klar" : ""}`;
      div.dataset.id = task.id;
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = task.klar;
      cb.id = `task-${task.id}`;
      const label = document.createElement("label");
      label.htmlFor = `task-${task.id}`;
      label.textContent = task.text;
      const btn = document.createElement("button");
      btn.className = "task-ta-bort";
      btn.dataset.id = task.id;
      btn.textContent = "\u2715";
      div.append(cb, label, btn);
      lista.appendChild(div);
    });
    lista.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = parseInt(cb.closest(".task-item").dataset.id);
        const task = S.tasks.find((t) => t.id === id);
        if (task) {
          task.klar = cb.checked;
          renderaTasks();
          sparaAnteckningarOchTasks(true);
        }
      });
    });
    lista.querySelectorAll(".task-ta-bort").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        S.tasks = S.tasks.filter((t) => t.id !== id);
        renderaTasks();
        sparaAnteckningarOchTasks(true);
      });
    });
  }
  var k\u00E4llorTimeout;
  function l\u00E4ggTillK\u00E4lla(titel, url) {
    if (!url || !url.startsWith("http")) return;
    if (S.sessionK\u00E4llor.some((k) => k.url === url)) return;
    S.sessionK\u00E4llor.push({ titel: titel || url, url, tid: /* @__PURE__ */ new Date() });
    renderaK\u00E4llor();
    l\u00E4ggTillXP(2);
    clearTimeout(k\u00E4llorTimeout);
    k\u00E4llorTimeout = setTimeout(sparaK\u00E4llor, 2e3);
  }
  async function sparaK\u00E4llor() {
    if (!S.krypteringsNyckel || !S.sessionId || !S.sessionK\u00E4llor.length) return;
    try {
      const krypteradeK\u00E4llor = await kryptera(S.sessionK\u00E4llor.map((k) => ({ ...k, tid: k.tid.toISOString() })));
      chrome.runtime.sendMessage({
        type: "SAVE_ANTECKNINGAR",
        data: { projektId: S.sessionId, krypteradeK\u00E4llor }
      });
    } catch (e) {
      console.warn("Firebase-sync av k\xE4llor misslyckades:", e.message);
    }
  }
  function renderaK\u00E4llor() {
    const lista = document.getElementById("k\xE4ll-lista");
    if (!lista) return;
    if (!S.sessionK\u00E4llor.length) {
      lista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">${S.t?.mentorIngaK\u00E4llor || "Inga k\xE4llor \xE4nnu"}</div>`;
      return;
    }
    lista.innerHTML = "";
    S.sessionK\u00E4llor.forEach((k) => {
      const div = document.createElement("div");
      div.className = "k\xE4ll-entry";
      const titel = document.createElement("div");
      titel.className = "k\xE4ll-titel";
      titel.textContent = k.titel;
      const url = document.createElement("div");
      url.className = "k\xE4ll-url";
      url.textContent = k.url;
      url.title = k.url;
      url.addEventListener("click", () => chrome.tabs.create({ url: k.url }));
      const tid = document.createElement("div");
      tid.style.cssText = "font-size:10px;opacity:0.35;margin-top:2px;";
      tid.textContent = k.tid.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) + " \xB7 " + k.tid.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
      div.append(titel, url, tid);
      lista.appendChild(div);
    });
  }
  function extraheraK\u00E4llorFr\u00E5nText(text) {
    const mdReg = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = mdReg.exec(text)) !== null) {
      l\u00E4ggTillK\u00E4lla(match[1], match[2]);
    }
  }
  var l\u00E4sloggTimeout;
  function renderaL\u00E4slogg() {
    const lista = document.getElementById("l\xE4slogg-lista");
    if (!lista) return;
    const log = l\u00E4slogg;
    if (!log.length) {
      lista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">Klicka \u{1F4D6} f\xF6r att l\xE4gga till annoterade sidor.</div>`;
      return;
    }
    lista.innerHTML = "";
    log.forEach((e) => {
      const div = document.createElement("div");
      div.className = "logg-entry";
      const titel = document.createElement("div");
      titel.style.cssText = "font-weight:600;font-size:11px;margin-bottom:3px;";
      titel.textContent = e.title || e.url;
      const url = document.createElement("div");
      url.style.cssText = "font-size:10px;opacity:0.5;color:#f0c040;cursor:pointer;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
      url.textContent = e.url;
      url.addEventListener("click", () => chrome.tabs.create({ url: e.url }));
      const sammanfattning = document.createElement("div");
      sammanfattning.style.cssText = "font-size:11px;opacity:0.7;line-height:1.5;margin-bottom:4px;";
      sammanfattning.textContent = e.sammanfattning || "";
      const tid = document.createElement("div");
      tid.style.cssText = "font-size:10px;opacity:0.3;";
      tid.textContent = e.tid ? new Date(e.tid).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) + " " + new Date(e.tid).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "";
      const radera = document.createElement("button");
      radera.textContent = "\u2715";
      radera.style.cssText = "float:right;background:none;border:none;color:#f5f0e8;opacity:0.3;cursor:pointer;font-size:12px;padding:0;margin-left:6px;";
      radera.addEventListener("click", () => {
        setL\u00E4slogg(l\u00E4slogg.filter((x) => x.url !== e.url));
        renderaL\u00E4slogg();
        clearTimeout(l\u00E4sloggTimeout);
        l\u00E4sloggTimeout = setTimeout(sparaL\u00E4slogg, 2e3);
      });
      titel.prepend(radera);
      div.append(titel, url, sammanfattning, tid);
      lista.appendChild(div);
    });
  }
  async function sparaL\u00E4slogg() {
    if (!S.krypteringsNyckel || !S.sessionId || !l\u00E4slogg.length) return;
    try {
      const krypteradL\u00E4slogg = await kryptera(l\u00E4slogg);
      chrome.runtime.sendMessage({
        type: "SAVE_ANTECKNINGAR",
        data: { projektId: S.sessionId, krypteradL\u00E4slogg }
      });
    } catch (e) {
      console.warn("Firebase-sync av l\xE4slogg misslyckades:", e.message);
    }
  }
  async function laddaLogg() {
    const loggLista = document.getElementById("logg-lista");
    loggLista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">H\xE4mtar logg\u2026</div>`;
    const svar = await chrome.runtime.sendMessage({
      type: "GET_MENTOR_LOG",
      projektId: S.aktivtProjekt?.projektId || S.aktivtProjekt?.id
    });
    if (!svar?.entries?.length) {
      loggLista.innerHTML = `<div style="opacity:0.4;font-size:11px;padding:12px;">${S.t?.mentorIngaLogg || "Inga sparade sessioner \xE4nnu"}</div>`;
      return;
    }
    const poster = await Promise.all(svar.entries.map(async (e) => {
      let inneh\u00E5ll = { sammanfattning: "", nyckelord: [] };
      if (e.krypterat) {
        const dekrypterat = await dekryptera(e.krypterat);
        if (dekrypterat) inneh\u00E5ll = dekrypterat;
        else inneh\u00E5ll.sammanfattning = "\u{1F510} Kan inte dekryptera";
      } else {
        inneh\u00E5ll = { sammanfattning: e.sammanfattning, nyckelord: e.nyckelord || [] };
      }
      return { ...e, ...inneh\u00E5ll };
    }));
    loggLista.innerHTML = DOMPurify.sanitize(poster.map((e) => `
        <div class="logg-entry">
            <div class="logg-tidsstampel">${formateraLoggDatum(e.timestamp)}</div>
            <div class="logg-sammanfattning">${e.sammanfattning || ""}</div>
            ${e.nyckelord?.length ? `<div class="logg-nyckelord">${e.nyckelord.map((k) => `<span>${k}</span>`).join("")}</div>` : ""}
        </div>
    `).join(""));
  }
  function formateraLoggDatum(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }) + ", " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  }

  // src/highlight.js
  var HL_F\u00C4RGER = [
    { namn: "viktigt", label: "Viktigt", bg: "rgba(255,210,0,0.35)", border: "rgba(255,210,0,0.7)" },
    { namn: "fakta", label: "Fakta", bg: "rgba(80,200,120,0.35)", border: "rgba(80,200,120,0.7)" },
    { namn: "kontext", label: "Kontext", bg: "rgba(90,160,255,0.35)", border: "rgba(90,160,255,0.7)" },
    { namn: "definition", label: "Definition", bg: "rgba(190,110,255,0.35)", border: "rgba(190,110,255,0.7)" },
    { namn: "kritik", label: "Kritik", bg: "rgba(255,90,90,0.35)", border: "rgba(255,90,90,0.7)" }
  ];
  var hlToolbar = null;
  function taBortHlToolbar() {
    hlToolbar?.remove();
    hlToolbar = null;
  }
  function l\u00E4ggTillINotat(text) {
    const area = document.getElementById("anteckningar-area");
    if (!area) return;
    const befintligt = area.value.trim();
    const ny = befintligt ? befintligt + "\n\n" + text : text;
    area.value = ny;
    area.dispatchEvent(new Event("input"));
  }
  function appliceraPennf\u00E4rg(f\u00E4rg) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const markerad = sel.toString().trim();
    if (!markerad) return;
    try {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.className = "aiuda-hl";
      span.dataset.hlF\u00E4rg = f\u00E4rg.namn;
      span.style.cssText = `background:${f\u00E4rg.bg};border-bottom:2px solid ${f\u00E4rg.border};border-radius:2px;cursor:pointer;padding:0 1px;`;
      span.title = `${f\u00E4rg.label} \u2014 klicka f\xF6r att ta bort`;
      try {
        range.surroundContents(span);
      } catch {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
      sel.removeAllRanges();
      l\u00E4ggTillINotat(`[${f\u00E4rg.label}] "${markerad}"`);
      sparaAnteckningarOchTasks();
    } catch (e) {
      console.warn("Highlight misslyckades:", e.message);
    }
  }
  function visaHlToolbar(x, y) {
    taBortHlToolbar();
    const toolbar = document.createElement("div");
    toolbar.id = "aiuda-hl-toolbar";
    toolbar.style.cssText = `
        position:fixed;left:${x}px;top:${y - 44}px;
        background:#1a1610;border:1px solid #444;border-radius:8px;
        padding:6px 8px;display:flex;gap:6px;align-items:center;
        z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.5);
    `;
    HL_F\u00C4RGER.forEach((f) => {
      const knapp = document.createElement("button");
      knapp.title = f.label;
      knapp.style.cssText = `
            width:22px;height:22px;border-radius:50%;cursor:pointer;
            background:${f.bg};border:2px solid ${f.border};
            transition:transform 0.1s;
        `;
      knapp.addEventListener("mouseenter", () => knapp.style.transform = "scale(1.2)");
      knapp.addEventListener("mouseleave", () => knapp.style.transform = "");
      knapp.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        appliceraPennf\u00E4rg(f);
        taBortHlToolbar();
      });
      toolbar.appendChild(knapp);
    });
    const radera = document.createElement("button");
    radera.textContent = "\u2715";
    radera.title = "Ta bort markering";
    radera.style.cssText = `
        width:22px;height:22px;border-radius:50%;cursor:pointer;
        background:transparent;border:1px solid #555;color:#f5f0e8;
        font-size:11px;opacity:0.6;transition:opacity 0.15s;
    `;
    radera.addEventListener("mouseenter", () => radera.style.opacity = "1");
    radera.addEventListener("mouseleave", () => radera.style.opacity = "0.6");
    radera.addEventListener("mousedown", (e) => {
      e.preventDefault();
      taBortHlToolbar();
    });
    toolbar.appendChild(radera);
    document.body.appendChild(toolbar);
    hlToolbar = toolbar;
    const r = toolbar.getBoundingClientRect();
    if (r.right > window.innerWidth) toolbar.style.left = `${x - r.width}px`;
    if (r.top < 0) toolbar.style.top = `${y + 10}px`;
  }
  function visaLookupLadd(x, y, word) {
    document.getElementById("ar-lookup-popup")?.remove();
    const popup = document.createElement("div");
    popup.id = "ar-lookup-popup";
    popup.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#1a1610;color:#f5f0e8;padding:12px 14px;border-radius:8px;font-family:'DM Mono',monospace;font-size:13px;max-width:260px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.5);line-height:1.5;border:1px solid #333;`;
    popup.innerHTML = `<div style="font-weight:600;margin-bottom:8px;">${DOMPurify.sanitize(word)}</div><div><span class="ar-t\xE4nker-dot"></span><span class="ar-t\xE4nker-dot"></span><span class="ar-t\xE4nker-dot"></span></div>`;
    document.body.appendChild(popup);
  }
  function visaLookupPopup(x, y, word, definition) {
    document.getElementById("ar-lookup-popup")?.remove();
    const popup = document.createElement("div");
    popup.id = "ar-lookup-popup";
    popup.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#1a1610;color:#f5f0e8;padding:12px 14px;border-radius:8px;font-family:'DM Mono',monospace;font-size:13px;max-width:260px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.5);line-height:1.5;border:1px solid #333;`;
    const st\u00E4ng = document.createElement("button");
    st\u00E4ng.textContent = "\xD7";
    st\u00E4ng.style.cssText = "position:absolute;top:6px;right:8px;background:transparent;border:none;color:#f5f0e8;opacity:0.4;cursor:pointer;font-size:16px;line-height:1;";
    st\u00E4ng.addEventListener("click", () => popup.remove());
    const rubrik = document.createElement("div");
    rubrik.style.cssText = "font-weight:600;margin-bottom:6px;padding-right:16px;color:#f0c040;";
    rubrik.textContent = word;
    const textEl = document.createElement("div");
    textEl.textContent = definition;
    popup.append(st\u00E4ng, rubrik, textEl);
    document.body.appendChild(popup);
    setTimeout(() => {
      document.addEventListener("mousedown", () => popup.remove(), { once: true });
    }, 100);
  }
  function initHighlight() {
    let lookupKnapp = null;
    const lookupTargets = [
      document.getElementById("meddelanden"),
      document.getElementById("input")
    ];
    lookupTargets.forEach((target) => target.addEventListener("mouseup", (e) => {
      if (e.target === lookupKnapp || e.target.closest?.("#ar-lookup-popup")) return;
      lookupKnapp?.remove();
      lookupKnapp = null;
      let text, rect;
      if (e.currentTarget.tagName === "TEXTAREA") {
        const ta = e.currentTarget;
        text = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
        if (!text || text.length > 300) return;
        rect = ta.getBoundingClientRect();
      } else {
        const urval = window.getSelection();
        if (!urval || urval.isCollapsed) return;
        text = urval.toString().trim().replace(/\s+/g, " ");
        if (!text || text.length > 300) return;
        rect = urval.getRangeAt(0).getBoundingClientRect();
      }
      const knapp = document.createElement("button");
      knapp.textContent = "?";
      const knappLeft = e.currentTarget.tagName === "TEXTAREA" ? rect.right - 28 : Math.min(rect.right + 6, window.innerWidth - 36);
      const knappTop = e.currentTarget.tagName === "TEXTAREA" ? rect.top - 28 : rect.top - 4;
      knapp.style.cssText = `
            position:fixed;
            left:${knappLeft}px;
            top:${knappTop}px;
            background:#1a1610;color:#f0c040;
            border:1px solid #f0c040;border-radius:50%;
            width:22px;height:22px;font-size:13px;font-weight:700;
            cursor:pointer;z-index:9998;padding:0;line-height:1;
            font-family:sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.4);
        `;
      document.body.appendChild(knapp);
      lookupKnapp = knapp;
      knapp.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const knappRect = knapp.getBoundingClientRect();
        knapp.remove();
        lookupKnapp = null;
        const x = Math.min(knappRect.right + 8, window.innerWidth - 280);
        const y = Math.min(knappRect.bottom + 8, window.innerHeight - 120);
        visaLookupLadd(x, y, text);
        try {
          const resp = await fetch("https://annotated-reader-backend.vercel.app/api/word-lookup-free", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Extension-Id": chrome.runtime.id },
            body: JSON.stringify({ word: text, lang: S.t?.datumLocale?.split("-")[0] || "en" })
          });
          const data = await resp.json();
          if (data.definition) {
            visaLookupPopup(x, y, text, data.definition);
          } else {
            document.getElementById("ar-lookup-popup")?.remove();
          }
        } catch {
          document.getElementById("ar-lookup-popup")?.remove();
        }
      });
    }));
    document.addEventListener("mousedown", (e) => {
      if (e.target === lookupKnapp) return;
      lookupKnapp?.remove();
      lookupKnapp = null;
    });
    document.getElementById("meddelanden")?.addEventListener("mouseup", (e) => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
        const node = sel.anchorNode;
        if (!node) return;
        const bubbla = node.parentElement?.closest?.(".bubbla");
        if (!bubbla) return;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        visaHlToolbar(rect.left, rect.top);
      }, 10);
    });
    document.getElementById("meddelanden")?.addEventListener("click", (e) => {
      const hl = e.target.closest(".aiuda-hl");
      if (!hl) return;
      const parent = hl.parentNode;
      while (hl.firstChild) parent.insertBefore(hl.firstChild, hl);
      parent.removeChild(hl);
      taBortHlToolbar();
    });
    document.addEventListener("mousedown", (e) => {
      if (hlToolbar && !hlToolbar.contains(e.target)) taBortHlToolbar();
    });
  }

  // src/resize.js
  function initResizer(resizerId, v\u00E4nsterEl, h\u00F6gerEl, spara) {
    const resizer = document.getElementById(resizerId);
    if (!resizer) return;
    let startX, startV\u00E4nster, startH\u00F6ger;
    resizer.addEventListener("mousedown", (e) => {
      startX = e.clientX;
      startV\u00E4nster = v\u00E4nsterEl.offsetWidth;
      startH\u00F6ger = h\u00F6gerEl.offsetWidth;
      resizer.classList.add("dragging");
      const onMove = (e2) => {
        const delta = e2.clientX - startX;
        const nyV\u00E4nster = Math.max(parseInt(v\u00E4nsterEl.style.minWidth || 160), Math.min(parseInt(v\u00E4nsterEl.style.maxWidth || 600), startV\u00E4nster + delta));
        const nyH\u00F6ger = Math.max(parseInt(h\u00F6gerEl.style.minWidth || 160), startH\u00F6ger - delta);
        v\u00E4nsterEl.style.width = nyV\u00E4nster + "px";
        h\u00F6gerEl.style.width = nyH\u00F6ger + "px";
        v\u00E4nsterEl.style.minWidth = v\u00E4nsterEl.style.minWidth || "160px";
        h\u00F6gerEl.style.minWidth = h\u00F6gerEl.style.minWidth || "160px";
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
  function initResizerFr\u00E5nStorage() {
    chrome.storage.local.get(["mentorNavBredd", "mentorH\xF6gerBredd"], (result) => {
      if (result.mentorNavBredd) document.getElementById("nav").style.width = result.mentorNavBredd + "px";
      if (result.mentorH\u00F6gerBredd) document.getElementById("h\xF6ger").style.width = result.mentorH\u00F6gerBredd + "px";
      initResizer("resizer-v\xE4nster", document.getElementById("nav"), document.getElementById("chatt"), () => ({
        mentorNavBredd: document.getElementById("nav").offsetWidth
      }));
      initResizer("resizer-h\xF6ger", document.getElementById("chatt"), document.getElementById("h\xF6ger"), () => ({
        mentorH\u00F6gerBredd: document.getElementById("h\xF6ger").offsetWidth
      }));
    });
  }

  // src/session.js
  async function sparaHistorik(synkaFirebase = false) {
    if (!S.sessionId) return;
    await chrome.storage.local.set({
      [S.sessionId]: { namn: S.aktivtProjekt?.namn, fraga: S.aktivtProjekt?.fraga, historik: S.historik, bokm\u00E4rke: S.bokm\u00E4rke, kontrastKarta: S.kontrastKarta }
    });
    if (synkaFirebase && S.krypteringsNyckel) {
      try {
        const krypteradHistorik = await kryptera(S.historik);
        const krypteradMetadata = await kryptera({ namn: S.aktivtProjekt?.namn || "", fraga: S.aktivtProjekt?.fraga || "" });
        chrome.runtime.sendMessage({ type: "SAVE_HISTORIK", data: { projektId: S.sessionId, krypteradHistorik, krypteradMetadata } });
      } catch (e) {
        console.warn("Firebase-sync misslyckades:", e.message);
      }
    }
  }
  async function sparaMentorSession() {
    if (!S.aktivtProjekt || S.historik.filter((m) => !m.silent).length < 2) return;
    const sparaKnapp = document.getElementById("spara-session");
    sparaKnapp.textContent = "\u23F3";
    sparaKnapp.disabled = true;
    const summaryPrompt = `Summarize THIS SPECIFIC SESSION as a JSON object. Focus on what is NEW \u2014 what was explored, decided or discovered in THIS session that wasn't already established. Return ONLY valid JSON, no other text.

{
  "sammanfattning": "2-3 sentences about what was NEW in this session \u2014 new arguments, new distinctions, new directions taken",
  "insikter": ["new insight specific to this session", "new decision or turn taken"],
  "kallor": [{"title": "source title", "url": "https://..."}],
  "nyckelord": ["keyword1", "keyword2"]
}

Rules: sammanfattning in conversation language, max 5 insikter, only real URLs, 3-8 nyckelord.`;
    const sessionHistorik = S.historik.slice(S.sessionStartIndex).filter((m) => !m.silent);
    if (sessionHistorik.length < 1) {
      sparaKnapp.textContent = "\u2013";
      setTimeout(() => {
        sparaKnapp.textContent = "\u{1F4BE}";
        sparaKnapp.disabled = false;
      }, 1500);
      return;
    }
    const summaryHistorik = [
      ...sessionHistorik,
      { role: "user", content: summaryPrompt }
    ];
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt: S.systemprompt, historik: summaryHistorik });
    const rawText = svar?.result?.content?.[0]?.text || "";
    let parsed = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      parsed = { sammanfattning: rawText.slice(0, 300) };
    }
    const k\u00E4nsligtInneh\u00E5ll = {
      sammanfattning: parsed.sammanfattning || "",
      insikter: parsed.insikter || [],
      kallor: parsed.kallor || [],
      nyckelord: parsed.nyckelord || []
    };
    if (!S.krypteringsNyckel) {
      laggTillBubbla("assistant", "\u26A0\uFE0F Kan inte spara \u2014 krypteringsnyckeln saknas. Klicka \u{1F511} f\xF6r att s\xE4tta ett \xE5terst\xE4llningsl\xF6senord.");
      sparaKnapp.textContent = "\u{1F4BE}";
      sparaKnapp.disabled = false;
      return;
    }
    const krypteratInneh\u00E5ll = await kryptera(k\u00E4nsligtInneh\u00E5ll);
    const entry = {
      fraga: S.aktivtProjekt.fraga,
      namn: S.aktivtProjekt.namn,
      projektId: S.sessionId,
      sessionId: S.nuvarandeSessionId,
      krypterat: krypteratInneh\u00E5ll
    };
    const resultat = await chrome.runtime.sendMessage({ type: "SAVE_MENTOR_LOG", entry });
    if (resultat?.id) {
      sparaKnapp.textContent = "\u2713";
      sparaKnapp.classList.add("aktiv");
      laddaLogg();
      l\u00E4ggTillXP(10);
    } else {
      sparaKnapp.textContent = "\u2717";
      console.error("Fel vid logg-sparande:", resultat?.error);
    }
    setTimeout(() => {
      sparaKnapp.textContent = "\u{1F4BE}";
      sparaKnapp.disabled = false;
      sparaKnapp.classList.remove("aktiv");
    }, 2e3);
  }

  // src/chatt.js
  function byggSystemprompt() {
    S.systemprompt = `You are an AI research assistant \u2014 AIuda Mentor. The user is researching: "${S.aktivtProjekt?.fraga}".

When you need external sources, links or references: silently include [SEARCH: optimized English query] anywhere in your response \u2014 the system handles it invisibly. Never mention that you are searching, never show the search tag, never fabricate URLs. Just present the results naturally.

When you receive a message starting with [Web search results for "..."]: use the content silently to inform your response. Never mention the search, never tell the user that search results were shown, never refer to "the results" or "the sources" explicitly unless it adds value. Just respond as if you already knew.

Early in the session, help the user refine their research question:
- If the question is too broad, suggest concrete scope limitations
- When proposing a revised question, format it as: **Revised research question:** "..."

Always respond in the same language as the user's message.`;
  }
  function tolkSvar(svar) {
    if (svar?.error === "quota_exceeded") return "Du har anv\xE4nt alla krediter f\xF6r denna m\xE5nad.";
    return svar?.result?.content?.[0]?.text || "N\xE5got gick fel.";
  }
  async function hanteraAISvar(svar, t\u00E4nker) {
    let assistantText = tolkSvar(svar);
    const searchMatch = assistantText.match(/\[SEARCH:\s*(.+?)\]/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      if (query.length < 5) {
        t\u00E4nker.remove();
        return assistantText.replace(/\[SEARCH:\s*.+?\]/g, "").trim() || assistantText;
      }
      const renText = assistantText.replace(/\[SEARCH:\s*.+?\]/g, "").trim();
      if (renText) S.historik.push({ role: "assistant", content: renText, silent: true });
      const sokSvar = await chrome.runtime.sendMessage({ type: "SEARCH", query });
      if (sokSvar?.results?.length) {
        sokSvar.results.forEach((r) => l\u00E4ggTillK\u00E4lla(r.title, r.url));
        const sokContent = `[Web search results for "${query}"]
` + sokSvar.results.map((r) => `${r.title}
${r.url}
${r.snippet}`).join("\n\n");
        S.historik.push({ role: "user", content: sokContent, silent: true });
        const finalSvar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt: S.systemprompt, historik: S.historik, model: S.valdModell });
        assistantText = tolkSvar(finalSvar);
      } else {
        assistantText = renText || assistantText;
      }
    }
    extraheraK\u00E4llorFr\u00E5nText(assistantText);
    t\u00E4nker.remove();
    return assistantText;
  }
  async function startaKonversation() {
    const fraga = S.t?.forklaraResearch || "Please introduce yourself as my research assistant.";
    S.historik.push({ role: "user", content: fraga, silent: true });
    await sparaHistorik();
    const t\u00E4nker = visaT\u00E4nker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt: S.systemprompt, historik: S.historik, model: S.valdModell });
    const assistantText = await hanteraAISvar(svar, t\u00E4nker);
    laggTillBubbla("assistant", assistantText);
    S.historik.push({ role: "assistant", content: assistantText });
    await sparaHistorik(true);
  }
  var p\u00E5g\u00E5rSvar = false;
  var avbrutit = false;
  function initAvbryt() {
    document.getElementById("avbryt-knapp").addEventListener("click", () => {
      avbrutit = true;
    });
  }
  async function skicka(kort = false) {
    const input = document.getElementById("input");
    const text = input.value.trim();
    if (!text || !S.aktivtProjekt || p\u00E5g\u00E5rSvar) return;
    if (quizAktivt) {
      laggTillBubbla("user", text, true, (/* @__PURE__ */ new Date()).toISOString());
      input.value = "";
      input.style.height = "44px";
      await hanteraQuizSvar(text);
      return;
    }
    p\u00E5g\u00E5rSvar = true;
    avbrutit = false;
    document.getElementById("avbryt-knapp").style.display = "inline-block";
    const nu = (/* @__PURE__ */ new Date()).toISOString();
    laggTillBubbla("user", text, true, nu);
    S.historik.push({ role: "user", content: text, tid: nu });
    if (kort) {
      S.historik.push({ role: "user", content: "[Kort reflektion \u2014 svara m\xE5ttligt, l\xE4gg inte ut till ett nytt \xE4mne]", silent: true });
    }
    input.value = "";
    input.style.height = "44px";
    await sparaHistorik();
    const t\u00E4nker = visaT\u00E4nker();
    const svar = await chrome.runtime.sendMessage({ type: "CHAT", systemprompt: S.systemprompt, historik: S.historik, model: S.valdModell });
    document.getElementById("avbryt-knapp").style.display = "none";
    p\u00E5g\u00E5rSvar = false;
    if (avbrutit) {
      avbrutit = false;
      t\u00E4nker.remove();
      return;
    }
    const assistantText = await hanteraAISvar(svar, t\u00E4nker);
    const svarTid = (/* @__PURE__ */ new Date()).toISOString();
    laggTillBubbla("assistant", assistantText, true, svarTid);
    S.historik.push({ role: "assistant", content: assistantText, tid: svarTid });
    await sparaHistorik(true);
  }
  var quizAktivt = false;
  var quizFragor = [];
  var quizIndex = 0;
  var quizPo\u00E4ng = 0;
  var quizTotalt = 0;
  function initQuiz() {
    document.getElementById("testa-mig-knapp").addEventListener("click", async () => {
      if (quizAktivt) return;
      if (S.historik.filter((m) => !m.silent).length < 4) {
        laggTillBubbla("assistant", "_Chatten beh\xF6ver lite mer inneh\xE5ll innan jag kan testa dig. Forts\xE4tt konversationen lite till._");
        return;
      }
      const knapp = document.getElementById("testa-mig-knapp");
      knapp.textContent = "\u23F3";
      knapp.disabled = true;
      const quizPrompt = `Based on our conversation, generate exactly 3 quiz questions to test the user's understanding. Return ONLY valid JSON, no other text:
{
  "questions": [
    {"question": "...", "ideal_answer": "brief ideal answer for evaluation"}
  ]
}
Questions should be open-ended, not yes/no. Language: same as the conversation.`;
      const sessionHistorik = S.historik.slice(S.sessionStartIndex).filter((m) => !m.silent);
      const svar = await chrome.runtime.sendMessage({
        type: "CHAT",
        systemprompt: S.systemprompt,
        historik: [...sessionHistorik, { role: "user", content: quizPrompt }],
        model: S.valdModell
      });
      knapp.textContent = "\u{1F393}";
      knapp.disabled = false;
      const rawText = svar?.result?.content?.[0]?.text || "";
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        if (!parsed?.questions?.length) throw new Error("No questions");
        quizFragor = parsed.questions;
        quizIndex = 0;
        quizPo\u00E4ng = 0;
        quizTotalt = quizFragor.length;
        quizAktivt = true;
        laggTillBubbla("assistant", `\u{1F393} **L\xE4xf\xF6rh\xF6r \u2014 ${quizTotalt} fr\xE5gor**

Svara med egna ord. Inga po\xE4ng f\xF6r ordagranna svar \u2014 det handlar om f\xF6rst\xE5else.

**Fr\xE5ga 1 av ${quizTotalt}:**

${quizFragor[0].question}`);
      } catch {
        laggTillBubbla("assistant", "_Kunde inte generera fr\xE5gor just nu. F\xF6rs\xF6k igen._");
      }
    });
  }
  async function hanteraQuizSvar(text) {
    const fr\u00E5ga = quizFragor[quizIndex];
    const evalPrompt = `The user was asked: "${fr\u00E5ga.question}"
Ideal answer: "${fr\u00E5ga.ideal_answer}"
User answered: "${text}"

Evaluate briefly (1-2 sentences) and give a score: "correct", "partial", or "incorrect".
Return JSON: {"feedback": "...", "score": "correct|partial|incorrect"}`;
    const t\u00E4nker = visaT\u00E4nker();
    const svar = await chrome.runtime.sendMessage({
      type: "CHAT",
      systemprompt: S.systemprompt,
      historik: [{ role: "user", content: evalPrompt }],
      model: "claude-haiku-4-5-20251001"
    });
    t\u00E4nker.remove();
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
    if (score === "correct") quizPo\u00E4ng += 2;
    else if (score === "partial") quizPo\u00E4ng += 1;
    const emoji = score === "correct" ? "\u2705" : score === "partial" ? "\u{1F7E1}" : "\u274C";
    quizIndex++;
    if (quizIndex < quizTotalt) {
      laggTillBubbla("assistant", `${emoji} ${feedback}

**Fr\xE5ga ${quizIndex + 1} av ${quizTotalt}:**

${quizFragor[quizIndex].question}`);
    } else {
      quizAktivt = false;
      const maxPo\u00E4ng = quizTotalt * 2;
      const procent = Math.round(quizPo\u00E4ng / maxPo\u00E4ng * 100);
      laggTillBubbla("assistant", `${emoji} ${feedback}

---

\u{1F393} **Klart! Resultat: ${quizPo\u00E4ng}/${maxPo\u00E4ng} po\xE4ng (${procent}%)**

${procent >= 80 ? "Utm\xE4rkt! Du har greppat materialet v\xE4l." : procent >= 50 ? "Bra jobbat \u2014 lite mer att s\xE4tta sig in i." : "Forts\xE4tt l\xE4sa och diskutera \u2014 kunskapen s\xE4tter sig med tid."}`);
      l\u00E4ggTillXP(quizPo\u00E4ng * 5);
    }
  }

  // src/projekt.js
  async function laddaProjektlista() {
    const svar = await chrome.runtime.sendMessage({ type: "LIST_PROJEKT" });
    const lista = document.getElementById("projekt-liste");
    if (!svar?.projekt?.length) {
      lista.innerHTML = `<div style="padding:12px 16px;font-size:11px;opacity:0.3;">Inga projekt \xE4nnu.</div>`;
      return;
    }
    const projekt = await Promise.all(svar.projekt.map(async (p) => {
      if (p.krypteradMetadata && S.krypteringsNyckel) {
        try {
          const meta = await dekryptera(p.krypteradMetadata);
          if (meta) return { ...p, namn: meta.namn, fraga: meta.fraga };
        } catch {
        }
      }
      return p;
    }));
    lista.innerHTML = DOMPurify.sanitize(projekt.map((p) => `
        <div class="projekt-item" data-id="${p.id}" data-namn="${encodeURIComponent(p.namn)}" data-fraga="${encodeURIComponent(p.fraga)}">
            <div class="projekt-item-namn">${p.namn || p.fraga.slice(0, 35)}</div>
            <div class="projekt-item-fraga">${p.fraga}</div>
        </div>
    `).join(""));
    lista.querySelectorAll(".projekt-item").forEach((el) => {
      el.addEventListener("click", () => {
        lista.querySelectorAll(".projekt-item").forEach((e) => e.classList.remove("aktiv"));
        el.classList.add("aktiv");
        \u00F6ppnaProjekt({
          id: el.dataset.id,
          projektId: el.dataset.id,
          namn: decodeURIComponent(el.dataset.namn),
          fraga: decodeURIComponent(el.dataset.fraga)
        });
      });
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        visaProjektMeny(el, decodeURIComponent(el.dataset.namn), decodeURIComponent(el.dataset.fraga), el.dataset.id);
      });
    });
  }
  function visaProjektMeny(el, namn, fraga, id) {
    document.getElementById("projekt-meny")?.remove();
    const meny = document.createElement("div");
    meny.id = "projekt-meny";
    meny.style.cssText = `position:fixed;background:#2a2218;border:1px solid #444;border-radius:6px;padding:4px 0;font-size:12px;z-index:9999;min-width:140px;box-shadow:0 4px 12px rgba(0,0,0,0.4);`;
    const rect = el.getBoundingClientRect();
    meny.style.left = rect.right + 4 + "px";
    meny.style.top = rect.top + "px";
    const d\u00F6pOmKnapp = document.createElement("div");
    d\u00F6pOmKnapp.textContent = "\u270F D\xF6p om";
    d\u00F6pOmKnapp.style.cssText = "padding:8px 14px;cursor:pointer;color:#f5f0e8;";
    d\u00F6pOmKnapp.onmouseover = () => d\u00F6pOmKnapp.style.background = "rgba(255,255,255,0.07)";
    d\u00F6pOmKnapp.onmouseout = () => d\u00F6pOmKnapp.style.background = "";
    d\u00F6pOmKnapp.addEventListener("click", () => {
      meny.remove();
      d\u00F6pOmProjekt(id, namn, fraga);
    });
    const raderaKnapp = document.createElement("div");
    raderaKnapp.textContent = "\u{1F5D1} Radera";
    raderaKnapp.style.cssText = "padding:8px 14px;cursor:pointer;color:#ff6b6b;";
    raderaKnapp.onmouseover = () => raderaKnapp.style.background = "rgba(255,255,255,0.07)";
    raderaKnapp.onmouseout = () => raderaKnapp.style.background = "";
    raderaKnapp.addEventListener("click", () => {
      meny.remove();
      raderaProjekt(id, namn);
    });
    meny.append(d\u00F6pOmKnapp, raderaKnapp);
    document.body.appendChild(meny);
    setTimeout(() => document.addEventListener("click", () => meny.remove(), { once: true }), 0);
  }
  async function d\u00F6pOmProjekt(id, gammaltNamn, fraga) {
    const nyttNamn = await new Promise((resolve) => {
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;";
      ov.innerHTML = `
            <div style="background:#1a1610;border:1px solid #444;border-radius:10px;padding:24px;width:320px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="font-weight:600;margin-bottom:12px;color:#f0c040;">\u270F D\xF6p om projekt</div>
                <input id="d\xF6p-om-input" type="text" value="${gammaltNamn}" style="width:100%;padding:8px;background:#2a2218;border:1px solid #444;border-radius:5px;color:#f5f0e8;font-family:inherit;font-size:12px;margin-bottom:12px;box-sizing:border-box;">
                <div style="display:flex;gap:8px;">
                    <button id="d\xF6p-om-ok" style="flex:1;padding:9px;background:#f0c040;color:#1a1610;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-family:inherit;">Spara</button>
                    <button id="d\xF6p-om-avbryt" style="flex:1;padding:9px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:5px;cursor:pointer;font-family:inherit;">Avbryt</button>
                </div>
            </div>`;
      document.body.appendChild(ov);
      const input = ov.querySelector("#d\xF6p-om-input");
      input.focus();
      input.select();
      ov.querySelector("#d\xF6p-om-ok").addEventListener("click", () => {
        ov.remove();
        resolve(input.value.trim());
      });
      ov.querySelector("#d\xF6p-om-avbryt").addEventListener("click", () => {
        ov.remove();
        resolve(null);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          ov.remove();
          resolve(input.value.trim());
        }
      });
    });
    if (!nyttNamn || nyttNamn === gammaltNamn) return;
    if (S.aktivtProjekt?.id === id) {
      S.aktivtProjekt.namn = nyttNamn;
      document.getElementById("projekt-namn-chatt").textContent = nyttNamn;
      byggSystemprompt();
    }
    if (S.krypteringsNyckel) {
      const krypteradMetadata = await kryptera({ namn: nyttNamn, fraga });
      chrome.runtime.sendMessage({ type: "SAVE_HISTORIK", data: { projektId: id, krypteradMetadata } });
    }
    await laddaProjektlista();
  }
  async function raderaProjekt(id, namn) {
    const bekr\u00E4ftad = await new Promise((resolve) => {
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;";
      ov.innerHTML = `
            <div style="background:#1a1610;border:1px solid #444;border-radius:10px;padding:24px;width:320px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.6;">
                <div style="font-weight:600;margin-bottom:8px;color:#ff6b6b;">\u{1F5D1} Radera projekt</div>
                <p style="opacity:0.8;margin-bottom:16px;">Radera <strong>${namn || id}</strong>?<br>Det g\xE5r inte att \xE5ngra.</p>
                <div style="display:flex;gap:8px;">
                    <button id="radera-ok" style="flex:1;padding:9px;background:#ff6b6b;color:#fff;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-family:inherit;">Radera</button>
                    <button id="radera-avbryt" style="flex:1;padding:9px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:5px;cursor:pointer;font-family:inherit;">Avbryt</button>
                </div>
            </div>`;
      document.body.appendChild(ov);
      ov.querySelector("#radera-ok").addEventListener("click", () => {
        ov.remove();
        resolve(true);
      });
      ov.querySelector("#radera-avbryt").addEventListener("click", () => {
        ov.remove();
        resolve(false);
      });
    });
    if (!bekr\u00E4ftad) return;
    await chrome.runtime.sendMessage({ type: "DELETE_PROJEKT", projektId: id });
    if (S.aktivtProjekt?.id === id) {
      S.aktivtProjekt = null;
      S.historik = [];
      S.bubblaNummer = 0;
      S.bokm\u00E4rke = null;
      S.kontrastKarta = {};
      document.querySelector(".aiuda-bm-marker")?.remove();
      document.getElementById("bokm\xE4rk-hopp").style.display = "none";
      document.getElementById("meddelanden").innerHTML = "";
      document.getElementById("meddelanden").style.display = "none";
      document.getElementById("input-area").style.display = "none";
      document.getElementById("spara-session").style.display = "none";
      document.getElementById("info-knapp").style.display = "none";
      document.getElementById("v\xE4lkommen").style.display = "flex";
    }
    await laddaProjektlista();
  }
  async function \u00F6ppnaProjekt(projekt) {
    S.sessionId = projekt.id;
    S.aktivtProjekt = projekt;
    S.sessionK\u00E4llor = [];
    renderaK\u00E4llor();
    setL\u00E4slogg([]);
    renderaL\u00E4slogg();
    S.nuvarandeSessionId = "session_" + Date.now();
    document.getElementById("projekt-namn-chatt").textContent = projekt.namn || projekt.fraga.slice(0, 40);
    document.getElementById("projekt-fraga-chatt").textContent = projekt.fraga;
    document.getElementById("v\xE4lkommen").style.display = "none";
    document.getElementById("ny-fraga-panel").style.display = "none";
    document.getElementById("meddelanden").style.display = "flex";
    document.getElementById("input-area").style.display = "flex";
    document.getElementById("spara-session").style.display = "inline-block";
    document.getElementById("testa-mig-knapp").style.display = "inline-block";
    document.getElementById("info-knapp").style.display = "inline-block";
    document.getElementById("info-projekt-id").textContent = S.sessionId;
    document.getElementById("info-session-id").textContent = S.nuvarandeSessionId;
    byggSystemprompt();
    await laddaAnteckningarOchTasks();
    document.getElementById("meddelanden").innerHTML = "";
    S.bubblaNummer = 0;
    S.bokm\u00E4rke = null;
    S.kontrastKarta = {};
    document.getElementById("bokm\xE4rk-hopp").style.display = "none";
    let laddadHistorik = null;
    let laddadFr\u00E5nFirebase = false;
    const sparadLokal = await chrome.storage.local.get(S.sessionId);
    S.bokm\u00E4rke = sparadLokal[S.sessionId]?.bokm\u00E4rke || null;
    S.kontrastKarta = sparadLokal[S.sessionId]?.kontrastKarta || {};
    try {
      const fj\u00E4rr = await chrome.runtime.sendMessage({ type: "LOAD_HISTORIK", projektId: S.sessionId });
      if (fj\u00E4rr?.krypteradHistorik && S.krypteringsNyckel) {
        const dekrypterad = await dekryptera(fj\u00E4rr.krypteradHistorik);
        if (dekrypterad) {
          laddadHistorik = dekrypterad;
          laddadFr\u00E5nFirebase = true;
        }
      }
    } catch {
    }
    if (!laddadHistorik) {
      laddadHistorik = sparadLokal[S.sessionId]?.historik || null;
    }
    if (laddadHistorik?.length > 0) {
      S.historik = laddadHistorik;
      S.sessionStartIndex = S.historik.length;
      if (!laddadFr\u00E5nFirebase) sparaHistorik(true);
      S.historik.forEach((msg) => {
        if (msg.silent) return;
        const text = typeof msg.content === "string" ? msg.content : msg.content[0]?.text || "";
        laggTillBubbla(msg.role, text, false, msg.tid || null);
      });
      document.getElementById("meddelanden").scrollTop = document.getElementById("meddelanden").scrollHeight;
      if (S.bokm\u00E4rke) \u00E5terst\u00E4llBokm\u00E4rke();
      \u00E5terst\u00E4llKontrast();
    } else {
      S.historik = [];
      S.sessionStartIndex = 0;
      await startaKonversation();
    }
    laddaLogg();
  }
  async function starta() {
    const fraga = document.getElementById("fraga-input").value.trim();
    const namn = document.getElementById("projekt-namn-input").value.trim() || fraga.slice(0, 40);
    if (!fraga) return;
    const projektId = "projekt_" + Date.now();
    S.aktivtProjekt = { id: projektId, projektId, namn, fraga };
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
    \u00F6ppnaProjekt(S.aktivtProjekt);
    await laddaProjektlista();
  }

  // src/mentor.js
  registreraLaggTillBubbla(laggTillBubbla);
  var MODELLER = [
    { id: "claude-sonnet-4-6", label: "S", titel: "Sonnet (standard)" },
    { id: "claude-haiku-4-5-20251001", label: "H", titel: "Haiku (snabb)" },
    { id: "claude-opus-4-8", label: "O", titel: "Opus (djupast \u2014 kan timeout:a)" }
  ];
  function uppdateraModellKnapp() {
    const knapp = document.getElementById("modell-knapp");
    const m = MODELLER.find((m2) => m2.id === S.valdModell) || MODELLER[0];
    knapp.textContent = m.label;
    knapp.title = m.titel;
    knapp.style.color = m.label === "O" ? "#ff9944" : "";
  }
  function visaOpusVarning(onOk) {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;";
    ov.innerHTML = `
        <div style="background:#1a1610;border:1px solid #555;border-radius:10px;padding:24px;width:320px;font-family:'DM Mono',monospace;font-size:12px;color:#f5f0e8;line-height:1.7;">
            <div style="font-weight:600;margin-bottom:10px;color:#ff9944;">\u26A0 Opus \u2014 kraftfullare men l\xE5ngsammare</div>
            <p style="opacity:0.8;margin-bottom:16px;">Opus ger djupare och mer nyanserade svar, men kan timeout:a vid l\xE5nga konversationer (60s gr\xE4ns p\xE5 servern).</p>
            <p style="opacity:0.6;font-size:11px;margin-bottom:16px;">Rekommenderas f\xF6r kortare sessioner eller n\xE4r samtalskvaliteten \xE4r viktigare \xE4n svarstiden.</p>
            <div style="display:flex;gap:8px;">
                <button id="opus-ok" style="flex:1;padding:9px;background:#ff9944;color:#1a1610;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-family:inherit;">Anv\xE4nd Opus</button>
                <button id="opus-avbryt" style="flex:1;padding:9px;background:transparent;color:#f5f0e8;border:1px solid #444;border-radius:5px;cursor:pointer;font-family:inherit;">Avbryt</button>
            </div>
        </div>`;
    document.body.appendChild(ov);
    ov.querySelector("#opus-ok").addEventListener("click", () => {
      ov.remove();
      onOk();
    });
    ov.querySelector("#opus-avbryt").addEventListener("click", () => {
      ov.remove();
    });
  }
  document.getElementById("modell-knapp").addEventListener("click", () => {
    const index = MODELLER.findIndex((m) => m.id === S.valdModell);
    const n\u00E4sta = MODELLER[(index + 1) % MODELLER.length];
    if (n\u00E4sta.label === "O") {
      visaOpusVarning(() => {
        S.valdModell = n\u00E4sta.id;
        chrome.storage.local.set({ mentorModell: S.valdModell });
        uppdateraModellKnapp();
      });
    } else {
      S.valdModell = n\u00E4sta.id;
      chrome.storage.local.set({ mentorModell: S.valdModell });
      uppdateraModellKnapp();
    }
  });
  var SPRAK_ORDNING = ["sv", "en", "en-GB", "de", "fr", "es", "it", "no", "da"];
  function tillampaSprak(nyT) {
    S.t = nyT;
    const el = (id) => document.getElementById(id);
    if (el("login-text")) el("login-text").textContent = S.t.mentorLoggaIn || "";
    if (el("login-knapp")) el("login-knapp").textContent = S.t.mentorLoggaInKnapp || "Logga in";
    if (el("v\xE4lkommen-rubrik")) el("v\xE4lkommen-rubrik").innerHTML = (S.t.mentorV\u00E4lkommen || "V\xE4lkommen till AIuda Mentor\u2122") + '<sup style="font-size:8px;opacity:0.5;vertical-align:super;">\u2122</sup>';
    if (el("v\xE4lkommen-beskrivning")) el("v\xE4lkommen-beskrivning").innerHTML = (S.t.mentorV\u00E4ljProjekt || "").replace("\n", "<br>");
    if (el("nytt-projekt-rubrik")) el("nytt-projekt-rubrik").textContent = S.t.mentorNyttProjekt || "Nytt projekt";
    if (el("projekt-namn-input")) el("projekt-namn-input").placeholder = S.t.mentorProjektnamn || "Projektnamn";
    if (el("fraga-input")) el("fraga-input").placeholder = S.t.mentorFragest\u00E4llning || "Din fr\xE5gest\xE4llning\u2026";
    if (el("starta-knapp")) el("starta-knapp").textContent = S.t.mentorStarta || "Starta \u2192";
    if (el("input")) el("input").placeholder = S.t.mentorSt\u00E4llFraga || "St\xE4ll en fr\xE5ga\u2026";
    if (el("flik-notat")) el("flik-notat").textContent = S.t.mentorNotat || "\u{1F4DD} Notat";
    if (el("flik-tasks")) el("flik-tasks").textContent = S.t.mentorTasks || "\u2705 Tasks";
    if (el("flik-k\xE4llor")) el("flik-k\xE4llor").textContent = S.t.mentorK\u00E4llor || "\u{1F517} K\xE4llor";
    if (el("flik-l\xE4st")) el("flik-l\xE4st").textContent = S.t.mentorL\u00E4st || "\u{1F4D6} L\xE4st";
    if (el("flik-logg")) el("flik-logg").textContent = S.t.mentorLogg || "\u{1F4CB} Logg";
    if (el("spara-anteckningar")) el("spara-anteckningar").textContent = S.t.mentorSpara || "Spara";
    if (el("nytt-projekt-knapp")) el("nytt-projekt-knapp").textContent = "\uFF0B " + (S.t.mentorNyttProjekt || "Nytt projekt");
  }
  document.getElementById("sprak-knapp").addEventListener("click", () => {
    const nuvarandeLang = Object.keys(AR_LOCALES).find((k) => AR_LOCALES[k] === S.t) || "sv";
    const index = SPRAK_ORDNING.indexOf(nuvarandeLang);
    const n\u00E4staLang = SPRAK_ORDNING[(index + 1) % SPRAK_ORDNING.length];
    chrome.storage.local.set({ lang: n\u00E4staLang });
    tillampaSprak(AR_LOCALES[n\u00E4staLang] || AR_LOCALES.sv);
    document.getElementById("sprak-knapp").title = n\u00E4staLang;
  });
  function tillampaTemat(tema) {
    const ljust = tema === "ljust";
    document.body.classList.toggle("ljust", ljust);
    document.getElementById("tema-knapp").textContent = ljust ? "\u{1F319}" : "\u2600";
  }
  chrome.storage.local.get(["lang", "tema", "arToken", "arUser", "mentorModell", "mentorXP"], async (result) => {
    const valtSprak = AR_LOCALES[result.lang] || AR_LOCALES.sv;
    if (result.mentorModell) S.valdModell = result.mentorModell;
    if (result.mentorXP) {
      S.totalXP = result.mentorXP;
      uppdateraXPVisning();
    }
    uppdateraModellKnapp();
    tillampaTemat(result.tema || "m\xF6rkt");
    if (!result.arToken) {
      document.getElementById("login-vy").style.display = "flex";
      document.getElementById("v\xE4lkommen").style.display = "none";
      tillampaSprak(valtSprak);
      return;
    }
    tillampaSprak(valtSprak);
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
      document.getElementById("v\xE4lkommen").style.display = "flex";
      laddaProjektlista();
    }
  });
  document.querySelectorAll(".flik").forEach((flik) => {
    flik.addEventListener("click", () => {
      document.querySelectorAll(".flik").forEach((f) => f.classList.remove("aktiv"));
      document.querySelectorAll(".flik-vy").forEach((v) => v.classList.remove("aktiv"));
      flik.classList.add("aktiv");
      document.getElementById(`vy-${flik.dataset.flik}`).classList.add("aktiv");
    });
  });
  document.getElementById("spara-anteckningar").addEventListener("click", async () => {
    await sparaAnteckningarOchTasks(true);
    const knapp = document.getElementById("spara-anteckningar");
    knapp.textContent = "Sparat \u2713";
    knapp.classList.add("sparad");
    setTimeout(() => {
      knapp.textContent = "Spara";
      knapp.classList.remove("sparad");
    }, 1500);
  });
  var anteckningarTimeout;
  document.getElementById("anteckningar-area").addEventListener("input", () => {
    clearTimeout(anteckningarTimeout);
    anteckningarTimeout = setTimeout(sparaAnteckningarOchTasks, 1500);
  });
  document.getElementById("l\xE4gg-till-task").addEventListener("click", l\u00E4ggTillTask);
  document.getElementById("ny-task-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      l\u00E4ggTillTask();
    }
  });
  document.getElementById("nytt-projekt-knapp").addEventListener("click", () => {
    document.getElementById("v\xE4lkommen").style.display = "none";
    document.getElementById("ny-fraga-panel").style.display = "block";
    document.getElementById("spara-session").style.display = "none";
    document.getElementById("projekt-namn-input").focus();
  });
  document.getElementById("starta-knapp").addEventListener("click", starta);
  document.getElementById("fraga-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      starta();
    }
  });
  document.getElementById("skicka").addEventListener("click", () => skicka());
  document.getElementById("skicka-kort").addEventListener("click", () => skicka(true));
  initAvbryt();
  var inputEl = document.getElementById("input");
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + "px";
    const pos = inputEl.selectionStart;
    const text = inputEl.value;
    const radStart = text.lastIndexOf("\n", pos - 1) + 1;
    const radText = text.slice(radStart, pos);
    if (/^(\d+\.\s|-\s)$/.test(radText)) {
      inputEl.setRangeText("	", radStart, radStart, "start");
      inputEl.selectionStart = inputEl.selectionEnd = pos + 1;
    }
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      skicka();
      return;
    }
    if (e.key === "Enter" && e.shiftKey) {
      const ta = inputEl;
      const pos = ta.selectionStart;
      const text = ta.value;
      const radStart = text.lastIndexOf("\n", pos - 1) + 1;
      const radText = text.slice(radStart, pos);
      const numMatch = radText.match(/^(\s*)(\d+)\.\s(.*)$/);
      const streckMatch = radText.match(/^(\s*)-\s(.*)$/);
      if (numMatch) {
        e.preventDefault();
        const indent = numMatch[1];
        const innehall = numMatch[3].trim();
        if (!innehall) {
          ta.setRangeText("\n", radStart, pos, "end");
        } else {
          ta.setRangeText(`
${indent}${parseInt(numMatch[2]) + 1}. `, pos, pos, "end");
        }
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
      } else if (streckMatch) {
        e.preventDefault();
        const indent = streckMatch[1];
        const innehall = streckMatch[2].trim();
        if (!innehall) {
          ta.setRangeText("\n", radStart, pos, "end");
        } else {
          ta.setRangeText(`
${indent}- `, pos, pos, "end");
        }
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
      }
    }
  });
  window.addEventListener("paste", (e) => {
    const input = document.getElementById("input");
    const active = document.activeElement;
    if (!input || !S.aktivtProjekt || active?.tagName === "TEXTAREA" || active?.tagName === "INPUT") return;
    const text = e.clipboardData?.getData("text/plain") || "";
    if (!text) return;
    e.preventDefault();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
  });
  document.getElementById("spara-session").addEventListener("click", sparaMentorSession);
  document.getElementById("l\xE4gg-till-sida").addEventListener("click", async () => {
    if (!S.aktivtProjekt) return;
    const knapp = document.getElementById("l\xE4gg-till-sida");
    knapp.textContent = "\u23F3";
    knapp.disabled = true;
    const svar = await chrome.runtime.sendMessage({ type: "GET_ACTIVE_TAB" });
    knapp.textContent = "\u{1F4CE}";
    knapp.disabled = false;
    if (svar?.error || !svar?.url) {
      laggTillBubbla("assistant", "_Ingen aktiv webbsida hittades._");
      return;
    }
    const { url, title } = svar;
    l\u00E4ggTillK\u00E4lla(title, url);
    laggTillBubbla("user", `\u{1F4CE} [${title}](${url})`);
    const kontext = `[Anv\xE4ndaren har lagt till en webbsida som k\xE4lla]
Titel: ${title}
URL: ${url}

Referera till denna sida n\xE4r det \xE4r relevant i konversationen.`;
    S.historik.push({ role: "user", content: kontext, silent: true });
    await sparaHistorik();
  });
  document.getElementById("l\xE4gg-till-l\xE4slogg").addEventListener("click", async () => {
    if (!S.aktivtProjekt) return;
    const knapp = document.getElementById("l\xE4gg-till-l\xE4slogg");
    knapp.textContent = "\u23F3";
    knapp.disabled = true;
    const svar = await chrome.runtime.sendMessage({ type: "GET_READER_ANNOTATION" });
    knapp.textContent = "\u{1F4D6}";
    knapp.disabled = false;
    if (svar?.error || svar?.ej_annoterad) {
      laggTillBubbla("assistant", svar?.ej_annoterad ? "_Den aktiva sidan \xE4r inte annoterad med Reader \xE4nnu._" : "_Kunde inte h\xE4mta annotation \u2014 \xE4r Reader installerad och aktiv?_");
      return;
    }
    const { annotation, url, title } = svar;
    if (l\u00E4slogg.some((e) => e.url === url)) {
      laggTillBubbla("assistant", `_${title || url} finns redan i l\xE4sloggen._`);
      return;
    }
    const entry = {
      url,
      title: title || url,
      sammanfattning: annotation.sammanfattning || "",
      kategorier: annotation.kategorier || [],
      tid: (/* @__PURE__ */ new Date()).toISOString()
    };
    setL\u00E4slogg([...l\u00E4slogg, entry]);
    renderaL\u00E4slogg();
    setTimeout(sparaL\u00E4slogg, 2e3);
    l\u00E4ggTillK\u00E4lla(title, url);
    const kontext = `[Reader-annotation tillagd]
Sida: ${title}
URL: ${url}
Sammanfattning: ${annotation.sammanfattning}
Kategorier: ${(annotation.kategorier || []).map((k) => k.namn).join(", ")}

Anv\xE4nd denna annotation som bakgrundskunskap i konversationen.`;
    S.historik.push({ role: "user", content: kontext, silent: true });
    await sparaHistorik();
    document.querySelectorAll(".flik").forEach((f) => f.classList.remove("aktiv"));
    document.querySelectorAll(".flik-vy").forEach((v) => v.classList.remove("aktiv"));
    document.querySelector("[data-flik='l\xE4slogg']").classList.add("aktiv");
    document.getElementById("vy-l\xE4slogg").classList.add("aktiv");
  });
  document.getElementById("meddelanden").addEventListener("click", (e) => {
    const l\u00E4nk = e.target.closest("a");
    if (l\u00E4nk?.href) {
      e.preventDefault();
      chrome.tabs.create({ url: l\u00E4nk.href });
      return;
    }
    if (e.target.classList.contains("aiuda-bm-marker")) {
      s\u00E4ttBokm\u00E4rke(-1, 0);
      return;
    }
    const bubbla = e.target.closest(".bubbla");
    if (!bubbla) return;
    if (e.target.closest(".aiuda-hl")) return;
    if (window.getSelection()?.toString().trim()) return;
    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (!range) return;
    const bubbleIdx = parseInt(bubbla.dataset.bubbleIdx);
    const charOffset = getCharOffset(bubbla, range);
    s\u00E4ttBokm\u00E4rke(bubbleIdx, charOffset);
  });
  document.getElementById("kryptering-knapp").addEventListener("click", () => {
    chrome.storage.local.get("arUser", ({ arUser }) => visaL\u00F6senordsDialog(arUser?.email));
  });
  document.getElementById("hj\xE4lp-knapp").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://aiuda.se/help.html" });
  });
  document.getElementById("info-knapp").addEventListener("click", (e) => {
    e.stopPropagation();
    const popup = document.getElementById("info-popup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => {
    document.getElementById("info-popup").style.display = "none";
  });
  document.getElementById("tema-knapp").addEventListener("click", () => {
    const ljust = document.body.classList.toggle("ljust");
    const tema = ljust ? "ljust" : "m\xF6rkt";
    document.getElementById("tema-knapp").textContent = ljust ? "\u{1F319}" : "\u2600";
    chrome.storage.local.set({ tema });
  });
  var FONT_SEKTIONER_MENTOR = ["meddelanden", "projekt-liste", "anteckningar-area", "task-lista", "k\xE4ll-lista", "l\xE4slogg-lista", "logg-lista"];
  var FONT_MIN_M = 10;
  var FONT_MAX_M = 22;
  var FONT_DEFAULT_M = 13;
  chrome.storage.local.get("mentorFontSizes", ({ mentorFontSizes = {} }) => {
    FONT_SEKTIONER_MENTOR.forEach((id) => {
      const el = document.getElementById(id);
      if (el && mentorFontSizes[id]) el.style.fontSize = mentorFontSizes[id] + "px";
    });
  });
  document.addEventListener("wheel", (e) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const sektionEl = e.target.closest(FONT_SEKTIONER_MENTOR.map((id) => "#" + id).join(", "));
    if (!sektionEl) return;
    const nuvarande = parseFloat(sektionEl.style.fontSize) || FONT_DEFAULT_M;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const ny = delta > 0 ? Math.max(FONT_MIN_M, nuvarande - 1) : Math.min(FONT_MAX_M, nuvarande + 1);
    sektionEl.style.fontSize = ny + "px";
    chrome.storage.local.get("mentorFontSizes", ({ mentorFontSizes = {} }) => {
      chrome.storage.local.set({ mentorFontSizes: { ...mentorFontSizes, [sektionEl.id]: ny } });
    });
  }, { passive: false });
  initBokm\u00E4rke();
  initHighlight();
  initResizerFr\u00E5nStorage();
  initQuiz();
})();
