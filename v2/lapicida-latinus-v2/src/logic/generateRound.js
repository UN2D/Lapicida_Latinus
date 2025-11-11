// src/logic/generateRound.js

import nounsAdjectives from "../data/nounsAdjectives.json";

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Morphologie-Labels

const CASE_LABELS = {
    Nom: "Nominativ",
    Gen: "Genitiv",
    Dat: "Dativ",
    Akk: "Akkusativ",
    Abl: "Ablativ"
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

// ----------------------------------------------------
// Paradigma aus den Rohdaten bauen
// ----------------------------------------------------

function buildNounParadigm(lemma) {
    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma === lemma &&
            e.case &&
            e.number &&
            e.form
    );
    if (!entries.length) return null;

    const byKey = {};
    for (const e of entries) {
        const key = `${e.case}_${e.number}`;
        if (!byKey[key]) byKey[key] = e.form;
    }

    const cases = ["Nom", "Gen", "Dat", "Akk", "Abl"];

    const rows = cases.map((c) => ({
        case: CASE_LABELS[c] || c,
        singular: byKey[`${c}_Sg`] || "",
        plural: byKey[`${c}_Pl`] || ""
    }));

    // wenn wirklich alles leer ist, keine Tabelle anzeigen
    const any = rows.some((r) => r.singular || r.plural);
    if (!any) return null;

    return rows;
}

// ----------------------------------------------------
// Substantive: Fragen
// ----------------------------------------------------

function buildNounQuestions({ lemmas, numQuestions }) {
    // Wenn keine Lemmata gewählt: alle verfügbaren
    const activeLemmas =
        Array.isArray(lemmas) && lemmas.length
            ? lemmas
            : Array.from(
                new Set(
                    nounsAdjectives
                        .filter((e) => e.pos === "noun" && e.lemma)
                        .map((e) => e.lemma)
                )
            );

    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            activeLemmas.includes(e.lemma) &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );

    if (!entries.length) return [];

    // Gruppen nach Form, pro Gruppe: alle gültigen Deutungen
    const groupsByForm = new Map();

    for (const e of entries) {
        const key = `${e.lemma}::${e.form}`;
        if (!groupsByForm.has(key)) {
            groupsByForm.set(key, {
                lemma: e.lemma,
                lemmaDe: e.lemmaDe || "",
                form: e.form,
                options: []
            });
        }
        groupsByForm.get(key).options.push({
            case: e.case,
            number: e.number,
            gender: e.gender
            // KEIN vollständiges Label hier, damit wir es nicht doppeln
            // lemmaDe nutzen wir später separat.
        });
    }

    const allGroups = shuffle(Array.from(groupsByForm.values()));
    const take = Math.min(numQuestions, allGroups.length);

    const questions = [];

    for (let i = 0; i < take; i++) {
        const g = allGroups[i];
        const paradigm = buildNounParadigm(g.lemma);

        questions.push({
            id: `noun_${g.lemma}_${i}`,
            type: "noun",
            prompt: g.form,
            lemma: g.lemma,
            lemmaDe: g.lemmaDe,
            correctOptions: g.options,
            paradigm // komplette Deklination für die Hilfetabelle
        });
    }

    return questions;
}

// ----------------------------------------------------
// generateRound – Hauptexport
// ----------------------------------------------------

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

        // weitere Kategorien später
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
