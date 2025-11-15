// src/core/generators/verbs.js
import PRAES from "../../data/verbs_praesens.json";
import PERF from "../../data/verbs_perfekt.json";
import VERB_META_WRAPPER from "../../data/verbs_meta.json";

// -----------------------------
// Konstanten & Hilfen
// -----------------------------
const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const DEFAULT_TENSES = ["Praesens"];
const DEFAULT_MOODS = ["Indikativ"];
const DEFAULT_VOICES = ["Aktiv"];

const TENSETAB = {
    "praesens": "PRS", "Präsens": "PRS", "Praesens": "PRS",
    "imperfekt": "IMPF", "Imperfekt": "IMPF",
    "perfekt": "PERF", "Perfekt": "PERF",
    "plusquamperfekt": "PQP", "Plusquamperfekt": "PQP",
    "futur i": "FUT1", "Futur I": "FUT1", "futur1": "FUT1",
    "futur ii": "FUT2", "Futur II": "FUT2", "futur2": "FUT2"
};

const BANK = {
    Praesens: PRAES,
    Perfekt: PERF,
};

// robust: akzeptiere Array ODER Objekt (Map)
function rowsForTense(tense) {
    const t = BANK[tense] ?? BANK[normalizePraesens(tense)];
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

    const allowTenses = filters.tenses?.length ? filters.tenses : DEFAULT_TENSES;
    const allowMoods = filters.moods?.length ? filters.moods : DEFAULT_MOODS;
    const allowVoices = filters.voices?.length ? filters.voices : DEFAULT_VOICES;

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
}
