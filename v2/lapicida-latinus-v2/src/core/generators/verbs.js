// src/core/generators/verbs.js
import PRAES from "../../data/verbs_praesens.json";
import PERF from "../../data/verbs_perfekt.json";
import VERB_META_WRAPPER from "../../data/verbs_meta.json";

// -----------------------------
// Konstanten & Hilfen
// -----------------------------

// ===== helpers & constants (robust) =====
const TENSES = ["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt", "Futur I", "Futur II"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];

// Akzeptiert Einzelwert, Array oder null → immer Array
function asList(x) {
    if (x == null) return [];
    return Array.isArray(x) ? x : [x];
}

// Normalisierer für Keys
function capFirst(s) {
    if (!s) return "";
    const t = String(s).trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}
function normTense(t) {
    if (!t) return "";
    const s = String(t).toLowerCase().replace(/\s+/g, " ").trim();
    if (s === "futur 1" || s === "futur i" || s === "futur1") return "Futur I";
    if (s === "futur 2" || s === "futur ii" || s === "futur2") return "Futur II";
    if (s === "plusquamperf" || s.startsWith("plusquamperf")) return "Plusquamperfekt";
    if (s === "praesens" || s === "präsens" || s === "prasens") return "Praesens";
    if (s === "imperfekt") return "Imperfekt";
    if (s === "perfekt") return "Perfekt";
    // Fallback: Titel-Case
    return capFirst(s);
}
function normMood(m) {
    const s = capFirst(m || "");
    if (s === "Konjunktiv" || s === "Indikativ" || s === "Imperativ") return s;
    // Fallback, häufige Varianten
    if (/konj/.test(s.toLowerCase())) return "Konjunktiv";
    if (/ind/.test(s.toLowerCase())) return "Indikativ";
    if (/imp/.test(s.toLowerCase())) return "Imperativ";
    return s || "Indikativ";
}
function normVoice(v) {
    const s = capFirst(v || "");
    if (s === "Aktiv" || s === "Passiv") return s;
    if (/act/.test(s.toLowerCase())) return "Aktiv";
    if (/pass/.test(s.toLowerCase())) return "Passiv";
    return s || "Aktiv";
}

// Lemma normalisieren für Meta-Lookups
function normalizeLemma(s) {
    return (s || "").toLowerCase().trim();
}

// Kleine Anzeige-Helfer für Quiz/Summary (exportiert!)
export function formatVerbSpec({ person, number, tense, mood, voice }) {
    const PERSON_LABEL = { "1": "1. Person", "2": "2. Person", "3": "3. Person" };
    const NUMBER_LABEL = { "Sg": "Singular", "Pl": "Plural" };
    return [
        PERSON_LABEL[person] || person,
        NUMBER_LABEL[number] || number,
        tense,
        mood,
        voice
    ].join(" ");
}

const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const DEFAULT_TENSES = ["Praesens"];
const DEFAULT_MOODS = ["Indikativ"];
const DEFAULT_VOICES = ["Aktiv"];


const BANK = {
    Praesens: PRAES,
    Perfekt: PERF,
};

// ===== Label-Maps (Deutsch) =====
const PERSON_LABELS = { "1": "1. Person", "2": "2. Person", "3": "3. Person" };
const NUMBER_LABELS = { "Sg": "Singular", "Pl": "Plural" };

// Akzeptiere verschiedene Schreibweisen -> normiere auf die schöne Ausgabe
const TENSE_LABELS = {
    "Praesens": "Präsens", "Präsens": "Präsens", "PRS": "Präsens",
    "Imperfekt": "Imperfekt", "IMPF": "Imperfekt",
    "Perfekt": "Perfekt", "PERF": "Perfekt",
    "Plusquamperfekt": "Plusquamperfekt", "PQP": "Plusquamperfekt",
    "Futur I": "Futur I", "FUT1": "Futur I",
    "Futur II": "Futur II", "FUT2": "Futur II"
};

const MOOD_LABELS = {
    "Indikativ": "Indikativ", "Konjunktiv": "Konjunktiv", "Imperativ": "Imperativ"
};

const VOICE_LABELS = {
    "Aktiv": "Aktiv", "Passiv": "Passiv"
};

// robust: akzeptiere Array ODER Objekt (Map)
function rowsForTense(tense) {
    const t = Array.isArray(BANK?.[tense]) ? BANK[tense] : [];
    //const t = BANK[tense] ?? BANK[normalizePraesens(tense)];
    if (!t) return [];
    if (Array.isArray(t)) return t;
    // Falls das JSON als Objekt kommt (z.B. { "rows": [...] }):
    if (Array.isArray(t.rows)) return t.rows;
    // Als letzte Rettung: Object.values
    return Object.values(t);
}

function normalizePraesens(s) {
    // fange "Präsens" und "praesens" ab
    if (!s) return "Praesens";
    const low = String(s).toLowerCase();
    if (low.includes("präs") || low.includes("praes")) return "Praesens";
    return s;
}

function toPNKey(person, number) {
    return `${person}${number}`; // "1Sg", "3Pl"
}

// -----------------------------
// VERB_META Index aufbauen
// verbs_meta.json Format: { "verbsMeta": [ {...}, ... ] }
// Wir indexieren: lemma -> tense -> mood -> voice -> PNKey -> {latin,german,hints,gloss}
// -----------------------------
const VERB_META_ARRAY = Array.isArray(VERB_META_WRAPPER?.verbsMeta)
    ? VERB_META_WRAPPER.verbsMeta
    : [];

const META_INDEX = buildMetaIndex(VERB_META_ARRAY);

function buildMetaIndex(list) {
    const idx = new Map();
    for (const entry of list) {
        const lemma = entry.lemma;
        const tense = entry.tense;        // z.B. "Praesens"
        const moods = entry.moods || {};
        if (!lemma || !tense) continue;

        if (!idx.has(lemma)) idx.set(lemma, new Map());
        const byTense = idx.get(lemma);
        if (!byTense.has(tense)) byTense.set(tense, new Map());

        for (const [mood, voicesObj] of Object.entries(moods)) {
            if (!byTense.get(tense).has(mood)) byTense.get(tense).set(mood, new Map());

            for (const [voice, pack] of Object.entries(voicesObj || {})) {
                const ex = pack.examples || {};
                const gl = pack.gloss || {};
                const node = new Map();
                // examples & gloss beide per PNKey ablegen
                for (const [pn, obj] of Object.entries(ex)) {
                    node.set(pn, { example: obj, gloss: gl[pn] || null });
                }
                byTense.get(tense).get(mood).set(voice, node);
            }
        }
    }
    return idx;
}

function pickFromMeta(lemma, tense, mood, voice, person, number) {
    const byLemma = META_INDEX.get(lemma);
    if (!byLemma) return { example: null, gloss: null };
    const byTense = byLemma.get(tense);
    if (!byTense) return { example: null, gloss: null };
    const byMood = byTense.get(mood);
    if (!byMood) return { example: null, gloss: null };
    const byVoice = byMood.get(voice);
    if (!byVoice) return { example: null, gloss: null };
    const pnKey = toPNKey(person, number);
    const leaf = byVoice.get(pnKey);
    if (!leaf) return { example: null, gloss: null };
    return { example: leaf.example || null, gloss: leaf.gloss || null };
}




// -----------------------------
// Export: buildVerbQuestions
// -----------------------------
export function buildVerbQuestions({
    lemmas = [],
    numQuestions = 5,
    filters = {}
}) {
    const wantedAll = !lemmas || lemmas.length === 0;
    const lemmaSet = new Set(lemmas);

    const fT = asList(filters?.tenses).map(normTense);
    const fM = asList(filters?.moods).map(normMood);
    const fV = asList(filters?.voices).map(normVoice);

    const allowTenses = (fT.length ? fT : TENSES);
    const allowMoods = (fM.length ? fM : MOODS);
    const allowVoices = (fV.length ? fV : VOICES);

    const candidates = [];

    for (const tense of allowTenses) {
        const rows = rowsForTense(tense); // <= robust!
        for (const row of rows) {
            // row: { lemma, lemmaDe, mood, voice, compound?, forms: { "1Sg": "...", ... } }
            if (!wantedAll && !lemmaSet.has(row.lemma)) continue;
            if (!allowMoods.includes(row.mood)) continue;
            if (!allowVoices.includes(row.voice)) continue;

            for (const person of PERSONS) {
                for (const number of NUMBERS) {
                    const pn = toPNKey(person, number);
                    const form = row.forms?.[pn];
                    if (!form) continue;

                    // Meta (Beispiel + Gloss/Übersetzung)
                    const { example, gloss } = pickFromMeta(
                        row.lemma, normalizePraesens(tense), row.mood, row.voice, person, number
                    );

                    candidates.push({
                        id: `verb_${row.lemma}_${normalizePraesens(tense)}_${row.mood}_${row.voice}_${pn}`,
                        type: "verb",
                        prompt: form,
                        lemma: row.lemma,
                        lemmaDe: row.lemmaDe,
                        correctOptions: [{ person, number, tense: normalizePraesens(tense), mood: row.mood, voice: row.voice }],

                        // Hilfe-Paradigma 1.–3. Person / Sg/Pl
                        helpParadigm: [
                            { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
                            { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
                            { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" }
                        ],
                        helpTitle: `${row.lemma} – ${row.lemmaDe} (${normalizePraesens(tense)}, ${row.mood}, ${row.voice})`,

                        // Beispiel + echte Kurzübersetzung aus Meta (falls vorhanden)
                        helpExample: example ? {
                            latin: example.latin || "",
                            german: example.german || "",
                            hints: Array.isArray(example.hints) ? example.hints : []
                        } : null,
                        helpGloss: gloss || null,

                        topics: ["verb"]
                    });
                }
            }
        }
    }

    // fair unter den gewählten Lemmata verteilen (falls mehrere ausgewählt)
    let out = candidates;
    if (lemmas && lemmas.length > 1) {
        out = roundRobinPerLemma(candidates, lemmas, numQuestions);
    } else {
        out = candidates.slice(0, numQuestions);
    }

    return out;
}

// Gleichverteilung: pro Lemma reihum ziehen, bis numQuestions
function roundRobinPerLemma(cands, lemmas, limit) {
    const byLemma = new Map();
    for (const l of lemmas) byLemma.set(l, []);
    for (const c of cands) {
        if (!byLemma.has(c.lemma)) byLemma.set(c.lemma, []);
        byLemma.get(c.lemma).push(c);
    }
    // mischen pro Lemma
    for (const list of byLemma.values()) shuffle(list);
    const result = [];
    let i = 0;
    while (result.length < limit) {
        let added = false;
        for (const l of lemmas) {
            const list = byLemma.get(l) || [];
            if (i < list.length) {
                result.push(list[i]);
                added = true;
                if (result.length >= limit) break;
            }
        }
        if (!added) break;
        i++;
    }
    return result;
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
} export {
    asList, normTense, normMood, normVoice, normalizeLemma
    // plus alles, was du sonst schon exportierst (buildVerbQuestions etc.)
};

