// src/core/generators/nouns.js

import nounsAdjectives from "../../data/nounsAdjectives.json";

const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
const NUMBERS = ["Sg", "Pl"];
const GENDERS = ["m", "f", "n"];

const DE_IRREG_PLURALS = {
    "Freund": "Freunde",
    "Stadt": "Städte",
    "Wort": "Wörter",
    "Ort": "Orte",
    "Bewohner": "Bewohner",
    "Villa": "Villen",
    "Tempel": "Tempel",
};

function germanArticle(case_, number, gender) {
    // sehr einfache der/die/das-Logik (ohne Adjektiv-Endungen)
    const c = case_;
    const n = number;
    const g = gender;

    // Sing.: m / f / n
    if (n === "Sg") {
        if (c === "Nom") return g === "m" ? "der" : g === "f" ? "die" : "das";
        if (c === "Akk") return g === "m" ? "den" : g === "f" ? "die" : "das";
        if (c === "Dat") return g === "m" ? "dem" : g === "f" ? "der" : "dem";
        if (c === "Gen") return g === "m" ? "des" : g === "f" ? "der" : "des";
        if (c === "Abl") return "mit dem"; // sehr grob – falls Ablativ im Dat abgebildet
    }

    // Plural (Artikel immer "die" außer Dat/Gen Sonderfälle)
    if (n === "Pl") {
        if (c === "Nom" || c === "Akk") return "die";
        if (c === "Dat") return "den";   // streng genommen +Dativ-Plural-Endung; hier nur Artikel
        if (c === "Gen") return "der";
        if (c === "Abl") return "mit den";
    }

    return ""; // Fallback
}
/*
function germanNounPhrase(case_, number, gender, lemmaDe) {
    const art = germanArticle(case_, number, gender);
    const base = (lemmaDe || "").trim();
    const suffix = (number === "Pl") ? " (Plural)" : "";
    return [art, base].filter(Boolean).join(" ") + suffix;
}
*/
function pluralizeDeBase(noun) {
    if (!noun) return noun;
    if (DE_IRREG_PLURALS[noun]) return DE_IRREG_PLURALS[noun];

    const lower = noun.toLowerCase();
    // ganz grobe Heuristiken
    if (/[lnr]$/.test(lower)) return noun + "e";       // Ort -> Orte
    if (/[e]$/.test(lower)) return noun + "n";        // Villa -> Villen
    if (/[el|er]$/.test(lower)) return noun;           // Tempel -> Tempel
    return noun + "e";                                  // Default
}

// Dativ Plural fast immer -n (wenn nicht schon auf -n/-s/-r endet)
function dativePlural(nounPlural) {
    if (!nounPlural) return nounPlural;
    const lower = nounPlural.toLowerCase();
    if (/(n|s|r)$/.test(lower)) return nounPlural;
    return nounPlural + "n";
}

// Bestimmter Artikel nach Kasus/Nummerus/Genus
function definiteArticleDe(kase, number, gender) {
    const A = {
        // Sg
        "Nom_Sg_m": "der", "Gen_Sg_m": "des", "Dat_Sg_m": "dem", "Akk_Sg_m": "den",
        "Nom_Sg_f": "die", "Gen_Sg_f": "der", "Dat_Sg_f": "der", "Akk_Sg_f": "die",
        "Nom_Sg_n": "das", "Gen_Sg_n": "des", "Dat_Sg_n": "dem", "Akk_Sg_n": "das",
        // Pl (für alle Genera identisch beim bestimmten Artikel)
        "Nom_Pl_m": "die", "Gen_Pl_m": "der", "Dat_Pl_m": "den", "Akk_Pl_m": "die",
        "Nom_Pl_f": "die", "Gen_Pl_f": "der", "Dat_Pl_f": "den", "Akk_Pl_f": "die",
        "Nom_Pl_n": "die", "Gen_Pl_n": "der", "Dat_Pl_n": "den", "Akk_Pl_n": "die",
    };
    return A[`${kase}_${number}_${gender}`] || "";
}

// Baut „den Freunden“ / „der Stadt“ / „die Villen“ etc.
function germanNounPhrase(kase, number, gender, lemmaDe) {
    if (!lemmaDe) return "";

    // 1) Nomen in richtige Zahl
    let nounForm = lemmaDe;
    if (number === "Pl") nounForm = pluralizeDeBase(lemmaDe);

    // 2) Dativ Plural: -n erzwingen (falls sinnvoll)
    if (number === "Pl" && kase === "Dat") {
        nounForm = dativePlural(nounForm);
    }

    // 3) Genitiv Singular (sehr konservativ): „des Ort**es**“, „des Freund**es**“
    if (number === "Sg" && kase === "Gen") {
        const lower = nounForm.toLowerCase();
        // ganz einfache Regel: wenn nicht auf -e endet, „-es“, sonst „-s“
        nounForm = /e$/.test(lower) ? nounForm + "s" : nounForm + "es";
    }

    // 4) Artikel
    const art = definiteArticleDe(kase, number, gender);

    return `${art} ${nounForm}`;
}

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
            de: germanNounPhrase(e.case, e.number, e.gender, first.lemmaDe), // <- neu
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
