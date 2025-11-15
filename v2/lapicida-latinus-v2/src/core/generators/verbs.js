// src/core/generators/verbs.js
// ----------------------------------------------------
// Verben: Kandidaten bauen + Meta (Gloss/Beispiel) anhängen
// ----------------------------------------------------
import PRAES from "../../data/verbs_praesens.json";
import PERF from "../../data/verbs_perfekt.json";
// Weitere Zeiten ggf. später:
// import IMPF from "../../data/verbs_imperfekt.json";
// import PQP  from "../../data/verbs_plusquamperfekt.json";
// import FUT1 from "../../data/verbs_futur1.json";
// import FUT2 from "../../data/verbs_futur2.json";

import VERBS_META from "../../data/verbs_meta.json";

// ---------- kleine Utils ----------
const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];

const TENSE_CANON = {
    "praesens": "Praesens", "präsens": "Praesens", "present": "Praesens",
    "perfekt": "Perfekt", "perfect": "Perfekt",
    "imperfekt": "Imperfekt", "imperfect": "Imperfekt",
    "plusquamperfekt": "Plusquamperfekt", "pqp": "Plusquamperfekt",
    "futur i": "Futur I", "futur1": "Futur I",
    "futur ii": "Futur II", "futur2": "Futur II",
};
const normTense = (t) => TENSE_CANON[String(t || "").toLowerCase().trim()] || null;

const moodCanon = (m) => {
    const s = String(m || "").toLowerCase();
    if (s.startsWith("ind")) return "Indikativ";
    if (s.startsWith("kon")) return "Konjunktiv";
    if (s.startsWith("imp")) return "Imperativ";
    return "Indikativ";
};
const voiceCanon = (v) => {
    const s = String(v || "").toLowerCase();
    if (s.startsWith("pass")) return "Passiv";
    return "Aktiv";
};

// ---------- BANK füllen (beim Modul-Load) ----------
const BANK = Object.create(null);

function addRows(input) {
    if (!input) return;
    if (Array.isArray(input)) {
        for (const r of input) {
            const t = normTense(r?.tense) || "Praesens";
            if (!BANK[t]) BANK[t] = [];
            BANK[t].push({ ...r, tense: t, mood: moodCanon(r?.mood), voice: voiceCanon(r?.voice) });
        }
        return;
    }
    if (typeof input === "object") {
        for (const [k, arr] of Object.entries(input)) {
            if (!Array.isArray(arr)) continue;
            const tKey = normTense(k) || "Praesens";
            if (!BANK[tKey]) BANK[tKey] = [];
            for (const r of arr) {
                const t = normTense(r?.tense) || tKey;
                if (!BANK[t]) BANK[t] = [];
                BANK[t].push({ ...r, tense: t, mood: moodCanon(r?.mood), voice: voiceCanon(r?.voice) });
            }
        }
    }
}

addRows(PRAES);
addRows(PERF);

// ---------- Meta normalisieren ----------
/*
  verbs_meta.json erwartet Struktur:
  {
    "verbsMeta": [
      {
        "lemma": "laudare",
        "lemmaDe": "loben",
        "tense": "Praesens",
        "moods": {
          "Indikativ": {
            "Aktiv": {
              "gloss": { "1Sg":"ich lobe", ... },
              "examples": { "1Sg": { latin:"...", german:"...", hints:[...] }, ... }
            }
          }
        }
      },
      ...
    ]
  }
*/
const META = (() => {
    const m = Object.create(null);
    const list = Array.isArray(VERBS_META?.verbsMeta) ? VERBS_META.verbsMeta : [];
    for (const entry of list) {
        const lemma = String(entry.lemma || "").toLowerCase();
        const tense = normTense(entry.tense) || "Praesens";
        if (!m[lemma]) m[lemma] = Object.create(null);
        if (!m[lemma][tense]) m[lemma][tense] = Object.create(null);

        const moods = entry.moods || {};
        for (const [moodKey, voices] of Object.entries(moods)) {
            const mood = moodCanon(moodKey);
            if (!m[lemma][tense][mood]) m[lemma][tense][mood] = Object.create(null);
            for (const [voiceKey, block] of Object.entries(voices || {})) {
                const voice = voiceCanon(voiceKey);
                m[lemma][tense][mood][voice] = {
                    gloss: block.gloss || {},
                    examples: block.examples || {}
                };
            }
        }
    }
    return m;
})();

const PN = (p, n) => `${p}${n}`; // "1Sg" etc.

function pickMeta(lemma, tense, mood, voice, person, number) {
    const L = String(lemma || "").toLowerCase();
    const t = normTense(tense) || "Praesens";
    const m = moodCanon(mood);
    const v = voiceCanon(voice);
    const pn = PN(person, number);

    const slot = META?.[L]?.[t]?.[m]?.[v] || {};
    const gloss = slot.gloss?.[pn] || "";
    const ex = slot.examples?.[pn] || null; // { latin, german, hints[] } | null
    return { gloss, example: ex };
}

// ---------- Export-Helfer (für Ergebnisliste) ----------
export function formatVerbSpec(opt) {
    // "1. Person Plural, Praesens, Indikativ, Aktiv"
    const personLabel = { "1": "1. Person", "2": "2. Person", "3": "3. Person" }[opt.person] || opt.person;
    const numberLabel = { "Sg": "Singular", "Pl": "Plural" }[opt.number] || opt.number;
    const tense = normTense(opt.tense) || opt.tense;
    const mood = moodCanon(opt.mood);
    const voice = voiceCanon(opt.voice);
    return `${personLabel} ${numberLabel}, ${tense}, ${mood}, ${voice}`;
}

// ---------- Fragerzeugung ----------
export function buildVerbQuestions({ lemmas = [], numQuestions = 5, filters = {} }) {
    const availableTenses = Object.keys(BANK);
    const requested = asList(filters.tenses).map(normTense).filter(Boolean);
    const allowTenses = requested.length ? requested.filter(t => availableTenses.includes(t)) : availableTenses;

    const allowMoods = asList(filters.moods).length ? asList(filters.moods).map(moodCanon) : ["Indikativ"];
    const allowVoices = asList(filters.voices).length ? asList(filters.voices).map(voiceCanon) : ["Aktiv"];

    const wantedAll = !asList(lemmas).length;
    const lemmaSet = new Set(asList(lemmas));

    const candidates = [];

    for (const tense of allowTenses) {
        const rows = BANK[tense] || [];
        for (const row of rows) {
            if (!wantedAll && !lemmaSet.has(row.lemma)) continue;
            if (!allowMoods.includes(row.mood)) continue;
            if (!allowVoices.includes(row.voice)) continue;

            for (const person of PERSONS) {
                for (const number of NUMBERS) {
                    const cellKey = `${person}${number}`;
                    const form = row.forms?.[cellKey];
                    if (!form) continue;

                    const { gloss, example } = pickMeta(row.lemma, tense, row.mood, row.voice, person, number);

                    candidates.push({
                        id: `verb_${row.lemma}_${tense}_${row.mood}_${row.voice}_${cellKey}`,
                        type: "verb",
                        prompt: form,
                        lemma: row.lemma,
                        lemmaDe: row.lemmaDe,
                        correctOptions: [{ person, number, tense, mood: row.mood, voice: row.voice }],

                        // Hilfetabelle (Personen-Raster)
                        helpParadigm: [
                            { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
                            { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
                            { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" },
                        ],
                        helpTitle: `${row.lemma} – ${row.lemmaDe} (${tense}, ${row.mood}, ${row.voice})`,

                        // Meta:
                        helpGloss: gloss || "",        // z.B. "du lobst"
                        helpExample: example || null,   // { latin, german, hints[] } | null

                        topics: ["verb"]
                    });
                }
            }
        }
    }

    // Mischen & begrenzen
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, numQuestions);
}
