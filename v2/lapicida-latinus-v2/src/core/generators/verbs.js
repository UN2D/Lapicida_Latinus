// src/core/generators/verbs.js
// -------------------------------------------------------------
// Verb-Runden-Generator mit:
//  - Gleichmäßiger Verteilung über gewählte Lemmata
//  - Hilfetabelle (1./2./3. Person × Sg/Pl)
//  - Beispiel + deutsche Kurzbedeutung + Hinweise aus verbs_meta.json
// -------------------------------------------------------------

import PRAES from "../../data/verbs_praesens.json";
import PERF from "../../data/verbs_perfekt.json";
import VERB_META_RAW from "../../data/verbs_meta.json";

// Einheitliche Konstanten wie im Rest der App
const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];

const LEMMA_ALIAS = {
    sum: "esse",
    possum: "posse",
    eo: "ire",
    fero: "ferre",
    volo: "velle",
    nolo: "nolle",
    malo: "malle",
    fio: "fieri",
};


const TENSETAB = {
    "praesens": "PRS", "präsens": "PRS", "praesent": "PRS",
    "imperfekt": "IMPF",
    "perfekt": "PERF",
    "plusquamperfekt": "PQP", "plusquamp.": "PQP", "plusquamperf.": "PQP", "plusquamperf": "PQP",
    "futur i": "FUT1", "futur1": "FUT1",
    "futur ii": "FUT2", "futur2": "FUT2"
};

const BANK = {
    Praesens: PRAES,
    Perfekt: PERF,
};
const TENSES = Object.keys(BANK);

// -------- kleine Utils ---------------------------------------------------------
const asList = (v) => Array.isArray(v) ? v : (v ? [v] : []);
const PN = (person, number) => `${person}${number}`; // z.B. "1Sg"
const stripPunct = (s) => (s || "").replace(/[.?!]\s*$/u, "");

// Fallbacks für deutsche Kurzbedeutung („ich lobe“, „du lobst“ …)
const DE_FINITE_FALLBACK = {
    "1Sg": (inf) => `ich ${inf}e`,
    "2Sg": (inf) => `du ${inf}st`,
    "3Sg": (inf) => `er/sie/es ${inf}t`,
    "1Pl": (inf) => `wir ${inf}en`,
    "2Pl": (inf) => `ihr ${inf}t`,
    "3Pl": (inf) => `sie ${inf}en`,
};

// Meta-Index (nach Lemma + Tense + Mood + Voice)
const VERB_META = (() => {
    const out = {};
    const list = VERB_META_RAW?.verbsMeta ?? [];
    for (const m of list) {
        const key = normalizeLemma(m.lemma);
        out[key] = out[key] || {};
        const t = m.tense;
        out[key][t] = m.moods || {};
    }
    return out;
})();

function normalizeLemma(lemma) {
    if (!lemma) return "";
    return LEMMA_ALIAS[lemma] || lemma;
}

function indexVerbMeta(raw) {
    const list = Array.isArray(raw?.verbsMeta) ? raw.verbsMeta : Array.isArray(raw) ? raw : [];
    const idx = {};
    for (const entry of list) {
        const { lemma, tense, moods } = entry || {};
        if (!lemma || !tense || !moods) continue;
        idx[lemma] ??= {};
        idx[lemma][tense] ??= {};
        for (const mood of Object.keys(moods)) {
            idx[lemma][tense][mood] ??= {};
            for (const voice of Object.keys(moods[mood] || {})) {
                // Speichere den ganzen Block (examples, glosses, notes)
                idx[lemma][tense][mood][voice] = moods[mood][voice];
            }
        }
    }
    return idx;
}

/** Hole Beispiel (latin/german/hints) aus der Meta, mit sanften Fallbacks */
function pickVerbExample(lemma, { tense, mood, voice, person, number }) {
    const block = VERB_META?.[lemma]?.[tense]?.[mood]?.[voice];
    if (!block) return null;
    const ex = block.examples?.[PN(person, number)]
        || block.examples?.["3Sg"]
        || block.examples?.["1Sg"]
        || null;
    return ex ? { latin: ex.latin || "", german: ex.german || "", hints: ex.hints || [] } : null;
}

/** Hole kurze Personen-Übersetzung („ich lobe“, „wir gehen“ …) aus der Meta */
function pickVerbGloss(lemma, { tense, mood, voice, person, number }) {
    const block = VERB_META?.[lemma]?.[tense]?.[mood]?.[voice];
    if (!block) return null;
    const gl = block.glosses?.[PN(person, number)];
    return gl || null;
}

// Hilfetabelle (Personen × Sg/Pl)
function buildHelpParadigm(row) {
    return [
        { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
        { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
        { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" },
    ];
}

// Beispiel + Hinweise aus verbs_meta.json holen (robust mit Fallback)
function buildHelpExample(lemmaKey, row, spec) {
    const meta = VERB_META[lemmaKey] || {};
    const pnKey = PN(spec.person, spec.number);


    // 1) Kurzdeutsch (z.B. „du lobst“). Reihenfolge: sehr spezifisch → allgemein → Fallback
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
        // letzter Notnagel: aus lemmaDe einen einfachen Präsens bauen
        const infinit = (row.lemmaDe || "").replace(/\s*\(.*?\)\s*/g, "").trim(); // Klammern raus
        if (infinit) deFinite = DE_FINITE_FALLBACK[pnKey]?.(infinit) || infinit;
    }

    // 2) Beispiel (mit {form} ersetzbar). Reihenfolge: spezifisch → allgemein
    let ex = meta.examples?.[spec.tense]?.[spec.mood]?.[spec.voice]?.[pnKey]
        || meta.examples?.[spec.tense]?.[spec.mood]?.[pnKey]
        || meta.examples?.[spec.tense]?.[pnKey]
        || meta.examples?.[pnKey]
        || null;

    const latinForm = spec.form || row.forms?.[pnKey] || "";

    const example = ex
        ? {
            latin: stripPunct((ex.lat || "").replace("{form}", latinForm)),
            german: stripPunct((ex.de || "").replace("{form}", deFinite || latinForm)),
            hints: Array.isArray(ex.hints) ? ex.hints.slice() : [],
        }
        : {
            // Default, falls in META nichts vorhanden ist
            latin: stripPunct(`${latinForm} amīcōs.`),
            german: deFinite ? stripPunct(`${deFinite} die Freunde.`) : "",
            hints: [],
        };

    const title = `${row.lemma} – ${row.lemmaDe} (${spec.tense}, ${spec.mood}${spec.voice ? `, ${spec.voice}` : ""})`;

    return { title, example, deFinite };
}

// Öffentlich: Anzeigezeile unter „Richtige Bestimmung(en)“
export function formatVerbSpec(opt) {
    const numFull = opt.number === "Sg" ? "Singular" : "Plural";
    // Reihenfolge wie gewünscht: Person, Numerus, Modus, Genus, Zeitform
    return `${opt.person}. Person ${numFull} ${opt.mood} ${opt.voice} ${opt.tense}`;
}

// -------------------------------------------------------------
// Hauptfunktion: erzeugt die Verb-Fragen
// -------------------------------------------------------------
export function buildVerbQuestions({ lemmas, numQuestions, filters }) {
    const allowTenses = asList(filters?.tenses).length ? filters.tenses : TENSES;
    const allowMoods = asList(filters?.moods).length ? filters.moods : MOODS;
    const allowVoices = asList(filters?.voices).length ? filters.voices : VOICES;

    const wanted = new Set(asList(lemmas).map(s => (s || "").toLowerCase()));
    const wantAll = wanted.size === 0;

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


                    const pnKey = `${person}${number}`; // z.B. "1Sg"
                    const form = row.forms?.[pnKey];

                    if (!form) continue;

                    const spec = { person, number, tense, mood: row.mood, voice: row.voice };
                    const helpExample = pickVerbExample(row.lemma, spec);            // aus Meta
                    const helpGloss = pickVerbGloss(row.lemma, spec);

                    console.log("BUILD VERB Q:", helpExample, helpGloss);

                    const helpParadigm = buildHelpParadigm(row);
                    // const { title: helpTitle, example: helpExample } = buildHelpExample(lemmaKey, row, spec);
                    const clean = s => (s || "").trim().replace(/[.。]\s*$/, ""); // Punkt am Ende optional entfernen

                    const lemmaKey = normalizeLemma(row.lemma);
                    const metaByTense = VERB_META[lemmaKey]?.[tense];
                    const byMood = metaByTense?.[row.mood];
                    const byVoice = byMood?.[row.voice];

                    // Beispiele

                    const example = byVoice?.examples?.[pnKey] || null;

                    // Gloss/Übersetzung (kurz)
                    const gloss = byVoice?.gloss?.[pnKey] || null;


                    candidates.push({
                        //id: `verb_${row.lemma}_${tense}_${row.mood}_${row.voice}_${key}`,
                        type: "verb",
                        prompt: form,
                        lemma: row.lemma,
                        lemmaDe: row.lemmaDe,
                        correctOptions: [{ person, number, tense, mood: row.mood, voice: row.voice }],

                        // Hilfetabelle (hattest du bereits)
                        helpParadigm: [
                            { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
                            { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
                            { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" }
                        ],
                        helpTitle: `${row.lemma} – ${row.lemmaDe} (${tense}, ${row.mood}, ${row.voice})`,

                        // NEU: aus der Meta – wird in Quiz.jsx angezeigt
                        helpExample: example ? { latin: example.latin, german: example.german, hints: example.hints || [] } : null,
                        helpGloss: gloss || null,

                        topics: ["verb"]
                    });
                }
            }
        }
    }

    if (!candidates.length) return [];

    // Gleichmäßig über Lemmata verteilen
    const byLemma = new Map();
    for (const c of candidates) {
        const k = c.lemma.toLowerCase();
        if (!byLemma.has(k)) byLemma.set(k, []);
        byLemma.get(k).push(c);
    }
    for (const list of byLemma.values()) list.sort(() => Math.random() - 0.5);

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
