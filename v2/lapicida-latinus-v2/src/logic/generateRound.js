// src/core/generateRound.js

import nounsAdjectives from "../data/nounsAdjectives.json";
// hier später: weitere Importe für Verben, Adjektive usw.

/**
 * Simple Shuffle
 */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Labels für Kasus/Num/Genus
 * (voll ausgeschrieben, wie gewünscht)
 */
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

export function formatCaseNumberGender(opt) {
    if (!opt) return "";
    const c = CASE_LABELS[opt.case] || opt.case || "";
    const n = NUMBER_LABELS[opt.number] || opt.number || "";
    const g = GENDER_LABELS[opt.gender] || opt.gender || "";
    return [c, n, g].filter(Boolean).join(" ");
}

/**
 * Paradigma für ein Substantiv (eine Deklination) erzeugen.
 * Nutzt die Einträge aus nounsAdjectives.json.
 *
 * Rückgabe: Array von Zeilen:
 * [{ case: "Nominativ", singular: "villa", plural: "villae" }, ...]
 */
function buildNounParadigm(lemma) {
    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma === lemma &&
            e.form &&
            e.case &&
            e.number
    );

    if (!entries.length) return [];

    const byCase = {};

    for (const e of entries) {
        if (!byCase[e.case]) {
            byCase[e.case] = {
                case: CASE_LABELS[e.case] || e.case,
                singular: "",
                plural: ""
            };
        }
        if (e.number === "Sg") byCase[e.case].singular = e.form;
        if (e.number === "Pl") byCase[e.case].plural = e.form;
    }

    // Nur Zeilen, wo es überhaupt Formen gibt
    return Object.values(byCase).filter(
        (row) => row.singular || row.plural
    );
}

/**
 * Fragen für Substantive:
 * - Mehrdeutigkeiten bleiben erhalten (eine Form -> mehrere korrekte Bestimmungen)
 * - Jede Frage trägt ihr Paradigma am Question-Objekt
 */
function buildNounQuestions({ lemmas, numQuestions }) {
    const selected = Array.isArray(lemmas)
        ? lemmas.filter(Boolean)
        : lemmas
            ? [lemmas]
            : [];

    if (!selected.length) return [];

    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            selected.includes(e.lemma) &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );

    if (!entries.length) return [];

    // Für jedes Lemma einmal das Paradigma vorbereiten
    const paradigmByLemma = {};
    for (const lemma of selected) {
        paradigmByLemma[lemma] = buildNounParadigm(lemma);
    }

    // Gruppen nach (Lemma + Form), damit z.B. "villae" für "villa" alle Deutungen zeigt
    const groups = new Map();

    for (const e of entries) {
        const key = `${e.lemma}::${e.form}`;
        if (!groups.has(key)) {
            groups.set(key, {
                lemma: e.lemma,
                lemmaDe: e.lemmaDe,
                prompt: e.form,
                correctOptions: []
            });
        }
        const g = groups.get(key);
        g.correctOptions.push({
            case: e.case,
            number: e.number,
            gender: e.gender,
            de: `${formatCaseNumberGender(e)} – ${e.lemmaDe || ""}`.trim()
        });
    }

    const allGroups = shuffle(Array.from(groups.values()));
    const take = Math.min(numQuestions, allGroups.length);

    return allGroups.slice(0, take).map((g, i) => ({
        id: `noun_${g.lemma}_${g.prompt}_${i}`,
        type: "noun",
        prompt: g.prompt,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        paradigm: paradigmByLemma[g.lemma] || [],
        topics: ["noun"]
    }));
}

/**
 * Zentrale Runden-Factory
 *
 * category:
 *  - "nouns" (bisher implementiert)
 *  - weitere Kategorien folgen
 *
 * lemmas: Array der ausgewählten Lemmata
 * numQuestions: 5/10/20 etc.
 * showHelp: ob Hilfetabellen etc. angezeigt werden dürfen
 */
export function generateRound({
    category,
    lemmas = [],
    numQuestions = 5,
    showHelp = false
}) {
    const safeNum =
        typeof numQuestions === "number" && numQuestions > 0
            ? numQuestions
            : 5;

    let questions = [];

    switch (category) {
        case "nouns":
            questions = buildNounQuestions({
                lemmas,
                numQuestions: safeNum
            });
            break;

        // Platzhalter: andere Kategorien folgen
        default:
            questions = [];
    }

    return {
        category,
        lemmas,
        numQuestions: safeNum,
        questions,
        showHelp
    };
}
