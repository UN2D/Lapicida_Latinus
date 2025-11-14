// src/core/generators/adjectives.js
// Erzeugt "Adjektive im Kontext"-Fragen: Adjektiv + Nomen müssen kongruent sein.
// Berücksichtigt Mehrdeutigkeiten eines Nomen-Formstrings (z.B. "villae").
// Liefert pro Frage: prompt, correctOptions[], paradigm (nur gewähltes Genus), paradigmGender.

import data from "../../data/nounsAdjectives.json";
import adjMeta from "../../data/adjectives_meta.json";


function attachAdjMeta(question) {
    if (!question?.lemma) return;
    const meta = (adjMeta || []).find(m => m.lemma === question.lemma);
    if (!meta) return;

    // Beispiele pro Kasus (Anzeige oben/unterhalb der Ergebnisliste)
    question.helpExamples = meta.examples || null;

    // Optional ein bis zwei Beispielsätze (werden in der Result-Karte/Help-Box gezeigt)
    question.helpSampleSentences = meta.sampleSentences || [];
}

/* =========================
   Konstanten / Basismaps
   ========================= */
const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
const NUMBERS = ["Sg", "Pl"];
const GENDERS = ["m", "f", "n"];

const CASE_DE = { Nom: "Nominativ", Gen: "Genitiv", Dat: "Dativ", Akk: "Akkusativ", Abl: "Ablativ" };
const NUM_DE = { Sg: "Singular", Pl: "Plural" };
const GEN_DE = { m: "maskulin", f: "feminin", n: "neutrum" };

const DE_GENDER = GEN_DE; // Alias für kompakte Verwendungen

/* =========================
   Utilities: Datensatzprüfer
   ========================= */
function isNounEntry(e) {
    const pos = (e.pos || e.wordType || "").toLowerCase();
    return (
        pos === "noun" &&
        e.lemma && e.lemmaDe &&
        e.form &&
        CASES.includes(e.case) &&
        NUMBERS.includes(e.number) &&
        GENDERS.includes(e.gender)
    );
}

// Adjektiv-"Basen": keine K/N/G-Felder – nur Lemma/De/Pattern/Declension
function isAdjBase(e) {
    return (e.pos || "").toLowerCase() === "adj" && !!e.lemma && !!e.lemmaDe;
}

/* =========================
   Deutsch: Artikel & Endungen
   ========================= */

// bestimmter Artikel (vereinfacht; Ablativ ~ Dativ)
function germanDefArticle(c, n, g) {
    const m = {
        Nom: { Sg: "der", Pl: "die" },
        Akk: { Sg: "den", Pl: "die" },
        Dat: { Sg: (g === "f" ? "der" : "dem"), Pl: "den" },
        Gen: { Sg: (g === "f" ? "der" : "des"), Pl: "der" },
        Abl: { Sg: (g === "f" ? "der" : "dem"), Pl: "den" }, // Abl ~ Dat
    };
    return (m[c] && m[c][n]) || (n === "Sg" ? (g === "n" ? "das" : "der") : "die");
}

// schwache Adjektivendung nach bestimmtem Artikel (Anfänger-freundlich)
function germanAdjEndingAfterDefArticle(c, n, g) {
    if (n === "Pl") return "en";
    if (c === "Nom") return "e";
    if (c === "Akk") return g === "m" ? "en" : "e";
    // Dat/Gen/Abl
    return "en";
}

// Zusatzhinweis für Ablativ
function ablHint(c) {
    return c === "Abl" ? " (mit/bei/von …)" : "";
}

/* =========================
   Deutsch: Nomen beugen (sehr kleine Heuristik + Ausnahmen)
   ========================= */

// Kleine Ausnahmeliste für Pluralformen in unserem Datensatz.
// (Passe an, wenn du weitere deutsche Lemmata hinzufügst.)
const PLURAL_OVERRIDES = {
    "Freund": "Freunde",
    "Bewohner": "Bewohner",
    "Ort": "Orte",
    "Stadt": "Städte",
    "Villa": "Villen",
    // „Wort“ → „Worte“ (hier gewünscht)
    "Wort": "Worte",
};

// sehr einfache Regel für Genitiv Sg. Mask./Neutr.
function addGenitiveSEnding(noun) {
    const lower = noun.toLowerCase();
    const needsEs =
        lower.length <= 2 ||
        /[sßxz]$/.test(lower) ||
        (/[bcdfghjklmnpqrstvwxz]$/.test(lower) && !/[aeiou]$/.test(lower));
    return needsEs ? noun + "es" : noun + "s";
}

function germanNounDisplay(c, n, g, base) {
    if (!base) return "";
    if (n === "Pl") {
        return PLURAL_OVERRIDES[base] || (base + " (Plural)");
    }
    if (c === "Gen" && (g === "m" || g === "n")) {
        return addGenitiveSEnding(base);
    }
    return base;
}


/* =========================
   Latin: simple Anzeigeform
   ========================= */

// sehr einfache a/o-Endungen für Anzeige (reicht, da Bewertung über noun-Merkmale läuft)
function latinAdjFormForNoun(adjectiveStem, noun) {
    const { case: c, number: n, gender: g } = noun;
    const end = {
        m: { Sg: { Nom: "us", Gen: "i", Dat: "o", Akk: "um", Abl: "o" }, Pl: { Nom: "i", Gen: "orum", Dat: "is", Akk: "os", Abl: "is" } },
        f: { Sg: { Nom: "a", Gen: "ae", Dat: "ae", Akk: "am", Abl: "a" }, Pl: { Nom: "ae", Gen: "arum", Dat: "is", Akk: "as", Abl: "is" } },
        n: { Sg: { Nom: "um", Gen: "i", Dat: "o", Akk: "um", Abl: "o" }, Pl: { Nom: "a", Gen: "orum", Dat: "is", Akk: "a", Abl: "is" } },
    };
    const suffix = end[g]?.[n]?.[c] || "";
    return adjectiveStem + suffix;
}

/* =========================
   Paradigma für Hilfetabelle
   (nur das Genus der aktuellen Frage)
   ========================= */

function mapCase(c) { return CASE_DE[c] || c; }
function mapNumber(n) { return NUM_DE[n] || n; }

function buildAdjParadigmForBaseFiltered(base, gender /* 'm'|'f'|'n' */) {
    // Stamm grob aus Lemma ableiten: bonus → bon | pulcher → pulchr | fortis → fort
    const raw = base.lemma || "";
    const stemFromAO = raw.replace(/(us|a|um)$/i, "");      // a/o
    const stemFrom3 = raw.replace(/(is|e)$/i, "");         // 3. Dekl.
    const stem = (base.declension === "a/o" || base.pattern === "regular") ? stemFromAO : stemFrom3;

    // a/o-Deklination
    if (base.declension === "a/o" || base.pattern === "regular") {
        const end = {
            m: { Nom: ["us", "i"], Gen: ["i", "orum"], Dat: ["o", "is"], Akk: ["um", "os"], Abl: ["o", "is"] },
            f: { Nom: ["a", "ae"], Gen: ["ae", "arum"], Dat: ["ae", "is"], Akk: ["am", "as"], Abl: ["a", "is"] },
            n: { Nom: ["um", "a"], Gen: ["i", "orum"], Dat: ["o", "is"], Akk: ["um", "a"], Abl: ["o", "is"] },
        }[gender];

        const row = (c) => ({
            case: mapCase(c),
            singular: `${stem}${end[c][0]}`,
            plural: `${stem}${end[c][1]}`
        });

        return ["Nom", "Gen", "Dat", "Akk", "Abl"].map(row);
    }

    // stark vereinfacht: 3. Deklination
    if (base.declension === "3rd" || base.pattern === "third") {
        const endMF = { Nom: ["is", "es"], Gen: ["is", "ium"], Dat: ["i", "ibus"], Akk: ["em", "es"], Abl: ["i", "ibus"] };
        const endN = { Nom: ["e", "ia"], Gen: ["is", "ium"], Dat: ["i", "ibus"], Akk: ["e", "ia"], Abl: ["i", "ibus"] };
        const end = (gender === "n") ? endN : endMF;

        const lemmaNom = raw; // Lemma als Nom. Sg. Anker

        const row = (c) => ({
            case: mapCase(c),
            singular: c === "Nom" ? lemmaNom : `${stem}${end[c][0]}`,
            plural: `${stem}${end[c][1]}`
        });

        return ["Nom", "Gen", "Dat", "Akk", "Abl"].map(row);
    }

    // Fallback: keine Tabelle
    return [];
}

/* =========================
   Deutsch-Zeile für "Richtige Bestimmung(en)"
   ========================= */

function formatAdjContextDe(c, n, g, adjDe, nounDe) {
    const kase = { Nom: "Nominativ", Gen: "Genitiv", Dat: "Dativ", Akk: "Akkusativ", Abl: "Ablativ" }[c] || c;
    const num = { Sg: "Singular", Pl: "Plural" }[n] || n;
    const gen = { m: "maskulin", f: "feminin", n: "neutrum" }[g] || g;

    const art = germanDefArticle(c, n, g);
    const end = germanAdjEndingAfterDefArticle(c, n, g);
    const adjW = (adjDe || "").trim() + end;

    const nounWord = germanNounDisplay(c, n, g, nounDe);
    const ablTag = ablHint(c);

    // z.B. "Genitiv Plural maskulin – der guten Freunde"
    return `${kase} ${num} ${gen} – ${art} ${adjW} ${nounWord}${ablTag}`.replace(/\s+/g, " ").trim();
}

/* =========================
   Hilfen
   ========================= */
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* =========================
   Generator
   ========================= */

// Haupt-Export: baut eine Runde "Adjektiv im Kontext"
export function generateAdjWithNounRound({ lemmas = [], numQuestions = 5 }) {
    const adjBasesAll = data.filter(isAdjBase);
    const nounFormsAll = data.filter(isNounEntry);

    // Filter auf gewünschte Adjektive (oder alle, wenn nichts gewählt)
    const lemmaSet = new Set(lemmas);
    const adjBases = lemmaSet.size ? adjBasesAll.filter(a => lemmaSet.has(a.lemma)) : adjBasesAll;

    // pro Prompt genau eine Karte, aber mehrere gültige korrekte Optionen (Ambiguitäten)
    const questionsByPrompt = new Map();

    // harte Kappe, damit es nicht explodiert
    const nounPool = shuffle(nounFormsAll).slice(0, 400);

    for (const adj of adjBases) {
        // Stamm für einfache a/o-Anzeige (bonus -> bon | pulcher -> pulchr | fortis -> fort)
        const stemAO = (adj.lemma || "").replace(/(us|a|um)$/i, "");
        const stem3 = (adj.lemma || "").replace(/(is|e)$/i, "");
        const stem = (adj.declension === "a/o" || adj.pattern === "regular") ? stemAO : stem3;

        for (const noun of nounPool) {
            // Alle NOUN-Einträge mit gleicher sichtbarer Form und gleichem Genus liefern die Ambiguitäten
            const ambiguous = nounFormsAll.filter(
                n => n.form === noun.form && n.gender === noun.gender && n.lemmaDe === noun.lemmaDe
            );
            if (!ambiguous.length) continue;

            // Per Konvention bauen wir die Adjektivform nach einer (irgendeiner) der Ambiguitäten – a/o deckt Ambis ab
            const adjForm = latinAdjFormForNoun(stem, noun);
            const prompt = `${adjForm} ${noun.form}`.trim();

            if (!questionsByPrompt.has(prompt)) {
                questionsByPrompt.set(prompt, {
                    id: `adjctx_${adj.lemma}_${noun.form}`,
                    type: "adj_context",
                    prompt,
                    lemma: adj.lemma,
                    lemmaDe: adj.lemmaDe,
                    correctOptions: [],
                    // Hilfetabelle: nur das Genus dieses Substantivs
                    paradigm: buildAdjParadigmForBaseFiltered(adj, noun.gender),
                    paradigmGender: noun.gender
                });
            }

            const card = questionsByPrompt.get(prompt);

            // Für jede gültige Ambiguität eine korrekte Option + natürliche DE-Zeile
            for (const e of ambiguous) {
                const deLine = formatAdjContextDe(e.case, e.number, e.gender, adj.lemmaDe, e.lemmaDe || "");

                const key = `${e.case}_${e.number}_${e.gender}_${deLine}`;

                // Duplikate vermeiden
                if (!card._seen) card._seen = new Set();
                if (card._seen.has(key)) continue;

                card._seen.add(key);
                card.correctOptions.push({
                    case: e.case,
                    number: e.number,
                    gender: e.gender,
                    de: deLine
                });
            }
        }
    }

    const all = Array.from(questionsByPrompt.values()).map(q => {
        delete q._seen;
        return q;
    });

    return shuffle(all).slice(0, numQuestions);
}
