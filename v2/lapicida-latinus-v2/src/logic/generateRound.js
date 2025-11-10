// src/logic/generateRound.js

// Zentrale Rundengenerierung für alle Kategorien.
// Aktuell vollständig implementiert: Substantive, Verben, Possessiva.
// Demonstrativa / Adjektive im Kontext sind vorbereitet, können schrittweise nachgezogen werden.

import nounsAdjectives from "../data/nounsAdjectives.json";

import verbsPraesens from "../data/verbs_praesens.json";
import verbsImperfekt from "../data/verbs_imperfekt.json";
import verbsPerfekt from "../data/verbs_perfekt.json";
import verbsPlusquamperfekt from "../data/verbs_plusquamperfekt.json";
import verbsFutur1 from "../data/verbs_futur1.json";
import verbsFutur2 from "../data/verbs_futur2.json";

import demonstratives from "../data/demonstratives.json";
import possessives from "../data/possessives.json";
import conjunctions from "../data/conjunctions.json";

// ===================================================
// Utilities
// ===================================================

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const CASE_LABELS = {
    Nom: "Nominativ",
    Gen: "Genitiv",
    Dat: "Dativ",
    Akk: "Akkusativ",
    Abl: "Ablativ",
    Vok: "Vokativ"
};

const NUMBER_LABELS = {
    Sg: "Singular",
    Pl: "Plural"
};

const GENDER_LABELS = {
    m: "maskulin",
    f: "feminin",
    n: "neutrum"
};

// Schön ausgeschriebene Bestimmung aus Option
export function labelForCombo(opt) {
    if (!opt) return "";
    const c = CASE_LABELS[opt.case] || opt.case || "";
    const n = NUMBER_LABELS[opt.number] || opt.number || "";
    const g = GENDER_LABELS[opt.gender] || opt.gender || "";
    return [c, n, g].filter(Boolean).join(" ");
}

// ===================================================
// Verben: Mapping Tense/Mood/Voice -> JSON-Key
// ===================================================

const VERB_DATA_BY_TENSE = {
    Praesens: verbsPraesens,
    Imperfekt: verbsImperfekt,
    Perfekt: verbsPerfekt,
    Plusquamperfekt: verbsPlusquamperfekt,
    "Futur I": verbsFutur1,
    "Futur II": verbsFutur2
};

const ALL_VERB_TENSES = [
    "Praesens",
    "Imperfekt",
    "Perfekt",
    "Plusquamperfekt",
    "Futur I",
    "Futur II"
];

const PERSONS = ["1", "2", "3"];
const NUMBERS_VERB = ["Sg", "Pl"];

function verbKey(tense, mood, voice) {
    const t = (tense || "").toLowerCase().replace(/\s+/g, "");
    const m = (mood || "").toLowerCase();
    const v = (voice || "").toLowerCase();

    if (t === "praesens" && m === "indikativ" && v === "aktiv")
        return "praesens_ind_akt";
    if (t === "praesens" && m === "indikativ" && v === "passiv")
        return "praesens_ind_pass";
    if (t === "praesens" && m === "konjunktiv" && v === "aktiv")
        return "praesens_konj_akt";
    if (t === "praesens" && m === "konjunktiv" && v === "passiv")
        return "praesens_konj_pass";
    if (t === "praesens" && m === "imperativ" && v === "aktiv")
        return "praesens_imp_akt";
    if (t === "praesens" && m === "imperativ" && v === "passiv")
        return "praesens_imp_pass";

    const base = t;
    if (!base) return null;

    if (m === "indikativ" && v === "aktiv") return `${base}_ind_akt`;
    if (m === "indikativ" && v === "passiv") return `${base}_ind_pass`;
    if (m === "konjunktiv" && v === "aktiv") return `${base}_konj_akt`;
    if (m === "konjunktiv" && v === "passiv") return `${base}_konj_pass`;
    if (m === "imperativ" && v === "aktiv") return `${base}_imp_akt`;
    if (m === "imperativ" && v === "passiv") return `${base}_imp_pass`;

    return null;
}

// ===================================================
// Nomen – Paradigma aus JSON ableiten
// ===================================================

/**
 * Liefert für ein Nomen-Lemma eine kleine Deklinationstabelle
 * direkt aus nounsAdjectives.json:
 *
 * [
 *   { case: "Nominativ", singular: "insula", plural: "insulae" },
 *   { case: "Genitiv",   singular: "insulae", plural: "insularum" },
 *   ...
 * ]
 *
 * Wenn Daten fehlen, wird die entsprechende Zelle leer gelassen.
 */
function buildNounParadigm(lemma) {
    if (!lemma) return null;

    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma === lemma &&
            e.case &&
            e.number &&
            e.form
    );
    if (!entries.length) return null;

    const CASE_ORDER = ["Nom", "Gen", "Dat", "Akk", "Abl"];
    const NUM_ORDER = ["Sg", "Pl"];

    const rows = [];

    for (const c of CASE_ORDER) {
        // alle Formen in diesem Kasus
        const row = { case: CASE_LABELS[c] || c, singular: "", plural: "" };

        for (const n of NUM_ORDER) {
            const formsHere = entries
                .filter((e) => e.case === c && e.number === n)
                .map((e) => e.form);
            const uniq = [...new Set(formsHere)];
            if (uniq.length) {
                if (n === "Sg") row.singular = uniq.join(" / ");
                if (n === "Pl") row.plural = uniq.join(" / ");
            }
        }

        if (row.singular || row.plural) {
            rows.push(row);
        }
    }

    return rows.length ? rows : null;
}

/**
 * Nomen-Runde:
 * - Es wird **ein Lemma** geübt (vom Startscreen gewählt).
 * - Mehrdeutige Formen (z.B. "villae") behalten alle gültigen Lösungen.
 * - Jede Frage bekommt eine Paradigma-Tabelle `paradigm` mit.
 */
// Nomen: komplette Deklination für ein Lemma bauen
function buildNounParadigm(lemma) {
    const cases = ["Nom", "Gen", "Dat", "Akk", "Abl"];
    const labels = {
        Nom: "Nominativ",
        Gen: "Genitiv",
        Dat: "Dativ",
        Akk: "Akkusativ",
        Abl: "Ablativ"
    };

    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma === lemma &&
            e.form &&
            e.case &&
            e.number
    );

    if (!entries.length) return [];

    return cases.map((c) => {
        const sg = entries.find((e) => e.case === c && e.number === "Sg");
        const pl = entries.find((e) => e.case === c && e.number === "Pl");
        return {
            case: labels[c] || c,
            singular: sg ? sg.form : "",
            plural: pl ? pl.form : ""
        };
    });
}

// Nomen-Fragen mit Mehrdeutigkeiten + Paradigma
function buildNounQuestions(lemma, numQuestions) {
    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma === lemma &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );
    if (!entries.length) return [];

    const paradigm = buildNounParadigm(lemma);

    const groupsByForm = new Map();

    for (const e of entries) {
        const form = e.form;
        if (!groupsByForm.has(form)) {
            groupsByForm.set(form, {
                prompt: form,
                lemma: e.lemma,
                lemmaDe: e.lemmaDe,
                correctOptions: []
            });
        }

        groupsByForm.get(form).correctOptions.push({
            case: e.case,
            number: e.number,
            gender: e.gender,
            de: e.lemmaDe || ""
        });
    }

    const grouped = shuffle(Array.from(groupsByForm.values()));
    const take = Math.min(numQuestions, grouped.length);

    return grouped.slice(0, take).map((g, i) => ({
        id: `noun_${g.lemma}_${i}`,
        type: "noun",
        prompt: g.prompt,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        paradigm,              // komplette Deklination hängt direkt an der Frage
        topics: ["noun"]
    }));
}


// ===================================================
// Possessiva – laufen wie besprochen, Mehrdeutigkeiten erlaubt
// (Code aus deiner funktionierenden Version übernommen)
// ===================================================

function buildPossessiveQuestions(numQuestions) {
    const possList = Array.isArray(possessives) ? possessives : [];
    if (!possList.length) return [];

    const nounEntries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );

    const groupsByPrompt = new Map();

    for (const poss of possList) {
        const ctx = poss.contextNouns || {};

        for (const [key, form] of Object.entries(poss.forms || {})) {
            // Key-Format: "Nom_Sg_m"
            const [c, n, g] = key.split("_");
            if (!form || !c || !n || !g) continue;

            const ctxNoun = ctx[g];
            if (!ctxNoun) continue;

            const noun = nounEntries.find(
                (nn) =>
                    nn.lemma === ctxNoun.la &&
                    nn.case === c &&
                    nn.number === n &&
                    nn.gender === g
            );
            if (!noun) continue;

            const prompt = `${form} ${noun.form}`;
            const dePhrase = `${poss.lemmaDe || ""} ${ctxNoun.de || noun.lemmaDe || ""}`.trim();

            if (!groupsByPrompt.has(prompt)) {
                groupsByPrompt.set(prompt, {
                    poss,
                    prompt,
                    correctOptions: [],
                    topics: ["possessive"]
                });
            }

            groupsByPrompt.get(prompt).correctOptions.push({
                case: c,
                number: n,
                gender: g,
                de: `${labelForCombo({ case: c, number: n, gender: g })} – ${dePhrase}`
            });
        }
    }

    const grouped = shuffle(Array.from(groupsByPrompt.values()));
    const take = Math.min(numQuestions, grouped.length);

    return grouped.slice(0, take).map((g, i) => ({
        id: `poss_${g.poss.id}_${i}`,
        type: "possessive",
        prompt: g.prompt,
        lemma: g.poss.lemma,
        lemmaDe: g.poss.lemmaDe,
        correctOptions: g.correctOptions,
        topics: g.topics
    }));
}

// ===================================================
// Verben – wie gehabt, nur sauber ausgeschrieben
// ===================================================

function buildVerbQuestions(numQuestions, lemma, verbSettings = {}) {
    const {
        tenses = ALL_VERB_TENSES,
        moods = ["Indikativ"],
        voices = ["Aktiv"]
    } = verbSettings;

    const activeTenses = tenses.length ? tenses : ALL_VERB_TENSES;

    const candidates = [];

    for (const tense of activeTenses) {
        const list = VERB_DATA_BY_TENSE[tense] || [];
        for (const verb of list) {
            if (lemma && verb.lemma !== lemma) continue;

            for (const mood of moods) {
                for (const voice of voices) {
                    const key = verbKey(tense, mood, voice);
                    if (!key) continue;
                    const table = verb.forms?.[key];
                    if (!table) continue;

                    for (const p of PERSONS) {
                        for (const n of NUMBERS_VERB) {
                            const cellKey = `${p}${n.toLowerCase()}`; // "1sg", "3pl"
                            const form = table[cellKey];
                            if (!form) continue;

                            candidates.push({
                                form,
                                lemma: verb.lemma,
                                lemmaDe: verb.lemmaDe,
                                person: p,
                                number: n,
                                tense,
                                mood,
                                voice
                            });
                        }
                    }
                }
            }
        }
    }

    if (!candidates.length) return [];

    const shuffled = shuffle(candidates);
    const take = Math.min(numQuestions, shuffled.length);

    return shuffled.slice(0, take).map((c, i) => ({
        id: `verb_${c.lemma}_${i}`,
        type: "verb",
        prompt: c.form,
        lemma: c.lemma,
        lemmaDe: c.lemmaDe,
        correctOptions: [
            {
                person: c.person,
                number: c.number,
                tense: c.tense,
                mood: c.mood,
                voice: c.voice,
                // ausgeschrieben:
                de: `${c.person}. Person ${c.number === "Sg" ? "Singular" : "Plural"} ${c.mood} ${c.voice} ${c.tense} (${c.lemmaDe || ""})`
            }
        ],
        topics: ["verb"]
    }));
}

// ===================================================
// Konjunktionen (optional, wie gehabt)
// ===================================================

function buildConjunctionQuestions(numQuestions) {
    const list = Array.isArray(conjunctions) ? conjunctions : [];
    if (!list.length) return [];

    const shuffled = shuffle(list);
    const take = Math.min(numQuestions, shuffled.length);

    return shuffled.slice(0, take).map((c, i) => ({
        id: `conj_${i}`,
        type: "conjunction",
        prompt: c.form,
        correct: {
            type: c.type,
            meaning: c.meaning,
            explanation: c.explanation
        },
        topics: ["conjunction"]
    }));
}

// ===================================================
// Demonstrativa / Adjektive im Kontext
// (Platzhalter – wir ziehen sie im nächsten Schritt sauber nach)
// ===================================================

function buildAdjWithNounQuestions(/* lemma, numQuestions */) {
    // wird im nächsten Schritt sauber rekonstruiert
    return [];
}

function buildDemonstrativeQuestions(/* numQuestions */) {
    // wird im nächsten Schritt sauber rekonstruiert
    return [];
}

// ===================================================
// generateRound – Haupteinstieg
// ===================================================

export function generateRound({
    category,
    numQuestions,
    lemma = null,
    verbSettings = {}
}) {
    const safeNum =
        typeof numQuestions === "number" && numQuestions > 0
            ? numQuestions
            : 5;

    let questions = [];

    switch (category) {
        case "nouns":
            if (lemma) {
                questions = buildNounQuestions(lemma, safeNum);
            }
            break;

        case "adj_with_noun":
            if (lemma) {
                questions = buildAdjWithNounQuestions(lemma, safeNum);
            }
            break;

        case "demonstratives":
            questions = buildDemonstrativeQuestions(safeNum);
            break;

        case "possessives":
            questions = buildPossessiveQuestions(safeNum);
            break;

        case "verbs":
            questions = buildVerbQuestions(safeNum, lemma, verbSettings);
            break;

        case "conjunctions":
            questions = buildConjunctionQuestions(safeNum);
            break;

        default:
            questions = [];
    }

    return {
        category,
        lemma,
        numQuestions: safeNum,
        questions
    };
}
