// src/logic/generateRound.js

import nounsAdjectives from "../data/nounsAdjectives.json";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

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
    Vok: "Vokativ",
};

const NUMBER_LABELS = {
    Sg: "Singular",
    Pl: "Plural",
};

const GENDER_LABELS = {
    m: "maskulin",
    f: "feminin",
    n: "neutrum",
};

function formatCaseNumberGender(opt) {
    if (!opt) return "";
    const c = CASE_LABELS[opt.case] || opt.case || "";
    const n = NUMBER_LABELS[opt.number] || opt.number || "";
    const g = GENDER_LABELS[opt.gender] || opt.gender || "";
    return [c, n, g].filter(Boolean).join(" ");
}

// --------------------------------------------------
// Nomen: Paradigma aus den Daten bauen
// --------------------------------------------------

/**
 * Baut aus nounsAdjectives eine einfache Deklinationstabelle
 * für ein Lemma (nur dieses Lemma, pos === "noun").
 *
 * Rückgabe: Array von Zeilen:
 * [{ caseLabel, singular, plural }]
 */
function buildNounParadigm(lemma) {
    if (!lemma) return null;

    const relevant = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma === lemma &&
            e.case &&
            e.number &&
            e.form
    );
    if (!relevant.length) return null;

    const rows = [];
    const order = ["Nom", "Gen", "Dat", "Akk", "Abl"];

    for (const c of order) {
        const singular = relevant.find(
            (e) => e.case === c && e.number === "Sg"
        )?.form;
        const plural = relevant.find(
            (e) => e.case === c && e.number === "Pl"
        )?.form;

        if (singular || plural) {
            rows.push({
                caseCode: c,
                caseLabel: CASE_LABELS[c] || c,
                singular: singular || "",
                plural: plural || "",
            });
        }
    }

    return rows.length ? rows : null;
}

// --------------------------------------------------
// Nomen: Fragen erzeugen (Mehrdeutigkeiten bleiben erhalten)
// --------------------------------------------------

/**
 * lemmas: string[]
 * numQuestions: Anzahl
 * includeParadigm: bool -> Paradigma pro Frage anhängen
 */
function buildNounQuestions({ lemmas, numQuestions, includeParadigm }) {
    const activeLemmas =
        Array.isArray(lemmas) && lemmas.length ? lemmas : [];

    if (!activeLemmas.length) return [];

    // gruppiere nach Form (villae -> alle möglichen Analysen)
    const groupsByForm = new Map();

    for (const e of nounsAdjectives) {
        if (
            e.pos !== "noun" ||
            !activeLemmas.includes(e.lemma) ||
            !e.form ||
            !e.case ||
            !e.number ||
            !e.gender
        ) {
            continue;
        }

        const form = e.form;

        if (!groupsByForm.has(form)) {
            groupsByForm.set(form, {
                prompt: form,
                lemma: e.lemma,
                lemmaDe: e.lemmaDe || "",
                correctOptions: [],
            });
        }

        groupsByForm.get(form).correctOptions.push({
            case: e.case,
            number: e.number,
            gender: e.gender,
            de: `${formatCaseNumberGender(e)}${e.lemmaDe ? ` – ${e.lemmaDe}` : ""
                }`,
        });
    }

    const grouped = shuffle(Array.from(groupsByForm.values()));
    const take = Math.min(numQuestions, grouped.length);

    return grouped.slice(0, take).map((g, i) => {
        const paradigm = includeParadigm
            ? buildNounParadigm(g.lemma)
            : null;

        return {
            id: `noun_${g.lemma}_${i}`,
            type: "noun",
            prompt: g.prompt,
            lemma: g.lemma,
            lemmaDe: g.lemmaDe,
            correctOptions: g.correctOptions,
            paradigm, // <- komplette Deklination (oder null)
            topics: ["noun"],
        };
    });
}

// --------------------------------------------------
// generateRound: zentrale Schnittstelle
// --------------------------------------------------

/**
 * category: "nouns" | ...
 * lemmas: ausgewählte Lemmata (Array)
 * numQuestions: 5/10/20...
 * showHelp: ob Hilfetabellen angezeigt werden sollen
 */
export function generateRound({
    category,
    lemmas = [],
    numQuestions = 5,
    showHelp = false,
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
                numQuestions: safeNum,
                includeParadigm: showHelp,
            });
            break;

        // weitere Kategorien folgen hier
        default:
            questions = [];
            break;
    }

    return {
        category,
        lemmas,
        numQuestions: safeNum,
        questions,
        showHelp,
    };
}
