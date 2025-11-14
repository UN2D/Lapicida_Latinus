// src/core/generators/verbs.js
// Verb-Runden-Generator (mit Paradigma + Beispiel/Hinweisen)
// Nutzt deine JSON-Datenbänke (Praesens/Perfekt) und erzeugt Frageobjekte,
// die das Quiz direkt verwenden kann.

import PRAES from "../../data/verbs_praesens.json";
import PERF from "../../data/verbs_perfekt.json";
import VERB_META from "../../data/verbs_meta.json";

// Optional: Wenn du Zusatz-Metadaten nutzen willst,
// lege eine leere Datei src/data/verbs_meta.json an und importiere sie hier statisch.
// Beispiel (auskommentiert, damit es ohne Datei läuft):
// import VERB_META from "../../data/verbs_meta.json";
//const VERB_META = {}; // Fallback: ohne Metadaten weiterarbeiten

// ---- Konstanten (einheitlich mit Rest der App) --------------------------------
const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];

const TENSETAB = {
    "praesens": "PRS", "präsens": "PRS", "praesent": "PRS",
    "imperfekt": "IMPF",
    "perfekt": "PERF",
    "plusquamperfekt": "PQP", "plusquamp.": "PQP", "plusquamperf.": "PQP", "plusquamperf": "PQP",
    "futur i": "FUT1", "futur1": "FUT1",
    "futur ii": "FUT2", "futur2": "FUT2"
};
const MOODTAB = { "indikativ": "IND", "konjunktiv": "KONJ", "imperativ": "IMP" };
const VOICETAB = { "aktiv": "ACT", "passiv": "PASS" };
const NUMTAB = { "sg": "SG", "singular": "SG", "pl": "PL", "plural": "PL" };

const DE_FINITE_FALLBACK = {
    // für regelmäßige Verben wie "loben" – reicht als Notnagel
    "1Sg": (inf) => `ich ${inf}e`,
    "2Sg": (inf) => `du ${inf}st`,
    "3Sg": (inf) => `er/sie/es ${inf}t`,
    "1Pl": (inf) => `wir ${inf}en`,
    "2Pl": (inf) => `ihr ${inf}t`,
    "3Pl": (inf) => `sie ${inf}en`,
};

const DE_PRONOUN = {
    "1Sg": "ich",
    "2Sg": "du",
    "3Sg": "er/sie/es",
    "1Pl": "wir",
    "2Pl": "ihr",
    "3Pl": "sie"
};

// Hinweis: BANK kann später leicht um Imperfekt, Plusquamperfekt, Futur etc. erweitert werden.
const BANK = {
    "Praesens": PRAES,
    "Perfekt": PERF
};
const TENSES = Object.keys(BANK);

// Utilities
const asList = (v) => Array.isArray(v) ? v : (v ? [v] : []);
const shuffle = (a) => {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const PN = (person, number) => `${person}${number}`; // 1 + Sg => "1Sg"

function stripPunct(s) {
    return (s || "").replace(/[.?!]\s*$/u, "");
}

function pickVerbExample(lemma, { mood, tense, voice, person, number }) {
    const L = VERB_META?.[lemma];
    if (!L) return null;

    const tryGet = (m, t, v, pn) =>
        L?.[m]?.[t]?.[v]?.[pn] ||
        L?.[m]?.[t]?.[v] && Object.values(L[m][t][v])[0] ||
        L?.[m]?.[t] && Object.values(L[m][t]).flatMap(x => Object.values(x))[0] ||
        Object.values(L).flatMap(x => Object.values(x))
            .flatMap(x => Object.values(x))
            .flatMap(x => Object.values(x))[0];

    const pnKey = PN(person, number);
    const ex = tryGet(mood, tense, voice, pnKey);
    if (!ex) return null;

    return {
        latin: stripPunct(ex.la),
        german: stripPunct(ex.de),
        hints: ex.hints || []
    };
}

// ==== EXPORT: volle deutsche Spezifikation =====================================
export function formatVerbSpec(opt) {
    const numFull = opt.number === "Sg" ? "Singular" : "Plural";
    // Reihenfolge: Person, Numerus, Zeitform, Modus, Genus
    // (z. B. "1. Person Plural Indikativ Aktiv Präsens")
    return `${opt.person}. Person ${numFull} ${opt.mood} ${opt.voice} ${opt.tense}`;
}

// Kleine Tabelle für die Hilfe (Personen x Sg/Pl)
function buildHelpParadigm(row /* aus BANK[tense] */) {
    // row.forms enthält i.d.R. Keys "1Sg","2Sg","3Sg","1Pl","2Pl","3Pl"
    return [
        { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
        { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
        { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" }
    ];
}

// Beispiel-/Hinweiserzeugung (greift auf VERB_META zurück, sonst robuste Defaults)
function buildHelpExample(lemmaKey, row, spec) {
    const meta = VERB_META[lemmaKey] || {};
    const pnKey = `${spec.person}${spec.number}`;

    // 1) Kurzbedeutung (deutsche Finitform, z.B. "du lobst")
    let deFinite = "";
    if (meta.deFinite?.[spec.tense]?.[spec.mood]?.[spec.voice]?.[pnKey]) {
        deFinite = meta.deFinite[spec.tense][spec.mood][spec.voice][pnKey];
    } else if (meta.deFinite?.[spec.tense]?.[spec.mood]?.[pnKey]) {
        deFinite = meta.deFinite[spec.tense][spec.mood][pnKey];
    } else if (meta.deFinite?.[spec.tense]?.[pnKey]) {
        deFinite = meta.deFinite[spec.tense][pnKey];
    } else if (meta.deFinite?.[pnKey]) {
        deFinite = meta.deFinite[pnKey];
    } else {
        // sehr grober Fallback (nur Präsens, Aktiv, Indikativ klingt gut)
        const base = (row.lemmaDe || "").trim();             // z.B. "loben"
        const infinit = base.replace(/\s*\(.*?\)\s*/g, "");   // Klammern weg
        if (infinit) deFinite = DE_FINITE_FALLBACK[pnKey]?.(infinit) || base;
    }

    // 2) Beispielsatz
    let latin = "";
    let german = "";
    const ex =
        meta.examples?.[spec.tense]?.[spec.mood]?.[spec.voice]?.[pnKey] ||
        meta.examples?.[spec.tense]?.[spec.mood]?.[pnKey] ||
        meta.examples?.[spec.tense]?.[pnKey] ||
        meta.examples?.[pnKey];

    if (ex && ex.lat && ex.de) {
        const f = spec.form || row.forms?.[pnKey] || "";
        latin = ex.lat.replace("{form}", f);
        german = ex.de.replace("{form}", deFinite || f);
    } else {
        // Fallback – neutral
        const f = spec.form || row.forms?.[pnKey] || "";
        latin = `${f} amīcōs.`;                // „… die Freunde“
        german = deFinite ? `${deFinite} die Freunde.` : "";
    }

    // 3) Hinweise
    const hints = Array.isArray(meta.hints) ? meta.hints.slice() : [];

    // 4) Titel
    const helpTitle =
        `${row.lemma} – ${row.lemmaDe} (${spec.tense}, ${spec.mood}${spec.voice ? `, ${spec.voice}` : ""})`;

    return { title: helpTitle, latin, german, hints, deFinite };
}

function pickExample(meta, tenseCode, compoundName) {
    const node = compoundName ? meta?.compounds?.[compoundName] : meta;
    if (!node) return null;

    const pool = (node.examples && (node.examples[tenseCode] || node.examples.default)) || [];
    return pool.length ? pool[0] : null;
}

function pickGloss(meta, tenseCode, personKey, compoundName) {
    const node = compoundName ? meta?.compounds?.[compoundName] : meta;
    if (!node) return null;

    const glossNode = node.gloss && (node.gloss[tenseCode] || node.gloss.default);
    return glossNode ? glossNode[personKey] || null : null;
}

// ==== EXPORT: Haupterzeuger ====================================================
export function buildVerbQuestions({ lemmas, numQuestions, filters }) {
    // Filter auflösen (wenn leer → alle)
    const allowTenses = asList(filters?.tenses).length ? filters.tenses : TENSES;
    const allowMoods = asList(filters?.moods).length ? filters.moods : MOODS;
    const allowVoices = asList(filters?.voices).length ? filters.voices : VOICES;

    // Lemmata bestimmen
    const wanted = new Set(asList(lemmas).map((s) => (s || "").toLowerCase()));
    const wantAll = wanted.size === 0;

    // Alle Kandidaten sammeln
    const candidates = [];

    for (const tense of allowTenses) {
        const rows = BANK[tense] || [];
        for (const row of rows) {
            const lemmaKey = (row.lemma || "").toLowerCase();
            if (!wantAll && !wanted.has(lemmaKey)) continue;
            if (!allowMoods.includes(row.mood)) continue;
            if (!allowVoices.includes(row.voice)) continue;

            for (const person of PERSONS) {
                for (const number of NUMBERS) {
                    const key = `${person}${number}`;
                    const form = row.forms?.[key];
                    if (!form) continue;

                    const spec = { person, number, tense, mood: row.mood, voice: row.voice, form };

                    // Hilfe: Personen-Tabelle & Beispiel/Hinweise
                    const helpParadigm = buildHelpParadigm(row);
                    const { title: helpTitle, latin, german, hints } = buildHelpExample(lemmaKey, row, spec);


                    const tenseCode = TENSETAB[tense] || tense;     // "Praesens" -> "PRS" usw.
                    const personKey = `${person}${number}`;         // "1Sg", "3Pl", ...

                    const meta = VERB_META[row.lemma];
                    const translation = pickGloss(meta, tenseCode, personKey, row.compound || null);
                    //const example = pickExample(meta, tenseCode, row.compound || null);

                    const example = pickVerbExample(row.lemma, {
                        mood: row.mood,
                        tense,
                        voice: row.voice,
                        person,
                        number
                    });

                    candidates.push({
                        id: `verb_${row.lemma}_${tense}_${row.mood}_${row.voice}_${key}`,
                        type: "verb",
                        prompt: form,
                        lemma: row.lemma,
                        lemmaDe: row.lemmaDe,
                        correctOptions: [{ person, number, tense, mood: row.mood, voice: row.voice }],

                        // Hilfetabelle (hast du schon)
                        helpParadigm: [
                            { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
                            { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
                            { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" }
                        ],
                        helpTitle: `${row.lemma} – ${row.lemmaDe} (${tense}, ${row.mood}, ${row.voice})`,

                        // NEU:
                        helpExample: example,

                        topics: ["verb"]
                    });

                }
            }
        }
    }

    if (!candidates.length) return [];

    // Gleichmäßig über gewählte Lemmata verteilen (Round-Robin)
    const byLemma = new Map();
    for (const c of candidates) {
        const key = c.lemma.toLowerCase();
        if (!byLemma.has(key)) byLemma.set(key, []);
        byLemma.get(key).push(c);
    }
    for (const arr of byLemma.values()) arr.sort(() => Math.random() - 0.5);

    const buckets = Array.from(byLemma.values());
    const out = [];
    let i = 0;
    while (out.length < numQuestions && buckets.some(b => b.length)) {
        const b = buckets[i % buckets.length];
        if (b.length) out.push(b.shift());
        i++;
    }

    return out;
}
