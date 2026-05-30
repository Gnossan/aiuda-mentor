// AIuda Reader — språkfiler
// Lägg till ett nytt språk genom att kopiera ett befintligt block och översätta.

const AR_LOCALES = {

    en: {
        // --- Popup ---
        apiNyckel: "API Key",
        apiPlaceholder: "sk-ant-...",
        sparaNyckel: "Save key",
        annoteraSidan: "Annotate this page",
        avancerat: "Advanced...",
        modellLabel: "Model",
        temperatureLabel: "Temperature",
        valjFarg: "Choose color",
        spara: "Save",
        nyckelSparad: "Key saved",
        sparad: "Saved",
        installningarSparade: "Settings saved",
        opusTempNot: "Opus 4.7 requires temperature 1.0",
        sprakLabel: "Language",
        opus: "Opus 4.7 (most powerful)",
        sonnet: "Sonnet 4.6 (balanced)",
        haiku: "Haiku 4.5 (fastest)",
        modellInfoFree: "Annotation: Sonnet · Chat: Haiku",
        modellUppgradera: "Upgrade to Pro or VIP to use more powerful models like Opus for both annotation and chat.",

        // --- Sidopanel ---
        header: "AIuda Reader",
        exportera: "↓ Export",
        stallEnFraga: "Ask a question...",
        ingaAndra: "No other annotations with history.",
        valjMarkering: "Select annotation to cross-reference",
        meddelandenSuffix: "messages",
        nagorGickFel: "Something went wrong.",
        kvotSlut: "You have used all your credits for this month. Upgrade your plan or purchase additional credits.",
        kvotVarning: "⚠ You are approaching your monthly limit.",
        vipPlan: "VIP — unlimited",
        hanteraPrenumeration: "Manage subscription →",
        köpKrediter: "Buy credits",
        uppgraderaPro: "Upgrade to Pro — €9.99/month",
        uppgraderaVip: "Upgrade to VIP — €19.99/month",
        consentText: "AIuda Reader stores your login info and preferences locally, and your email and usage data on our servers. Text you annotate is sent to Anthropic's Claude API. The extension enables text selection within links to allow word lookup on all page types.",
        consentLank: "Privacy Policy",
        consentKnapp: "I agree",

        // --- Export markdown ---
        exportRubrik: "AIuda Reader — Exported history",
        exportDatum: "Exported",
        datumLocale: "en-US",
        exportKategori: "Category",
        exportBeskrivning: "Description",
        exportDu: "You",
        exportIngenChatt: "*No chat*",

        // --- Promptar ---
        chatOmSidan: "Chat about page",
        forklaraSammanhang: "Explain this in its context.",
        forklaraHela: "Give me an overview of this text.",
        forklaraResearch: "I'm starting a research session. Please briefly introduce yourself as my research assistant and confirm my research question.",
        forklaraKategori: (k) => `Summarize what this page says about "${k}".`,
        identifieraOrd: "Identify difficult words",
        nivaer: ["Beginner", "Intermediate", "Advanced", "Native speaker"],

        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `You are a helpful guide for text the user is reading.
The text is about: ${sammanfattning}
The user has highlighted the phrase "${fras}" in the category "${kategori}".
Description: ${beskrivning}
Help the user explore and understand this phrase in its context.
Always respond in English, regardless of the language of the text.`,

        helTextSystemPrompt: (text, sammanfattning) =>
            `You are a helpful guide for text the user is reading.
Summary: ${sammanfattning}

Full text:
${text}

Help the user explore and understand the text.
Always respond in English, regardless of the language of the text.`,

        annoteringsPrompt: (text) =>
            `Analyze the following text and return ONLY a JSON object without explanations or markdown.

Identify 3-5 meaningful categories that fit the content and theme of the text.
For each category, choose a distinct color in hex format.
Then annotate the text with phrases belonging to the categories.
Use English for all category names and descriptions.

Format:
{
  "sammanfattning": "One or a few sentences about what the text is about",
  "kategorier": [
    {"namn": "categoryname", "farg": "#hexcolor", "beskrivning": "short description of the category"}
  ],
  "annoteringar": [
    {"text": "...", "kategori": "categoryname", "beskrivning": "..."}
  ]
}

Text:
${text}`,

        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Cross-reference to "${annanFras}"]\n${utdrag}\n\nHow does this relate to our discussion about "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Bienvenue dans AIuda Mentor™",
        mentorVäljProjekt: "Choisissez un projet à gauche\nou créez-en un nouveau.",
        mentorNyttProjekt: "Nouveau projet",
        mentorProjektnamn: "Nom du projet",
        mentorFrageställning: "Votre question de recherche…",
        mentorStarta: "Démarrer →",
        mentorStällFraga: "Posez une question…",
        mentorNotat: "📝 Notizen",
        mentorTasks: "✅ Tâches",
        mentorKällor: "🔗 Quellen",
        mentorLäst: "📖 Lu",
        mentorLogg: "📋 Journal",
        mentorSpara: "Enregistrer",
        mentorNyTask: "Nouvelle tâche ou suivi…",
        mentorIngaTasks: "Aucune tâche — écrivez un suivi ci-dessus et appuyez sur ＋",
        mentorIngaLogg: "Aucune session sauvegardée — cliquez sur 💾 dans l'en-tête.",
        mentorIngaKällor: "Aucune source — ajoutées automatiquement lors de recherches ou via 📎",
        mentorIngaLäslogg: "Cliquez sur 📖 pour ajouter des pages annotées.",
        mentorLoggaIn: "Connectez-vous pour utiliser votre assistant de recherche.",
        mentorLoggaInKnapp: "Se connecter",
    },

    "en-GB": {
        // --- Popup ---
        apiNyckel: "API Key",
        apiPlaceholder: "sk-ant-...",
        sparaNyckel: "Save key",
        annoteraSidan: "Annotate this page",
        avancerat: "Advanced...",
        modellLabel: "Model",
        temperatureLabel: "Temperature",
        valjFarg: "Choose colour",
        spara: "Save",
        nyckelSparad: "Key saved",
        sparad: "Saved",
        installningarSparade: "Settings saved",
        opusTempNot: "Opus 4.7 requires temperature 1.0",
        sprakLabel: "Language",
        opus: "Opus 4.7 (most powerful)",
        sonnet: "Sonnet 4.6 (balanced)",
        haiku: "Haiku 4.5 (fastest)",
        modellInfoFree: "Annotation: Sonnet · Chat: Haiku",
        modellUppgradera: "Upgrade to Pro or VIP to use more powerful models like Opus for both annotation and chat.",

        // --- Sidopanel ---
        header: "AIuda Reader",
        exportera: "↓ Export",
        stallEnFraga: "Ask a question...",
        ingaAndra: "No other annotations with history.",
        valjMarkering: "Select annotation to cross-reference",
        meddelandenSuffix: "messages",
        nagorGickFel: "Something went wrong.",
        kvotSlut: "You have used all your credits for this month. Upgrade your plan or purchase additional credits.",
        kvotVarning: "⚠ You are approaching your monthly limit.",
        vipPlan: "VIP — unlimited",
        hanteraPrenumeration: "Manage subscription →",
        köpKrediter: "Buy credits",
        uppgraderaPro: "Upgrade to Pro — €9.99/month",
        uppgraderaVip: "Upgrade to VIP — €19.99/month",
        consentText: "AIuda Reader stores your login info and preferences locally, and your email and usage data on our servers. Text you annotate is sent to Anthropic's Claude API. The extension enables text selection within links to allow word lookup on all page types.",
        consentLank: "Privacy Policy",
        consentKnapp: "I agree",

        // --- Export markdown ---
        exportRubrik: "AIuda Reader — Exported history",
        exportDatum: "Exported",
        datumLocale: "en-GB",
        exportKategori: "Category",
        exportBeskrivning: "Description",
        exportDu: "You",
        exportIngenChatt: "*No chat*",

        // --- Promptar ---
        chatOmSidan: "Chat about page",
        forklaraSammanhang: "Explain this in its context.",
        forklaraHela: "Give me an overview of this text.",
        forklaraResearch: "I'm starting a research session. Please briefly introduce yourself as my research assistant and confirm my research question.",
        forklaraKategori: (k) => `Summarize what this page says about "${k}".`,
        identifieraOrd: "Identify difficult words",
        nivaer: ["Beginner", "Intermediate", "Advanced", "Native speaker"],

        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `You are a helpful guide for text the user is reading.
The text is about: ${sammanfattning}
The user has highlighted the phrase "${fras}" in the category "${kategori}".
Description: ${beskrivning}
Help the user explore and understand this phrase in its context.
Always respond in English, regardless of the language of the text.`,

        helTextSystemPrompt: (text, sammanfattning) =>
            `You are a helpful guide for text the user is reading.
Summary: ${sammanfattning}

Full text:
${text}

Help the user explore and understand the text.
Always respond in English, regardless of the language of the text.`,

        annoteringsPrompt: (text) =>
            `Analyse the following text and return ONLY a JSON object without explanations or markdown.

Identify 3-5 meaningful categories that fit the content and theme of the text.
For each category, choose a distinct colour in hex format.
Then annotate the text with phrases belonging to the categories.
Use English for all category names and descriptions.

Format:
{
  "sammanfattning": "One or a few sentences about what the text is about",
  "kategorier": [
    {"namn": "categoryname", "farg": "#hexcolour", "beskrivning": "short description of the category"}
  ],
  "annoteringar": [
    {"text": "...", "kategori": "categoryname", "beskrivning": "..."}
  ]
}

Text:
${text}`,

        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Cross-reference to "${annanFras}"]\n${utdrag}\n\nHow does this relate to our discussion about "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Welcome to AIuda Mentor™",
        mentorVäljProjekt: "Choose a project on the left\nor create a new one.",
        mentorNyttProjekt: "New project",
        mentorProjektnamn: "Project name",
        mentorFrageställning: "Your research question…",
        mentorStarta: "Start →",
        mentorStällFraga: "Ask a question…",
        mentorNotat: "📝 Notes",
        mentorTasks: "✅ Tasks",
        mentorKällor: "🔗 Sources",
        mentorLäst: "📖 Read",
        mentorLogg: "📋 Log",
        mentorSpara: "Save",
        mentorNyTask: "New follow-up or task…",
        mentorIngaTasks: "No tasks yet — write a follow-up above and press ＋",
        mentorIngaLogg: "No saved sessions yet — click 💾 in the chat header to save.",
        mentorIngaKällor: "No sources yet — added automatically when searching or via 📎",
        mentorIngaLäslogg: "Click 📖 to add annotated pages.",
        mentorLoggaIn: "Sign in to use your research assistant.",
        mentorLoggaInKnapp: "Sign in",
    },

    sv: {
        // --- Popup ---
        apiNyckel: "API-nyckel",
        apiPlaceholder: "sk-ant-...",
        sparaNyckel: "Spara nyckel",
        annoteraSidan: "Annotera den här sidan",
        avancerat: "Avancerat...",
        modellLabel: "Modell",
        temperatureLabel: "Temperature",
        valjFarg: "Välj färg",
        spara: "Spara",
        nyckelSparad: "Nyckel sparad",
        sparad: "Sparad",
        installningarSparade: "Inställningar sparade",
        opusTempNot: "Opus 4.7 kräver temperature 1.0",
        sprakLabel: "Språk",
        opus: "Opus 4.7 (kraftfullast)",
        sonnet: "Sonnet 4.6 (balanserad)",
        haiku: "Haiku 4.5 (snabbast)",
        modellInfoFree: "Annotering: Sonnet · Chatt: Haiku",
        modellUppgradera: "Uppgradera till Pro eller VIP för att använda kraftfullare modeller som Opus för både annotering och chatt.",


        // --- Sidopanel ---
        header: "AIuda Reader",
        exportera: "↓ Exportera",
        stallEnFraga: "Ställ en fråga...",
        ingaAndra: "Inga andra markeringar med historik.",
        valjMarkering: "Välj markering att korsreferera",
        meddelandenSuffix: "meddelanden",
        nagorGickFel: "Något gick fel.",
        kvotSlut: "Du har använt alla krediter för denna månad. Uppgradera din plan eller köp till krediter.",
        kvotVarning: "⚠ Du närmar dig din månadsgräns.",
        vipPlan: "VIP — obegränsat",
        hanteraPrenumeration: "Hantera prenumeration →",
        köpKrediter: "Köp krediter",
        uppgraderaPro: "Uppgradera till Pro — €9,99/mån",
        uppgraderaVip: "Uppgradera till VIP — €19,99/mån",
        consentText: "AIuda Reader lagrar din inloggning och dina inställningar lokalt, samt din e-post och användningsdata på våra servrar. Text du annoterar skickas till Anthropics Claude API. Tillägget aktiverar textmarkering i länktexter för att möjliggöra orduppslagning på alla typer av sidor.",
        consentLank: "Integritetspolicy",
        consentKnapp: "Jag godkänner",

        // --- Export markdown ---
        exportRubrik: "AIuda Reader — Exporterad historik",
        exportDatum: "Exporterad",
        datumLocale: "sv-SE",
        exportKategori: "Kategori",
        exportBeskrivning: "Beskrivning",
        exportDu: "Du",
        exportIngenChatt: "*Ingen chatt*",

        // --- Promptar ---
        chatOmSidan: "Chatta om sidan",
        forklaraSammanhang: "Förklara detta i sitt sammanhang.",
        forklaraHela: "Ge mig en överblick över den här texten.",
        forklaraResearch: "Jag startar en research-session. Presentera dig kort som min research-assistent och bekräfta min frågeställning.",
        forklaraKategori: (k) => `Sammanfatta vad den här sidan säger om "${k}".`,
        identifieraOrd: "Identifiera svåra ord",
        nivaer: ["Nybörjare", "Medel", "Avancerad", "Modersmålstalare"],

        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `Du är en hjälpsam guide för text som användaren läser.
Texten handlar om: ${sammanfattning}
Användaren har markerat frasen "${fras}" i kategorin "${kategori}".
Beskrivning: ${beskrivning}
Hjälp användaren utforska och förstå denna fras i sitt sammanhang.
Svara alltid på svenska, oavsett vilket språk texten är skriven på.`,

        helTextSystemPrompt: (text, sammanfattning) =>
            `Du är en hjälpsam guide för text som användaren läser.
Sammanfattning: ${sammanfattning}

Hela texten:
${text}

Hjälp användaren utforska och förstå texten.
Svara alltid på svenska, oavsett vilket språk texten är skriven på.`,

        annoteringsPrompt: (text) =>
            `Analysera följande text och returnera ENDAST ett JSON-objekt utan förklaringar eller markdown.

Identifiera själv 3-5 meningsfulla kategorier som passar textens innehåll och tema.
För varje kategori, välj en distinkt färg i hex-format.
Annotera sedan texten med fraser som tillhör kategorierna.
Använd svenska för alla kategorinamn och beskrivningar.

Format:
{
  "sammanfattning": "En eller ett par meningar om vad texten handlar om",
  "kategorier": [
    {"namn": "kategorinamn", "farg": "#hexfarg", "beskrivning": "kort beskrivning av kategorin"}
  ],
  "annoteringar": [
    {"text": "...", "kategori": "kategorinamn", "beskrivning": "..."}
  ]
}

Text:
${text}`,

        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Korsreferens till "${annanFras}"]\n${utdrag}\n\nHur relaterar detta till vår diskussion om "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Välkommen till AIuda Mentor™",
        mentorVäljProjekt: "Välj ett projekt till vänster\neller skapa ett nytt.",
        mentorNyttProjekt: "Nytt projekt",
        mentorProjektnamn: "Projektnamn",
        mentorFrageställning: "Din frågeställning…",
        mentorStarta: "Starta →",
        mentorStällFraga: "Ställ en fråga…",
        mentorNotat: "📝 Notat",
        mentorTasks: "✅ Tâches",
        mentorKällor: "🔗 Källor",
        mentorLäst: "📖 Läst",
        mentorLogg: "📋 Logg",
        mentorSpara: "Spara",
        mentorNyTask: "Ny uppföljning eller task…",
        mentorIngaTasks: "Inga tasks ännu — skriv en uppföljning ovan och tryck ＋",
        mentorIngaLogg: "Inga sparade sessioner ännu — klicka 💾 i chatt-headern för att spara.",
        mentorIngaKällor: "Inga källor ännu — läggs till automatiskt vid sökning eller via 📎",
        mentorIngaLäslogg: "Klicka 📖 för att lägga till annoterade sidor.",
        mentorLoggaIn: "Logga in för att använda din research-assistent.",
        mentorLoggaInKnapp: "Logga in",
    },

    es: {
        apiNyckel: "Clave API", apiPlaceholder: "sk-ant-...", sparaNyckel: "Guardar clave",
        annoteraSidan: "Anotar esta página", avancerat: "Avanzado...", modellLabel: "Modelo",
        temperatureLabel: "Temperatura", valjFarg: "Elegir color", spara: "Guardar",
        nyckelSparad: "Clave guardada", sparad: "Guardado", installningarSparade: "Ajustes guardados",
        opusTempNot: "Opus 4.7 requiere temperatura 1.0", sprakLabel: "Idioma",
        opus: "Opus 4.7 (más potente)", sonnet: "Sonnet 4.6 (equilibrado)", haiku: "Haiku 4.5 (más rápido)",
        modellInfoFree: "Anotación: Sonnet · Chat: Haiku",
        modellUppgradera: "Actualiza a Pro o VIP para usar modelos más potentes como Opus.",
        header: "AIuda Reader", exportera: "↓ Exportar", stallEnFraga: "Haz una pregunta...",
        ingaAndra: "No hay otras anotaciones con historial.", valjMarkering: "Selecciona anotación para referenciar",
        meddelandenSuffix: "mensajes", nagorGickFel: "Algo salió mal.", kvotSlut: "Has usado todos tus créditos este mes. Actualiza tu plan o compra créditos adicionales.", kvotVarning: "⚠ Te estás acercando a tu límite mensual.", vipPlan: "VIP — ilimitado", hanteraPrenumeration: "Gestionar suscripción →", köpKrediter: "Comprar créditos", uppgraderaPro: "Mejorar a Pro — €9,99/mes", uppgraderaVip: "Mejorar a VIP — €19,99/mes", consentText: "AIuda Reader almacena tu información de inicio de sesión y preferencias localmente, y tu correo y datos de uso en nuestros servidores. El texto que anotas se envía a la API Claude de Anthropic. La extensión activa la selección de texto en enlaces para permitir búsquedas de palabras en todo tipo de páginas.", consentLank: "Política de privacidad", consentKnapp: "Acepto",
        exportRubrik: "AIuda Reader — Historial exportado", exportDatum: "Exportado",
        datumLocale: "es-ES", exportKategori: "Categoría", exportBeskrivning: "Descripción",
        exportDu: "Tú", exportIngenChatt: "*Sin chat*",
        chatOmSidan: "Chat sobre la página", forklaraSammanhang: "Explica esto en su contexto.",
        forklaraResearch: "Estoy iniciando una sesión de investigación. Preséntate brevemente como mi asistente de investigación y confirma mi pregunta de investigación.",
        forklaraHela: "Dame una visión general de este texto.",
        forklaraKategori: (k) => `Resume lo que dice esta página sobre "${k}".`,
        identifieraOrd: "Identificar palabras difíciles",
        nivaer: ["Principiante", "Intermedio", "Avanzado", "Hablante nativo"],
        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `Eres una guía útil para el texto que lee el usuario.\nEl texto trata sobre: ${sammanfattning}\nEl usuario ha marcado la frase "${fras}" en la categoría "${kategori}".\nDescripción: ${beskrivning}\nAyuda al usuario a explorar y comprender esta frase en su contexto.\nResponde siempre en español, independientemente del idioma del texto.`,
        helTextSystemPrompt: (text, sammanfattning) =>
            `Eres una guía útil para el texto que lee el usuario.\nResumen: ${sammanfattning}\n\nTexto completo:\n${text}\n\nAyuda al usuario a explorar y comprender el texto.\nResponde siempre en español, independientemente del idioma del texto.`,
        annoteringsPrompt: (text) =>
            `Analiza el siguiente texto y devuelve SOLO un objeto JSON sin explicaciones ni markdown.\n\nIdentifica 3-5 categorías significativas que se ajusten al contenido y tema del texto.\nPara cada categoría, elige un color distinto en formato hex.\nAnota el texto con frases pertenecientes a las categorías.\nUsa español para todos los nombres de categorías y descripciones.\n\nFormato:\n{\n  "sammanfattning": "Una o varias frases sobre de qué trata el texto",\n  "kategorier": [\n    {"namn": "nombrecategoria", "farg": "#hexcolor", "beskrivning": "descripción corta de la categoría"}\n  ],\n  "annoteringar": [\n    {"text": "...", "kategori": "nombrecategoria", "beskrivning": "..."}\n  ]\n}\n\nTexto:\n${text}`,
        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Referencia cruzada a "${annanFras}"]\n${utdrag}\n\n¿Cómo se relaciona esto con nuestra discusión sobre "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Bienvenido a AIuda Mentor™",
        mentorVäljProjekt: "Elige un proyecto a la izquierda\no crea uno nuevo.",
        mentorNyttProjekt: "Nuevo proyecto",
        mentorProjektnamn: "Nombre del proyecto",
        mentorFrageställning: "Tu pregunta de investigación…",
        mentorStarta: "Iniciar →",
        mentorStällFraga: "Haz una pregunta…",
        mentorNotat: "📝 Notas",
        mentorTasks: "✅ Tareas",
        mentorKällor: "🔗 Fuentes",
        mentorLäst: "📖 Leído",
        mentorLogg: "📋 Registro",
        mentorSpara: "Guardar",
        mentorNyTask: "Nueva tarea o seguimiento…",
        mentorIngaTasks: "Sin tareas — escribe un seguimiento arriba y pulsa ＋",
        mentorIngaLogg: "No hay sesiones guardadas — haz clic en 💾 en el encabezado.",
        mentorIngaKällor: "Sin fuentes — se añaden automáticamente al buscar o con 📎",
        mentorIngaLäslogg: "Haz clic en 📖 para añadir páginas anotadas.",
        mentorLoggaIn: "Inicia sesión para usar tu asistente de investigación.",
        mentorLoggaInKnapp: "Iniciar sesión",
    },

    fr: {
        apiNyckel: "Clé API", apiPlaceholder: "sk-ant-...", sparaNyckel: "Enregistrer la clé",
        annoteraSidan: "Annoter cette page", avancerat: "Avancé...", modellLabel: "Modèle",
        temperatureLabel: "Température", valjFarg: "Choisir couleur", spara: "Enregistrer",
        nyckelSparad: "Clé enregistrée", sparad: "Enregistré", installningarSparade: "Paramètres enregistrés",
        opusTempNot: "Opus 4.7 nécessite température 1.0", sprakLabel: "Langue",
        opus: "Opus 4.7 (le plus puissant)", sonnet: "Sonnet 4.6 (équilibré)", haiku: "Haiku 4.5 (le plus rapide)",
        modellInfoFree: "Annotation : Sonnet · Chat : Haiku",
        modellUppgradera: "Passez à Pro ou VIP pour utiliser des modèles plus puissants comme Opus.",
        header: "AIuda Reader", exportera: "↓ Exporter", stallEnFraga: "Posez une question...",
        ingaAndra: "Aucune autre annotation avec historique.", valjMarkering: "Sélectionner une annotation à référencer",
        meddelandenSuffix: "messages", nagorGickFel: "Quelque chose s'est mal passé.", kvotSlut: "Vous avez utilisé tous vos crédits ce mois-ci. Mettez à niveau votre forfait ou achetez des crédits.", kvotVarning: "⚠ Vous approchez de votre limite mensuelle.", vipPlan: "VIP — illimité", hanteraPrenumeration: "Gérer l'abonnement →", köpKrediter: "Acheter des crédits", uppgraderaPro: "Passer à Pro — 9,99 €/mois", uppgraderaVip: "Passer à VIP — 19,99 €/mois", consentText: "AIuda Reader stocke vos informations de connexion et préférences localement, et votre e-mail et données d'utilisation sur nos serveurs. Le texte annoté est envoyé à l'API Claude d'Anthropic. L'extension active la sélection de texte dans les liens pour permettre la recherche de mots sur tous les types de pages.", consentLank: "Politique de confidentialité", consentKnapp: "J'accepte",
        exportRubrik: "AIuda Reader — Historique exporté", exportDatum: "Exporté",
        datumLocale: "fr-FR", exportKategori: "Catégorie", exportBeskrivning: "Description",
        exportDu: "Vous", exportIngenChatt: "*Pas de chat*",
        chatOmSidan: "Chat sur la page", forklaraSammanhang: "Expliquez ceci dans son contexte.",
        forklaraResearch: "Je démarre une session de recherche. Présentez-vous brièvement comme mon assistant de recherche et confirmez ma question de recherche.",
        forklaraHela: "Donnez-moi un aperçu de ce texte.",
        forklaraKategori: (k) => `Résumez ce que cette page dit sur "${k}".`,
        identifieraOrd: "Identifier les mots difficiles",
        nivaer: ["Débutant", "Intermédiaire", "Avancé", "Locuteur natif"],
        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `Vous êtes un guide utile pour le texte que l'utilisateur lit.\nLe texte porte sur : ${sammanfattning}\nL'utilisateur a mis en évidence la phrase "${fras}" dans la catégorie "${kategori}".\nDescription : ${beskrivning}\nAidez l'utilisateur à explorer et comprendre cette phrase dans son contexte.\nRépondez toujours en français, quelle que soit la langue du texte.`,
        helTextSystemPrompt: (text, sammanfattning) =>
            `Vous êtes un guide utile pour le texte que l'utilisateur lit.\nRésumé : ${sammanfattning}\n\nTexte complet :\n${text}\n\nAidez l'utilisateur à explorer et comprendre le texte.\nRépondez toujours en français, quelle que soit la langue du texte.`,
        annoteringsPrompt: (text) =>
            `Analysez le texte suivant et renvoyez UNIQUEMENT un objet JSON sans explications ni markdown.\n\nIdentifiez 3 à 5 catégories significatives adaptées au contenu et au thème du texte.\nPour chaque catégorie, choisissez une couleur distincte au format hex.\nAnnotez le texte avec des phrases appartenant aux catégories.\nUtilisez le français pour tous les noms de catégories et descriptions.\n\nFormat :\n{\n  "sammanfattning": "Une ou plusieurs phrases sur le sujet du texte",\n  "kategorier": [\n    {"namn": "nomcategorie", "farg": "#hexcouleur", "beskrivning": "courte description de la catégorie"}\n  ],\n  "annoteringar": [\n    {"text": "...", "kategori": "nomcategorie", "beskrivning": "..."}\n  ]\n}\n\nTexte :\n${text}`,
        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Référence croisée à "${annanFras}"]\n${utdrag}\n\nComment cela se rapporte-t-il à notre discussion sur "${nuvarandeFras}" ?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Bienvenue dans AIuda Mentor™",
        mentorVäljProjekt: "Choisissez un projet à gauche\nor créez-en un nouveau.",
        mentorNyttProjekt: "Nouveau projet",
        mentorProjektnamn: "Nom du projet",
        mentorFrageställning: "Votre question de recherche…",
        mentorStarta: "Démarrer →",
        mentorStällFraga: "Posez une question…",
        mentorNotat: "📝 Notes",
        mentorTasks: "✅ Tâches",
        mentorKällor: "🔗 Sources",
        mentorLäst: "📖 Lu",
        mentorLogg: "📋 Journal",
        mentorSpara: "Enregistrer",
        mentorNyTask: "Nouvelle tâche ou suivi…",
        mentorIngaTasks: "Aucune tâche — écrivez un suivi ci-dessus et appuyez sur ＋",
        mentorIngaLogg: "Aucune session sauvegardée — cliquez sur 💾 dans l'en-tête.",
        mentorIngaKällor: "Aucune source — ajoutées automatiquement via 📎",
        mentorIngaLäslogg: "Cliquez sur 📖 pour ajouter des pages annotées.",
        mentorLoggaIn: "Connectez-vous pour utiliser votre assistant de recherche.",
        mentorLoggaInKnapp: "Se connecter",
    },

    de: {
        apiNyckel: "API-Schlüssel", apiPlaceholder: "sk-ant-...", sparaNyckel: "Schlüssel speichern",
        annoteraSidan: "Diese Seite annotieren", avancerat: "Erweitert...", modellLabel: "Modell",
        temperatureLabel: "Temperatur", valjFarg: "Farbe wählen", spara: "Speichern",
        nyckelSparad: "Schlüssel gespeichert", sparad: "Gespeichert", installningarSparade: "Einstellungen gespeichert",
        opusTempNot: "Opus 4.7 benötigt Temperatur 1.0", sprakLabel: "Sprache",
        opus: "Opus 4.7 (leistungsstärkste)", sonnet: "Sonnet 4.6 (ausgewogen)", haiku: "Haiku 4.5 (schnellste)",
        modellInfoFree: "Annotierung: Sonnet · Chat: Haiku",
        modellUppgradera: "Upgraden Sie auf Pro oder VIP für leistungsstärkere Modelle wie Opus.",
        header: "AIuda Reader", exportera: "↓ Exportieren", stallEnFraga: "Stellen Sie eine Frage...",
        ingaAndra: "Keine anderen Annotierungen mit Verlauf.", valjMarkering: "Annotierung zum Querverweisen auswählen",
        meddelandenSuffix: "Nachrichten", nagorGickFel: "Etwas ist schiefgelaufen.", kvotSlut: "Sie haben alle Kredite für diesen Monat aufgebraucht. Upgraden Sie Ihren Plan oder kaufen Sie Kredite.", kvotVarning: "⚠ Sie nähern sich Ihrem monatlichen Limit.", vipPlan: "VIP — unbegrenzt", hanteraPrenumeration: "Abonnement verwalten →", köpKrediter: "Kredite kaufen", uppgraderaPro: "Auf Pro upgraden — 9,99 €/Monat", uppgraderaVip: "Auf VIP upgraden — 19,99 €/Monat", consentText: "AIuda Reader speichert Ihre Anmeldedaten und Einstellungen lokal sowie Ihre E-Mail und Nutzungsdaten auf unseren Servern. Annotierter Text wird an Anthropics Claude API gesendet. Die Erweiterung aktiviert die Textauswahl in Links, um die Wortsuche auf allen Seitentypen zu ermöglichen.", consentLank: "Datenschutzrichtlinie", consentKnapp: "Ich stimme zu",
        exportRubrik: "AIuda Reader — Exportierter Verlauf", exportDatum: "Exportiert",
        datumLocale: "de-DE", exportKategori: "Kategorie", exportBeskrivning: "Beschreibung",
        exportDu: "Sie", exportIngenChatt: "*Kein Chat*",
        chatOmSidan: "Chat über die Seite", forklaraSammanhang: "Erklären Sie dies in seinem Kontext.",
        forklaraResearch: "Ich starte eine Recherche-Sitzung. Stellen Sie sich kurz als mein Recherche-Assistent vor und bestätigen Sie meine Forschungsfrage.",
        forklaraHela: "Geben Sie mir einen Überblick über diesen Text.",
        forklaraKategori: (k) => `Fassen Sie zusammen, was diese Seite über "${k}" sagt.`,
        identifieraOrd: "Schwierige Wörter identifizieren",
        nivaer: ["Anfänger", "Mittelstufe", "Fortgeschritten", "Muttersprachler"],
        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `Sie sind ein hilfreicher Leitfaden für den Text, den der Benutzer liest.\nDer Text handelt von: ${sammanfattning}\nDer Benutzer hat den Ausdruck "${fras}" in der Kategorie "${kategori}" hervorgehoben.\nBeschreibung: ${beskrivning}\nHelfen Sie dem Benutzer, diesen Ausdruck in seinem Kontext zu erkunden und zu verstehen.\nAntworten Sie immer auf Deutsch, unabhängig von der Sprache des Textes.`,
        helTextSystemPrompt: (text, sammanfattning) =>
            `Sie sind ein hilfreicher Leitfaden für den Text, den der Benutzer liest.\nZusammenfassung: ${sammanfattning}\n\nVollständiger Text:\n${text}\n\nHelfen Sie dem Benutzer, den Text zu erkunden und zu verstehen.\nAntworten Sie immer auf Deutsch, unabhängig von der Sprache des Textes.`,
        annoteringsPrompt: (text) =>
            `Analysieren Sie den folgenden Text und geben Sie NUR ein JSON-Objekt ohne Erklärungen oder Markdown zurück.\n\nIdentifizieren Sie 3–5 bedeutungsvolle Kategorien, die zum Inhalt und Thema des Textes passen.\nWählen Sie für jede Kategorie eine eindeutige Farbe im Hex-Format.\nAnnotieren Sie den Text mit Phrasen, die zu den Kategorien gehören.\nVerwenden Sie Deutsch für alle Kategorienamen und Beschreibungen.\n\nFormat:\n{\n  "sammanfattning": "Ein oder mehrere Sätze darüber, worum es im Text geht",\n  "kategorier": [\n    {"namn": "kategoriename", "farg": "#hexfarbe", "beskrivning": "kurze Beschreibung der Kategorie"}\n  ],\n  "annoteringar": [\n    {"text": "...", "kategori": "kategoriename", "beskrivning": "..."}\n  ]\n}\n\nText:\n${text}`,
        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Querverweis auf "${annanFras}"]\n${utdrag}\n\nWie verhält sich das zu unserer Diskussion über "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Willkommen bei AIuda Mentor™",
        mentorVäljProjekt: "Wählen Sie ein Projekt links\noder erstellen Sie ein neues.",
        mentorNyttProjekt: "Neues Projekt",
        mentorProjektnamn: "Projektname",
        mentorFrageställning: "Ihre Forschungsfrage…",
        mentorStarta: "Starten →",
        mentorStällFraga: "Stellen Sie eine Frage…",
        mentorNotat: "📝 Notizen",
        mentorTasks: "✅ Aufgaben",
        mentorKällor: "🔗 Quellen",
        mentorLäst: "📖 Gelesen",
        mentorLogg: "📋 Protokoll",
        mentorSpara: "Speichern",
        mentorNyTask: "Neue Aufgabe oder Nachverfolgung…",
        mentorIngaTasks: "Keine Aufgaben — schreiben Sie eine Aufgabe oben und drücken Sie ＋",
        mentorIngaLogg: "Keine gespeicherten Sitzungen — klicken Sie auf 💾 im Chat-Header.",
        mentorIngaKällor: "Keine Quellen — werden automatisch bei Suchen oder über 📎 hinzugefügt",
        mentorIngaLäslogg: "Klicken Sie auf 📖 um annotierte Seiten hinzuzufügen.",
        mentorLoggaIn: "Melden Sie sich an, um Ihren Forschungsassistenten zu nutzen.",
        mentorLoggaInKnapp: "Anmelden",
    },

    it: {
        apiNyckel: "Chiave API", apiPlaceholder: "sk-ant-...", sparaNyckel: "Salva chiave",
        annoteraSidan: "Annota questa pagina", avancerat: "Avanzato...", modellLabel: "Modello",
        temperatureLabel: "Temperatura", valjFarg: "Scegli colore", spara: "Salva",
        nyckelSparad: "Chiave salvata", sparad: "Salvato", installningarSparade: "Impostazioni salvate",
        opusTempNot: "Opus 4.7 richiede temperatura 1.0", sprakLabel: "Lingua",
        opus: "Opus 4.7 (più potente)", sonnet: "Sonnet 4.6 (bilanciato)", haiku: "Haiku 4.5 (più veloce)",
        modellInfoFree: "Annotazione: Sonnet · Chat: Haiku",
        modellUppgradera: "Passa a Pro o VIP per modelli più potenti come Opus.",
        header: "AIuda Reader", exportera: "↓ Esporta", stallEnFraga: "Fai una domanda...",
        ingaAndra: "Nessun'altra annotazione con cronologia.", valjMarkering: "Seleziona annotazione da incrociare",
        meddelandenSuffix: "messaggi", nagorGickFel: "Qualcosa è andato storto.", kvotSlut: "Hai esaurito tutti i crediti per questo mese. Aggiorna il piano o acquista crediti aggiuntivi.", kvotVarning: "⚠ Stai per raggiungere il limite mensile.", vipPlan: "VIP — illimitato", hanteraPrenumeration: "Gestisci abbonamento →", köpKrediter: "Acquista crediti", uppgraderaPro: "Passa a Pro — €9,99/mese", uppgraderaVip: "Passa a VIP — €19,99/mese", consentText: "AIuda Reader memorizza le tue credenziali e preferenze localmente, e la tua email e i dati di utilizzo sui nostri server. Il testo annotato viene inviato all'API Claude di Anthropic. L'estensione abilita la selezione del testo nei link per consentire la ricerca di parole su tutti i tipi di pagine.", consentLank: "Informativa sulla privacy", consentKnapp: "Accetto",
        exportRubrik: "AIuda Reader — Cronologia esportata", exportDatum: "Esportato",
        datumLocale: "it-IT", exportKategori: "Categoria", exportBeskrivning: "Descrizione",
        exportDu: "Tu", exportIngenChatt: "*Nessuna chat*",
        chatOmSidan: "Chat sulla pagina", forklaraSammanhang: "Spiega questo nel suo contesto.",
        forklaraResearch: "Sto avviando una sessione di ricerca. Presentati brevemente come mio assistente di ricerca e conferma la mia domanda di ricerca.",
        forklaraHela: "Dammi una panoramica di questo testo.",
        forklaraKategori: (k) => `Riassumi cosa dice questa pagina su "${k}".`,
        identifieraOrd: "Identificare parole difficili",
        nivaer: ["Principiante", "Intermedio", "Avanzato", "Madrelingua"],
        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `Sei una guida utile per il testo che l'utente sta leggendo.\nIl testo riguarda: ${sammanfattning}\nL'utente ha evidenziato la frase "${fras}" nella categoria "${kategori}".\nDescrizione: ${beskrivning}\nAiuta l'utente a esplorare e comprendere questa frase nel suo contesto.\nRispondi sempre in italiano, indipendentemente dalla lingua del testo.`,
        helTextSystemPrompt: (text, sammanfattning) =>
            `Sei una guida utile per il testo che l'utente sta leggendo.\nRiepilogo: ${sammanfattning}\n\nTesto completo:\n${text}\n\nAiuta l'utente a esplorare e comprendere il testo.\nRispondi sempre in italiano, indipendentemente dalla lingua del testo.`,
        annoteringsPrompt: (text) =>
            `Analizza il testo seguente e restituisci SOLO un oggetto JSON senza spiegazioni o markdown.\n\nIdentifica 3-5 categorie significative adatte al contenuto e al tema del testo.\nPer ogni categoria, scegli un colore distinto in formato hex.\nAnnota il testo con frasi appartenenti alle categorie.\nUsa l'italiano per tutti i nomi di categorie e descrizioni.\n\nFormato:\n{\n  "sammanfattning": "Una o più frasi su di cosa tratta il testo",\n  "kategorier": [\n    {"namn": "nomecategoria", "farg": "#hexcolore", "beskrivning": "breve descrizione della categoria"}\n  ],\n  "annoteringar": [\n    {"text": "...", "kategori": "nomecategoria", "beskrivning": "..."}\n  ]\n}\n\nTesto:\n${text}`,
        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Riferimento incrociato a "${annanFras}"]\n${utdrag}\n\nCome si collega questo alla nostra discussione su "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Benvenuto in AIuda Mentor™",
        mentorVäljProjekt: "Scegli un progetto a sinistra\no creane uno nuovo.",
        mentorNyttProjekt: "Nuovo progetto",
        mentorProjektnamn: "Nome del progetto",
        mentorFrageställning: "La tua domanda di ricerca…",
        mentorStarta: "Avvia →",
        mentorStällFraga: "Fai una domanda…",
        mentorNotat: "📝 Note",
        mentorTasks: "✅ Attività",
        mentorKällor: "🔗 Fonti",
        mentorLäst: "📖 Letto",
        mentorLogg: "📋 Registro",
        mentorSpara: "Salva",
        mentorNyTask: "Nuova attività o follow-up…",
        mentorIngaTasks: "Nessuna attività — scrivi un follow-up sopra e premi ＋",
        mentorIngaLogg: "Nessuna sessione salvata — clicca 💾 nell'intestazione chat.",
        mentorIngaKällor: "Nessuna fonte — aggiunte automaticamente durante le ricerche o con 📎",
        mentorIngaLäslogg: "Clicca 📖 per aggiungere pagine annotate.",
        mentorLoggaIn: "Accedi per usare il tuo assistente di ricerca.",
        mentorLoggaInKnapp: "Accedi",
    },

    no: {
        apiNyckel: "API-nøkkel", apiPlaceholder: "sk-ant-...", sparaNyckel: "Lagre nøkkel",
        annoteraSidan: "Annotér denne siden", avancerat: "Avansert...", modellLabel: "Modell",
        temperatureLabel: "Temperatur", valjFarg: "Velg farge", spara: "Lagre",
        nyckelSparad: "Nøkkel lagret", sparad: "Lagret", installningarSparade: "Innstillinger lagret",
        opusTempNot: "Opus 4.7 krever temperatur 1.0", sprakLabel: "Språk",
        opus: "Opus 4.7 (kraftigst)", sonnet: "Sonnet 4.6 (balansert)", haiku: "Haiku 4.5 (raskest)",
        modellInfoFree: "Annotering: Sonnet · Chat: Haiku",
        modellUppgradera: "Oppgrader til Pro eller VIP for kraftigere modeller som Opus.",
        header: "AIuda Reader", exportera: "↓ Eksporter", stallEnFraga: "Still et spørsmål...",
        ingaAndra: "Ingen andre annoteringer med historikk.", valjMarkering: "Velg annotering å kryssreferere",
        meddelandenSuffix: "meldinger", nagorGickFel: "Noe gikk galt.", kvotSlut: "Du har brukt alle kredittene for denne måneden. Oppgrader planen eller kjøp ekstra kreditter.", kvotVarning: "⚠ Du nærmer deg din månedlige grense.", vipPlan: "VIP — ubegrenset", hanteraPrenumeration: "Administrer abonnement →", köpKrediter: "Kjøp kreditter", uppgraderaPro: "Oppgrader til Pro — €9,99/mnd", uppgraderaVip: "Oppgrader til VIP — €19,99/mnd", consentText: "AIuda Reader lagrer påloggingsinformasjon og innstillinger lokalt, og e-post og bruksdata på våre servere. Tekst du annoterer sendes til Anthropics Claude API. Tillegget aktiverer tekstmarkering i lenker for å muliggjøre ordoppslag på alle typer sider.", consentLank: "Personvernerklæring", consentKnapp: "Jeg godtar",
        exportRubrik: "AIuda Reader — Eksportert historikk", exportDatum: "Eksportert",
        datumLocale: "nb-NO", exportKategori: "Kategori", exportBeskrivning: "Beskrivelse",
        exportDu: "Du", exportIngenChatt: "*Ingen chat*",
        chatOmSidan: "Chat om siden", forklaraSammanhang: "Forklar dette i sin sammenheng.",
        forklaraResearch: "Jeg starter en forskningssesjon. Introduser deg kort som min forskningsassistent og bekreft forskningsspørsmålet mitt.",
        forklaraHela: "Gi meg en oversikt over denne teksten.",
        forklaraKategori: (k) => `Oppsummer hva denne siden sier om "${k}".`,
        identifieraOrd: "Identifiser vanskelige ord",
        nivaer: ["Nybegynner", "Middels", "Avansert", "Morsmålsbruker"],
        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `Du er en nyttig guide for teksten brukeren leser.\nTeksten handler om: ${sammanfattning}\nBrukeren har markert frasen "${fras}" i kategorien "${kategori}".\nBeskrivelse: ${beskrivning}\nHjelp brukeren med å utforske og forstå denne frasen i sin sammenheng.\nSvar alltid på norsk, uavhengig av tekstens språk.`,
        helTextSystemPrompt: (text, sammanfattning) =>
            `Du er en nyttig guide for teksten brukeren leser.\nSammendrag: ${sammanfattning}\n\nFullstendig tekst:\n${text}\n\nHjelp brukeren med å utforske og forstå teksten.\nSvar alltid på norsk, uavhengig av tekstens språk.`,
        annoteringsPrompt: (text) =>
            `Analyser følgende tekst og returner KUN et JSON-objekt uten forklaringer eller markdown.\n\nIdentifiser 3–5 meningsfulle kategorier som passer til innholdet og temaet i teksten.\nVelg en distinkt farge i hex-format for hver kategori.\nAnnoter teksten med fraser som tilhører kategoriene.\nBruk norsk for alle kategorinavn og beskrivelser.\n\nFormat:\n{\n  "sammanfattning": "En eller flere setninger om hva teksten handler om",\n  "kategorier": [\n    {"namn": "kategorinavn", "farg": "#hexfarge", "beskrivning": "kort beskrivelse av kategorien"}\n  ],\n  "annoteringar": [\n    {"text": "...", "kategori": "kategorinavn", "beskrivning": "..."}\n  ]\n}\n\nTekst:\n${text}`,
        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Kryssreferanse til "${annanFras}"]\n${utdrag}\n\nHvordan relaterer dette seg til diskusjonen vår om "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Velkommen til AIuda Mentor™",
        mentorVäljProjekt: "Velg et prosjekt til venstre\neller opprett et nytt.",
        mentorNyttProjekt: "Nytt prosjekt",
        mentorProjektnamn: "Prosjektnavn",
        mentorFrageställning: "Ditt forskningsspørsmål…",
        mentorStarta: "Start →",
        mentorStällFraga: "Still et spørsmål…",
        mentorNotat: "📝 Notater",
        mentorTasks: "✅ Oppgaver",
        mentorKällor: "🔗 Kilder",
        mentorLäst: "📖 Lest",
        mentorLogg: "📋 Logg",
        mentorSpara: "Lagre",
        mentorNyTask: "Ny oppgave eller oppfølging…",
        mentorIngaTasks: "Ingen oppgaver — skriv en oppfølging ovenfor og trykk ＋",
        mentorIngaLogg: "Ingen lagrede økter — klikk 💾 i chatoverskriften.",
        mentorIngaKällor: "Ingen kilder — legges til automatisk ved søk eller via 📎",
        mentorIngaLäslogg: "Klikk 📖 for å legge til annoterte sider.",
        mentorLoggaIn: "Logg inn for å bruke din forskningsassistent.",
        mentorLoggaInKnapp: "Logg inn",
    },

    da: {
        apiNyckel: "API-nøgle", apiPlaceholder: "sk-ant-...", sparaNyckel: "Gem nøgle",
        annoteraSidan: "Annotér denne side", avancerat: "Avanceret...", modellLabel: "Model",
        temperatureLabel: "Temperatur", valjFarg: "Vælg farve", spara: "Gem",
        nyckelSparad: "Nøgle gemt", sparad: "Gemt", installningarSparade: "Indstillinger gemt",
        opusTempNot: "Opus 4.7 kræver temperatur 1.0", sprakLabel: "Sprog",
        opus: "Opus 4.7 (mest kraftfuld)", sonnet: "Sonnet 4.6 (afbalanceret)", haiku: "Haiku 4.5 (hurtigst)",
        modellInfoFree: "Annotering: Sonnet · Chat: Haiku",
        modellUppgradera: "Opgrader til Pro eller VIP for kraftigere modeller som Opus.",
        header: "AIuda Reader", exportera: "↓ Eksportér", stallEnFraga: "Stil et spørgsmål...",
        ingaAndra: "Ingen andre annoteringer med historik.", valjMarkering: "Vælg annotering til krydsvisen",
        meddelandenSuffix: "beskeder", nagorGickFel: "Noget gik galt.", kvotSlut: "Du har brugt alle dine kreditter for denne måned. Opgrader din plan eller køb ekstra kreditter.", kvotVarning: "⚠ Du nærmer dig din månedlige grænse.", vipPlan: "VIP — ubegrænset", hanteraPrenumeration: "Administrer abonnement →", köpKrediter: "Køb kreditter", uppgraderaPro: "Opgrader til Pro — €9,99/md", uppgraderaVip: "Opgrader til VIP — €19,99/md", consentText: "AIuda Reader gemmer dine loginoplysninger og indstillinger lokalt samt din e-mail og brugsdata på vores servere. Tekst du annoterer sendes til Anthropics Claude API. Udvidelsen aktiverer tekstmarkering i links for at muliggøre ordopslag på alle typer sider.", consentLank: "Privatlivspolitik", consentKnapp: "Jeg accepterer",
        exportRubrik: "AIuda Reader — Eksporteret historik", exportDatum: "Eksporteret",
        datumLocale: "da-DK", exportKategori: "Kategori", exportBeskrivning: "Beskrivelse",
        exportDu: "Du", exportIngenChatt: "*Ingen chat*",
        chatOmSidan: "Chat om siden", forklaraSammanhang: "Forklar dette i sin sammenhæng.",
        forklaraResearch: "Jeg starter en forskningssession. Præsenter dig kort som min forskningsassistent og bekræft mit forskningsspørgsmål.",
        forklaraHela: "Giv mig et overblik over denne tekst.",
        forklaraKategori: (k) => `Opsummer hvad denne side siger om "${k}".`,
        identifieraOrd: "Identificer svære ord",
        nivaer: ["Begynder", "Mellemniveau", "Avanceret", "Modersmålsbruger"],
        systemPrompt: (fras, kategori, beskrivning, sammanfattning) =>
            `Du er en nyttig guide til den tekst, brugeren læser.\nTeksten handler om: ${sammanfattning}\nBrugeren har markeret frasen "${fras}" i kategorien "${kategori}".\nBeskrivelse: ${beskrivning}\nHjælp brugeren med at udforske og forstå denne frase i dens sammenhæng.\nSvar altid på dansk, uanset tekstens sprog.`,
        helTextSystemPrompt: (text, sammanfattning) =>
            `Du er en nyttig guide til den tekst, brugeren læser.\nResumé: ${sammanfattning}\n\nFuld tekst:\n${text}\n\nHjælp brugeren med at udforske og forstå teksten.\nSvar altid på dansk, uanset tekstens sprog.`,
        annoteringsPrompt: (text) =>
            `Analyser følgende tekst og returner KUN et JSON-objekt uden forklaringer eller markdown.\n\nIdentificer 3–5 meningsfulde kategorier, der passer til tekstens indhold og tema.\nVælg en distinkt farve i hex-format for hver kategori.\nAnnotér teksten med fraser, der tilhører kategorierne.\nBrug dansk til alle kategorinavne og beskrivelser.\n\nFormat:\n{\n  "sammanfattning": "En eller flere sætninger om, hvad teksten handler om",\n  "kategorier": [\n    {"namn": "kategorinavn", "farg": "#hexfarve", "beskrivning": "kort beskrivelse af kategorien"}\n  ],\n  "annoteringar": [\n    {"text": "...", "kategori": "kategorinavn", "beskrivning": "..."}\n  ]\n}\n\nTekst:\n${text}`,
        korsrefMeddelande: (annanFras, utdrag, nuvarandeFras) =>
            `[Krydsvisen til "${annanFras}"]\n${utdrag}\n\nHvordan relaterer dette sig til vores diskussion om "${nuvarandeFras}"?`,

        // --- AIuda Mentor ---
        mentorVälkommen: "Velkommen til AIuda Mentor™",
        mentorVäljProjekt: "Vælg et projekt til venstre\neller opret et nyt.",
        mentorNyttProjekt: "Nyt projekt",
        mentorProjektnamn: "Projektnavn",
        mentorFrageställning: "Dit forskningsspørgsmål…",
        mentorStarta: "Start →",
        mentorStällFraga: "Stil et spørgsmål…",
        mentorNotat: "📝 Notater",
        mentorTasks: "✅ Opgaver",
        mentorKällor: "🔗 Kilder",
        mentorLäst: "📖 Læst",
        mentorLogg: "📋 Log",
        mentorSpara: "Gem",
        mentorNyTask: "Ny opgave eller opfølgning…",
        mentorIngaTasks: "Ingen opgaver — skriv en opfølgning ovenfor og tryk ＋",
        mentorIngaLogg: "Ingen gemte sessioner — klik 💾 i chathoveden.",
        mentorIngaKällor: "Ingen kilder — tilføjes automatisk ved søgninger eller via 📎",
        mentorIngaLäslogg: "Klik 📖 for at tilføje annoterede sider.",
        mentorLoggaIn: "Log ind for at bruge din forskningsassistent.",
        mentorLoggaInKnapp: "Log ind",
    }
};
