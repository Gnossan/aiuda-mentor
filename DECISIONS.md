# Arkitektur- och säkerhetsbeslut — AIuda Mentor

Dokumenterar medvetna avvägningar och designbeslut. Uppdateras löpande.

---

## Säkerhet

### CORS: `Access-Control-Allow-Origin: *` (V-2)
**Beslut:** Behålls tills vidare.  
**Motivering:** Alla endpoints kräver Firebase Bearer-token i Authorization-headern. Cookie-baserade CSRF-attacker är inte möjliga. Risken är acceptabel under beta med känd användargrupp.  
**Åtgärd inför release:** Begränsa till kända extension-origins när Reader och Mentor har stabila Chrome Web Store-ID:n. Se även K-1.

---

### Firebase API-nyckel hårdkodad i background.js (V-3)
**Beslut:** Behålls — Firebase Web API-nycklar är designade att vara publika.  
**Motivering:** Skyddet ligger i Firebase Security Rules, inte i nyckelns sekretess. Rules kräver `request.auth.uid == uid` för all användardata.  
**Förutsättning:** Firebase Security Rules måste vara korrekt konfigurerade (verifierat 2026-05-29).

---

### `externally_connectable.ids: ["*"]` (K-1)
**Beslut:** Temporär lösning under beta.  
**Motivering:** AIuda Reader saknar stabilt extension-ID (manuell install, inte Web Store). Avsändarvalidering finns i koden — `AUTH_COMPLETE` accepteras bara från kända webbsidor, `LÄGG_TILL_KÄLLA` bara från extensions.  
**Åtgärd inför release:** Byt till Readers faktiska Web Store-ID. Se TODO-kommentar i background.js.

---

### Systemprompt skickas från klienten (V-1)
**Beslut:** Delvis accepterad — innehåll okontrollerat, men storleks- och modell-validering finns på servern.  
**Motivering:** Mentor är ett personligt verktyg där användaren äger sin research-kontext. Att bygga systemprompt på servern kräver att backend känner till projektdata, vilket är ett arkitekturarbete.  
**Åtgärd:** Se issue #7 för fullständig lösning.

---

### PBKDF2: 310 000 iterationer (A-1)
**Beslut:** Behålls tills fler användare finns.  
**Motivering:** 310k är över NIST:s tidigare rekommendation. Att höja till 600k (OWASP 2023) kräver migrering av befintliga wrapped nycklar i Firebase — oproportionerlig kostnad under beta.  
**Åtgärd:** Höj vid nästa nyckelarkitektur-revision (t.ex. i samband med issue #6).

---

## Kryptering

### Krypteringsnyckeln lever bara i minnet
**Beslut:** Nyckeln sparas inte i `chrome.storage.local`.  
**Motivering:** Eliminerar K-2 (rånyckel läsbar via DevTools). Konsekvens: nyckeln måste låsas upp vid varje start via lösenord eller Credential Management API.  
**Se:** Issue #6 (lösenordsåterställning) för förbättrad UX.

### Notat och tasks krypteras men anteckningarna auto-sparas lokalt utan synk
**Beslut:** Auto-sparning (debounce) sparar lokalt, explicit Spara-knapp synkar till Firebase.  
**Motivering:** Undviker onödiga Firebase-skrivningar vid varje knapptryckning.

### Projektnamn och frågeställning krypteras (krypteradMetadata)
**Beslut:** Namn och fraga krypteras som `krypteradMetadata` på projektdokumentet. Klartext-fälten skrivs som tomma strängar vid krypterad sparning.  
**Motivering:** Projektnamn och frågeställningar är känsliga forskningsdata — tidigare lagrades de i klartext, vilket var ett integritetsläckage.  
**Bakåtkompatibilitet:** Äldre poster med klartext namn/fraga visas korrekt som fallback tills de sparas om med ny version.

---

## Arkitektur

### Mentor som separat extension (inte del av Reader)
**Beslut:** Eget repo, eget backend, eget extension-ID.  
**Motivering:** Olika permission-profiler, olika användningsfall, olika release-cykler. Undviker att Readers 12-funktionsgräns på Vercel Hobby påverkar Mentor.

### Vercel Hobby-plan: max 12 serverless-funktioner
**Beslut:** Håller oss under gränsen genom att slå ihop eller ta bort funktioner vid behov.  
**Notering:** Reader-backenden är på 12/12. Mentor-backenden har god marginal.
