// src/logic/generateRound.js

// ================== Imports ==================
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
// Helper: Allgemein
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

function labelForCombo({ case: c, number: n, gender: g }) {
    const cc = CASE_LABELS[c] || c || "";
    const nn = NUMBER_LABELS[n] || n || "";
    const gg = GENDER_LABELS[g] || g || "";
    return [cc, nn, gg].filter(Boolean).join(" ");
}

// ===================================================
// Verben: Konfiguration + verbKey (muss zu App.jsx & Daten passen)
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
// Nomen – ein Lemma, Mehrdeutigkeiten bleiben erhalten
// ===================================================

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

    // gleiche Form -> mehrere Analysen
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
            de: e.de || labelForCombo(e)
        });
    }

    const grouped = shuffle(Array.from(groupsByForm.values()));
    const take = Math.min(numQuestions, grouped.length);

    return grouped.slice(0, take).map((g, i) => ({
        id: `noun_${g.lemma}_${i}`,
        type: "noun_adj_analyze",
        prompt: g.prompt,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        topics: ["noun"]
    }));
}

// ===================================================
// Adjektiv im Kontext – wir BILDEN die Adjektivform passend zum Substantiv
// (robust, unabhängig von voll ausdeklinierten Adj-Daten)
// ===================================================

function buildAdjForm(lemma, pattern, case_, number, gender) {
    // sehr vereinfachtes Schema für a-/o-Adjektive + typische Sonderfälle
    const endings = {
        m: {
            Sg: { Nom: "us", Gen: "i", Dat: "o", Akk: "um", Abl: "o" },
            Pl: { Nom: "i", Gen: "orum", Dat: "is", Akk: "os", Abl: "is" }
        },
        f: {
            Sg: { Nom: "a", Gen: "ae", Dat: "ae", Akk: "am", Abl: "a" },
            Pl: { Nom: "ae", Gen: "arum", Dat: "is", Akk: "as", Abl: "is" }
        },
        n: {
            Sg: { Nom: "um", Gen: "i", Dat: "o", Akk: "um", Abl: "o" },
            Pl: { Nom: "a", Gen: "orum", Dat: "is", Akk: "a", Abl: "is" }
        }
    };

    const end = endings[gender]?.[number]?.[case_];
    if (!end) return null;

    // Standard: -us, -a, -um
    if (!pattern || pattern === "regular") {
        if (lemma.endsWith("us")) {
            return lemma.replace(/us$/, "") + end;
        }
        if (lemma.endsWith("er")) {
            // z.B. miser, tener -> Stamm ohne -er? hier minimal:
            return lemma.replace(/er$/, "") + end;
        }
        return lemma + end;
    }

    if (pattern === "pulcher") {
        const stem = "pulchr";
        if (gender === "m" && number === "Sg" && case_ === "Nom") return "pulcher";
        return stem + end;
    }

    if (pattern === "liber") {
        const stem = "libr";
        if (gender === "m" && number === "Sg" && case_ === "Nom") return "liber";
        return stem + end;
    }

    return null;
}

function buildAdjWithNounQuestions(adjLemma, numQuestions) {
    if (!adjLemma) return [];

    const adjEntry =
        nounsAdjectives.find(
            (e) => e.pos === "adj" && e.lemma === adjLemma
        ) || null;
    if (!adjEntry) return [];

    const pattern = adjEntry.pattern || "regular";

    const nouns = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.form &&
            e.case &&
            e.number &&
            e.gender &&
            e.lemmaDe
    );
    if (!nouns.length) return [];

    const groupsByPrompt = new Map();

    for (const n of nouns) {
        const adjForm = buildAdjForm(adjEntry.lemma, pattern, n.case, n.number, n.gender);
        if (!adjForm) continue;

        const phrase = `${adjForm} ${n.form}`;

        if (!groupsByPrompt.has(phrase)) {
            groupsByPrompt.set(phrase, {
                prompt: phrase,
                promptAdj: adjForm,
                promptNoun: n.form,
                lemma: adjEntry.lemma,
                lemmaDe: adjEntry.lemmaDe,
                correctOptions: []
            });
        }

        groupsByPrompt.get(phrase).correctOptions.push({
            case: n.case,
            number: n.number,
            gender: n.gender,
            de: `${labelForCombo(n)} – ${adjEntry.lemmaDe || ""} ${n.lemmaDe || ""}`.trim()
        });
    }

    const grouped = shuffle(Array.from(groupsByPrompt.values()));
    const take = Math.min(numQuestions, grouped.length);

    return grouped.slice(0, take).map((g, i) => ({
        id: `adjctx_${adjLemma}_${i}`,
        type: "adj_with_noun",
        prompt: g.prompt,
        promptAdj: g.promptAdj,
        promptNoun: g.promptNoun,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        topics: ["adj_with_noun"]
    }));
}

// ===================================================
// Mini-Nomen-Flexer für Demonstrativa/Possessiva-Kontext
// (damit wir nicht von nounsAdjectives abhängig sind)
// Unterstützt: femina (a-Dekl.), vir (o-Dekl. mask., vir-Typ), templum (o-Dekl. neutrum)
// ===================================================

function flexSimpleNoun(lemma, gender, case_, number) {
    // sehr gezielt für unsere Kontext-Nomen
    if (lemma === "femina" && gender === "f") {
        const sg = { Nom: "femina", Gen: "feminae", Dat: "feminae", Akk: "feminam", Abl: "femina" };
        const pl = { Nom: "feminae", Gen: "feminarum", Dat: "feminis", Akk: "feminas", Abl: "feminis" };
        return (number === "Sg" ? sg[case_] : pl[case_]) || null;
    }

    if (lemma === "vir" && gender === "m") {
        const sg = { Nom: "vir", Gen: "viri", Dat: "viro", Akk: "virum", Abl: "viro" };
        const pl = { Nom: "viri", Gen: "virorum", Dat: "viris", Akk: "viros", Abl: "viris" };
        return (number === "Sg" ? sg[case_] : pl[case_]) || null;
    }

    if (lemma === "templum" && gender === "n") {
        const sg = { Nom: "templum", Gen: "templi", Dat: "templo", Akk: "templum", Abl: "templo" };
        const pl = { Nom: "templa", Gen: "templorum", Dat: "templis", Akk: "templa", Abl: "templis" };
        return (number === "Sg" ? sg[case_] : pl[case_]) || null;
    }

    // fallback: nichts
    return null;
}

// ===================================================
// Demonstrativa – mit korrekt flektiertem Kontextnomen + Mehrdeutigkeiten
// ===================================================

function buildDemonstrativeQuestions(numQuestions) {
    const demos = Array.isArray(demonstratives) ? demonstratives : [];
    if (!demos.length) return [];

    const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
    const NUMBERS = ["Sg", "Pl"];
    const GENDERS = ["m", "f", "n"];

    const groupsByPrompt = new Map();

    for (const demo of demos) {
        const ctx = demo.contextNouns || {};

        for (const c of CASES) {
            for (const n of NUMBERS) {
                for (const g of GENDERS) {
                    const key = `${c}_${n}_${g}`;
                    const pronForm = demo.forms?.[key];
                    const ctxNoun = ctx[g];
                    if (!pronForm || !ctxNoun) continue;

                    const nounForm =
                        flexSimpleNoun(ctxNoun.la, g, c, n) || null;
                    if (!nounForm) continue;

                    const prompt = `${pronForm} ${nounForm}`;

                    if (!groupsByPrompt.has(prompt)) {
                        groupsByPrompt.set(prompt, {
                            demo,
                            prompt,
                            usage: demo.usage,
                            correctOptions: [],
                            topics: ["demonstrative"]
                        });
                    }

                    groupsByPrompt.get(prompt).correctOptions.push({
                        case: c,
                        number: n,
                        gender: g,
                        de: `${labelForCombo({ case: c, number: n, gender: g })} – ${demo.lemmaDe || ""} ${ctxNoun.de || ""}`.trim()
                    });
                }
            }
        }
    }

    const grouped = shuffle(Array.from(groupsByPrompt.values()));
    if (!grouped.length) return [];

    const take = Math.min(numQuestions, grouped.length);

    return grouped.slice(0, take).map((g, i) => ({
        id: `demo_${g.demo.id}_${i}`,
        type: "demonstrative",
        prompt: g.prompt,
        lemma: g.demo.lemma,
        lemmaDe: g.demo.lemmaDe,
        correctOptions: g.correctOptions,
        usage: g.usage,
        topics: g.topics
    }));
}

// ===================================================
// Possessiva – mit flektiertem Kontextnomen, Mehrdeutigkeiten erlaubt
// (bisher lief bei dir gut; hier nur vorsichtig bereinigt)
// ===================================================

function buildPossessiveQuestions(numQuestions) {
    const possList = Array.isArray(possessives) ? possessives : [];
    if (!possList.length) return [];

    const groupsByPrompt = new Map();

    for (const poss of possList) {
        const ctx = poss.contextNouns || {};

        for (const [key, form] of Object.entries(poss.forms || {})) {
            // key z.B. "Nom_Sg_m"
            const [c, n, g] = key.split("_");
            if (!form || !c || !n || !g) continue;

            const ctxNoun = ctx[g];
            if (!ctxNoun) continue;

            const nounForm =
                flexSimpleNoun(ctxNoun.la, g, c, n) || null;
            if (!nounForm) continue;

            const prompt = `${form} ${nounForm}`;
            const dePhrase = `${poss.lemmaDe || ""} ${ctxNoun.de || ""}`.trim();

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
    if (!grouped.length) return [];

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
// Verben
// ===================================================

function buildVerbQuestions(numQuestions, lemma, verbSettings = {}) {
    const {
        tenses = ALL_VERB_TENSES,
        moods = ["Indikativ"],
        voices = ["Aktiv"]
    } = verbSettings;

    const activeTenses = (tenses.length ? tenses : ALL_VERB_TENSES).filter(
        (t) => VERB_DATA_BY_TENSE[t] && VERB_DATA_BY_TENSE[t].length
    );
    if (!activeTenses.length) return [];

    const candidates = [];

    for (const tense of activeTenses) {
        const list = VERB_DATA_BY_TENSE[tense] || [];
        for (const verb of list) {
            // lemma kann in Daten als lemma ODER id stehen – beides zulassen
            if (lemma && !(verb.lemma === lemma || verb.id === lemma)) continue;

            for (const mood of moods) {
                for (const voice of voices) {
                    const key = verbKey(tense, mood, voice);
                    if (!key) continue;
                    const table = verb.forms?.[key];
                    if (!table) continue;

                    for (const p of PERSONS) {
                        for (const n of NUMBERS_VERB) {
                            const cellKey = `${p}${n.toLowerCase()}`; // "1sg", "2pl"
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
                voice: c.voice
            }
        ],
        topics: ["verb"]
    }));
}

// ===================================================
// Konjunktionen (optional)
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
// generateRound – Hauptexport
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
            if (lemma) questions = buildNounQuestions(lemma, safeNum);
            break;

        case "adj_with_noun":
            if (lemma) questions = buildAdjWithNounQuestions(lemma, safeNum);
            break;

        case "demonstratives":
            questions = buildDemonstrativeQuestions(safeNum);
            break;

        case "possessives":
            questions = buildPossessiveQuestions(safeNum);
            break;

        case "verbs":
            if (lemma) {
                questions = buildVerbQuestions(safeNum, lemma, verbSettings);
            }
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
