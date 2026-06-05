# Beroende-audit — AIuda Mentor (CVE-täckning)

**Datum:** 2026-05-29
**Verktyg:** `npm audit` (live), manuell versionskontroll

---

## Bundlade filer i extensionen

| Fil | Version | Status |
|-----|---------|--------|
| `marked.min.js` | **v18.0.4** | ✅ Inga kända CVE:er |
| `purify.min.js` | **DOMPurify 3.4.7** | ✅ Inga kända CVE:er |

Båda är aktuella versioner utan öppna sårbarheter. A-5-fyndet ("okänd version") från säkerhetsaudit #1 är nu stängt — versionerna är bekräftade och rena.

---

## Backend-beroenden — `npm audit`

Samma resultat i **båda** backends (de delar `firebase-admin`):

```
8 moderate severity vulnerabilities
```

### Fynd: `uuid < 11.1.1` via `firebase-admin` 🟠

**CVE:** [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
**Allvar:** Moderate

**Beroendekedjan:**
```
firebase-admin >=11.0.0
  └── @google-cloud/firestore 7.6.0–7.11.6
        └── google-gax 4.0.5–4.6.1
              └── teeny-request / gaxios
                    └── uuid <11.1.1  ← sårbar
```

**Vad buggen är:** Missing buffer bounds check i `uuid.v3()`/`v5()`/`v6()` när ett explicit `buf`-argument skickas in av anroparen — möjlig out-of-bounds write.

**Praktisk risk i er kontext:** **Låg.** `firebase-admin` använder `uuid` internt för att generera request-ID:n. Ingen av era API-endpoints exponerar ett kodflöde där en angripare kan styra `buf`-argumentet till `uuid`. Serverless Vercel-miljö utan persistent process minskar också angreppsytan ytterligare.

**Varför det ändå är noteringbart:** Det finns 8 berörda paket i kedjan, vilket är bredare än ett enstaka beroende.

**Fix-situationen:**
```bash
npm audit fix          # hjälper inte — alla kräver breaking change
npm audit fix --force  # installerar firebase-admin@10.3.0 (nedgradering, ej rekommenderat)
```

Det rätta är att vänta på att `firebase-admin` uppdaterar sin beroendekedja till `uuid >=11.1.1`.
Bevaka: https://github.com/firebase/firebase-admin-node/releases

---

## Nytt fynd: Inga `package-lock.json` i någon backend 🟠

Saknas i både `aiuda-mentor-backend/` och `annotated-reader-backend/`.

`npm audit` krävde att lockfilen genererades manuellt för att kunna köras alls. Utan en incheckad lockfil:

- Varje deploy kan potentiellt installera en annan patch-version av ett beroende
- `npm audit` kan inte köras i CI/CD utan extra steg
- `npm ci` (deterministisk installation) fungerar inte

**Åtgärd:**
```bash
npm install              # genererar package-lock.json
git add package-lock.json
git commit -m "Add lockfile"
```

Rekommenderad CI-regel:
```bash
npm ci && npm audit --audit-level=high
```
(`--audit-level=high` flaggar bara vid high/critical och undviker falska larm som uuid-fallet ovan.)

---

## Sammanfattning

| Komponent | Version | CVE-status |
|-----------|---------|-----------|
| `marked.min.js` | 18.0.4 | ✅ Ren |
| `purify.min.js` | 3.4.7 | ✅ Ren |
| `@anthropic-ai/sdk` | ^0.97.1 | ✅ Ren |
| `stripe` | ^22.1.1 | ✅ Ren |
| `firebase-admin` | ^13.10.0 | 🟠 8 moderate via uuid-kedjan |
| `package-lock.json` | — | 🟠 Saknas i båda backends |

Inget 🔴. Extensionens bundlade libs är rena. Backend-beroendet att bevaka är `firebase-admin` — uppdatera när de rullar ut en fix för uuid-kedjan.
