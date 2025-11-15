// src/core/generators/verbs.js
//
// Robuste Generator-Logik für Verbfragen.
// - Unterstützt Filters: { tenses?, moods?, voices? }
// - Lemmas: [] => alle; andernfalls nur die ausgewählten
// - Exportiert buildVerbQuestions + formatVerbSpec
// - Nutzt Tabellen-Schlüssel "1Sg", "2Sg", "3Sg", "1Pl", "2Pl", "3Pl"
//
// Datenform (z.B. verbs_praesens.json):
// [
//   {
//     "lemma": "laudare",
//     "lemmaDe": "loben",
//     "tense": "Praesens",
//     "mood": "Indikativ",
//     "voice": "Aktiv",
//     "forms": { "1Sg":"laudo", "2Sg":"laudas", ..., "3Pl":"laudant" }
//   },
//   ...
// ]

import PRS from "../../data/verbs_praesens.json";
// Falls weitere Zeiten später dazukommen, einfach entkommentieren + ergänzen:
// import IMPF from "../../data/verbs_imperfekt.json";
// import PERF from "../../data/verbs_perfekt.json";
// import PQP  from "../../data/verbs_plusquamperfekt.json";
// import FUT1 from "../../data/verbs_futur1.json";
// import FUT2 from "../../data/verbs_futur2.json";


const DEBUG = true;
const BANK = Object.create(null);
// -------------------- Helfer --------------------

const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];

const ALL_TENSES = ["Praesens"/*, "Imperfekt", "Perfekt", "Plusquamperfekt", "Futur I", "Futur II"*/];
const ALL_MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const ALL_VOICES = ["Aktiv", "Passiv"];

// Sicheres Array
function asList(x) {
    console.log("asList ", x);
    if (!x) return [];
    return Array.isArray(x) ? x : [x];
}

// Trim/Normalisierung humaner Filter-Einträge -> exakt wie in Daten
function normTense(t) {
    if (!t) return null;
    const s = ("" + t).toLowerCase().trim();
    if (s.startsWith("pr")) return "Praesens";
    if (s.startsWith("impe")) return "Imperfekt";
    if (s.startsWith("per")) return "Perfekt";
    if (s.startsWith("plus")) return "Plusquamperfekt";
    if (s.replace(/\s+/g, "") === "futuri") return "Futur I";
    if (s.replace(/\s+/g, "") === "futurii") return "Futur II";
    return t; // Fallback unverändert
}

function normMood(m) {
    if (!m) return null;
    const s = ("" + m).toLowerCase().trim();
    if (s.startsWith("in")) return "Indikativ";
    if (s.startsWith("ko") || s.startsWith("con")) return "Konjunktiv";
    if (s.startsWith("im")) return "Imperativ";
    return m;
}

function normVoice(v) {
    if (!v) return null;
    const s = ("" + v).toLowerCase().trim();
    if (s.startsWith("ak")) return "Aktiv";
    if (s.startsWith("pa")) return "Passiv";
    return v;
}

// Unit-Label für Ausgabe (wie bei Nomen/Adjektiven: ausgeschrieben)
function labelPerson(p) {
    return p === "1" ? "1. Person" : p === "2" ? "2. Person" : "3. Person";
}
function labelNumber(n) {
    return n === "Sg" ? "Singular" : "Plural";
}

// -------------------- Datenbank zusammenführen --------------------

// BANK: { [tense: string]: Array<Row> }
// Row: { lemma, lemmaDe, tense, mood, voice, forms, (optional: compound) }


addRows(PRS);
if (DEBUG) console.log("[verbs] BANK ", BANK);
// addRows(IMPF);
// addRows(PERF);
// addRows(PQP);
// addRows(FUT1);
// addRows(FUT2);


function addRows(input) {
    if (!input) return;
    console.log("addRows ", input);
    if (Array.isArray(input)) {
        for (const r of input) {
            const t = normTense(r?.tense) || "Praesens";
            if (!BANK[t]) BANK[t] = [];
            BANK[t].push({ ...r, tense: t });
        }
        return;
    }

    if (typeof input === "object") {
        for (const [tenseKey, arr] of Object.entries(input)) {
            if (!Array.isArray(arr)) continue;
            const tKey = normTense(tenseKey) || "Praesens";
            if (!BANK[tKey]) BANK[tKey] = [];
            for (const r of arr) {
                const t = normTense(r?.tense) || tKey;
                if (!BANK[t]) BANK[t] = [];
                BANK[t].push({ ...r, tense: t });
            }
        }
    }
}

// Aktuell nur Präsens sicher eingebunden.
// Weitere Zeiten später einfach addRows(…)


// -------------------- Export: Anzeigeformat für Zusammenfassung --------------------

export function formatVerbSpec(opt = {}) {
    // "1. Person Plural, Praesens, Indikativ, Aktiv"
    const P = opt.person ? labelPerson(opt.person) : "";
    const N = opt.number ? labelNumber(opt.number) : "";
    const T = opt.tense || "";
    const M = opt.mood || "";
    const V = opt.voice || "";
    return [P, N, T, M, V].filter(Boolean).join(", ");
}

// -------------------- Kern: Fragen bauen --------------------

/**
 * buildVerbQuestions
 * @param {Object} params
 * @param {string[]} params.lemmas      - leere Liste => alle Lemmas, sonst die ausgewählten
 * @param {number}   params.numQuestions
 * @param {Object}   params.filters     - { tenses?:[], moods?:[], voices?:[] }
 * @returns {Array<Question>}
 */
export function buildVerbQuestions({ lemmas = [], numQuestions = 5, filters = {} }) {
    if (DEBUG) console.log("[verbs] build IN", { lemmas, numQuestions, filters });
    if (DEBUG) console.log("[verbs] BANK ", BANK);
    // 1) Erlaubte Filtermengen robust ableiten
    console.log("filters.tenses ", filters.tenses);
    const allowTenses = (asList(filters.tenses).length ? asList(filters.tenses) : ALL_TENSES)
        .map(normTense)
        .filter(Boolean)
        .filter((t) => BANK[t]); // nur Zeiten, die es in den Daten auch gibt
    console.log("normTense ", normTense);
    if (DEBUG) console.log("allowTenses ", allowTenses);

    const allowMoods = (asList(filters.moods).length ? asList(filters.moods) : ALL_MOODS)
        .map(normMood)
        .filter(Boolean);

    const allowVoices = (asList(filters.voices).length ? asList(filters.voices) : ALL_VOICES)
        .map(normVoice)
        .filter(Boolean);



    if (DEBUG) console.log("[verbs] allow", { allowTenses, allowMoods, allowVoices });
    // 2) Lemma-Filter
    const lemmaSet = new Set(asList(lemmas));
    const wantedAll = lemmaSet.size === 0;

    if (DEBUG) console.log("[verbs] wantAll", wantedAll, lemmaSet);

    // 3) Kandidaten sammeln
    const candidates = [];




    for (const tense of allowTenses) {
        //if (DEBUG) console.log(`[verbs] tense=${tense} rows=${rows.length}`);

        const rows = BANK[tense] || [];
        for (const row of rows) {
            // Lemma einschränken?
            if (!wantedAll && !lemmaSet.has(row.lemma)) continue;

            // Mood/Voice einschränken?
            if (!allowMoods.includes(row.mood)) continue;
            if (!allowVoices.includes(row.voice)) continue;

            // Erwartete Tabellen-Schlüssel
            for (const p of PERSONS) {
                for (const n of NUMBERS) {
                    const key = `${p}${n}`; // "1Sg", "3Pl", ...
                    const form = row?.forms?.[key];
                    if (!form) continue;

                    candidates.push({
                        id: `verb_${row.lemma}_${tense}_${row.mood}_${row.voice}_${key}`,
                        type: "verb",
                        prompt: form,
                        lemma: row.lemma,
                        lemmaDe: row.lemmaDe,
                        correctOptions: [
                            { person: p, number: n, tense, mood: row.mood, voice: row.voice }
                        ],
                        // Basis-Hilfe (Paradigma über Personen – passt in deine bestehende Tabelle)
                        helpParadigm: [
                            { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
                            { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
                            { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" }
                        ],
                        helpTitle: `${row.lemma} – ${row.lemmaDe} (${tense}, ${row.mood}, ${row.voice})`,
                        topics: ["verb"]
                    });
                }
            }
        }
    }

    // 4) Keine Daten? -> leere Liste, aber kein Crash
    if (!candidates.length) return [];

    // 5) Mischen & begrenzen
    const shuffled = shuffle(candidates);
    const take = Math.min(numQuestions, shuffled.length);
    return shuffled.slice(0, take);
}

// -------------------- Utils --------------------

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
