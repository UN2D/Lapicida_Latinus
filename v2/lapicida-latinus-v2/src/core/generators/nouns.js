// src/core/generators/nouns.js

import nounsAdjectives from "../../data/nounsAdjectives.json";

const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
const NUMBERS = ["Sg", "Pl"];
const GENDERS = ["m", "f", "n"];

function asLemmaList(lemmas) {
    if (!lemmas) return [];
    if (Array.isArray(lemmas)) return lemmas.filter(Boolean);
    if (typeof lemmas === "string" && lemmas.trim()) return [lemmas.trim()];
    return [];
}

function isNounEntry(e) {
    const pos = (e.pos || e.wordType || "").toLowerCase();
    return (
        pos === "noun" &&
        e.lemma &&
        e.lemmaDe &&
        e.form &&
        CASES.includes(e.case) &&
        NUMBERS.includes(e.number) &&
        GENDERS.includes(e.gender)
    );
}

export function buildNounQuestions({ lemmas, numQuestions }) {
    const lemmaList = asLemmaList(lemmas);
    const allNouns = nounsAdjectives.filter(isNounEntry);

    const pool =
        lemmaList.length > 0
            ? allNouns.filter((e) => lemmaList.includes(e.lemma))
            : allNouns;

    if (!pool.length) return [];

    const byForm = new Map();
    for (const e of pool) {
        if (!byForm.has(e.form)) byForm.set(e.form, []);
        byForm.get(e.form).push(e);
    }

    let questions = [];
    for (const [form, entries] of byForm.entries()) {
        const first = entries[0];
        const correctOptions = entries.map((e) => ({
            case: e.case,
            number: e.number,
            gender: e.gender,
            // Nur die deutsche Bedeutung – KEINE Bestimmungsangabe hier!
            de: first.lemmaDe
        }));

        questions.push({
            id: `noun_${form}`,
            type: "noun",
            prompt: form,
            lemma: first.lemma,
            lemmaDe: first.lemmaDe,
            correctOptions,
            paradigmSource: first.lemma,
        });
    }

    questions = shuffle(questions).slice(0, numQuestions);
    attachParadigms(questions, allNouns);

    return questions;
}

// ---------- Helfer ----------

function mapCase(c) {
    return {
        Nom: "Nominativ",
        Gen: "Genitiv",
        Dat: "Dativ",
        Akk: "Akkusativ",
        Abl: "Ablativ",
    }[c] || c;
}

function mapNumber(n) {
    return { Sg: "Singular", Pl: "Plural" }[n] || n;
}

function mapGender(g) {
    return {
        m: "maskulin",
        f: "feminin",
        n: "neutrum",
    }[g] || g;
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function attachParadigms(questions, allNouns) {
    const byLemma = new Map();
    for (const e of allNouns) {
        if (!byLemma.has(e.lemma)) byLemma.set(e.lemma, []);
        byLemma.get(e.lemma).push(e);
    }

    for (const q of questions) {
        const forms = byLemma.get(q.paradigmSource || q.lemma);
        if (!forms) continue;

        const rows = CASES.map((c) => {
            const sg = forms.find((f) => f.case === c && f.number === "Sg");
            const pl = forms.find((f) => f.case === c && f.number === "Pl");
            return {
                case: mapCase(c),
                singular: sg ? sg.form : "",
                plural: pl ? pl.form : "",
            };
        });

        q.paradigm = rows;
    }
}
