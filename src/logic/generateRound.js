// src/logic/generateRound.js

// ---------------------------------------------------
// Datenimporte
// ---------------------------------------------------
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

// ---------------------------------------------------
// Helfer
// ---------------------------------------------------

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// erlaubt string, array, null
function asList(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }
    return [];
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

function labelForCombo(opt) {
    if (!opt) return "";
    const c = CASE_LABELS[opt.case] || "";
    const n = NUMBER_LABELS[opt.number] || "";
    const g = GENDER_LABELS[opt.gender] || "";
    return [c, n, g].filter(Boolean).join(" ");
}

// ---------------------------------------------------
// Verb-Konfiguration
// ---------------------------------------------------

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

// Muss zu App.jsx und den JSON-Keys passen
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

// ---------------------------------------------------
// 1) Substantive – ein oder mehrere Lemmata
// ---------------------------------------------------

function buildNounQuestions(lemma, numQuestions) {
    const lemmas = asList(lemma);
    if (!lemmas.length) return [];

    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            lemmas.includes(e.lemma) &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );
    if (!entries.length) return [];

    // gleiche Form -> mehrere Deutungen (Mehrdeutigkeiten bleiben erhalten)
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
            // nur dt. Phrase; Kasus/Num/Genus kommt aus caseLabel()
            de: e.lemmaDe || ""
        });
    }

    const all = shuffle(Array.from(groupsByForm.values()));
    const take = Math.min(numQuestions, all.length);

    return all.slice(0, take).map((g, i) => ({
        id: `noun_${g.lemma}_${i}`,
        type: "noun_adj_analyze",
        prompt: g.prompt,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        topics: ["noun"]
    }));
}

// ---------------------------------------------------
// 2) Adjektiv im Kontext – Kongruenz mit Nomen
// ---------------------------------------------------

function buildAdjWithNounQuestions(adjLemma, numQuestions) {
    const lemmas = asList(adjLemma);
    if (!lemmas.length) return [];

    const nouns = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.form &&
            e.case &&
            e.number &&
            e.gender &&
            e.lemmaDe
    );
    const adjs = nounsAdjectives.filter(
        (e) =>
            e.pos === "adj" &&
            lemmas.includes(e.lemma) &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );

    if (!nouns.length || !adjs.length) return [];

    const groupsByPhrase = new Map();

    for (const n of nouns) {
        for (const a of adjs) {
            if (
                a.case === n.case &&
                a.number === n.number &&
                a.gender === n.gender
            ) {
                const phrase = `${a.form} ${n.form}`;
                if (!groupsByPhrase.has(phrase)) {
                    groupsByPhrase.set(phrase, {
                        promptNoun: n.form,
                        promptAdj: a.form,
                        lemma: a.lemma,
                        lemmaDe: a.lemmaDe,
                        correctOptions: []
                    });
                }
                groupsByPhrase.get(phrase).correctOptions.push({
                    case: a.case,
                    number: a.number,
                    gender: a.gender,
                    de: `${a.lemmaDe || ""} ${n.lemmaDe || ""}`.trim()
                });
            }
        }
    }

    const all = shuffle(Array.from(groupsByPhrase.values()));
    const take = Math.min(numQuestions, all.length);

    return all.slice(0, take).map((g, i) => ({
        id: `adjctx_${g.lemma}_${i}`,
        type: "adj_with_noun",
        promptNoun: g.promptNoun,
        promptAdj: g.promptAdj,
        prompt: `${g.promptAdj} ${g.promptNoun}`,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        topics: ["adj_with_noun"]
    }));
}

// ---------------------------------------------------
// 3) Demonstrativpronomen – Pronomen + flektiertes Nomen
// ---------------------------------------------------

function buildDemonstrativeQuestions(numQuestions, selectedDemos) {
    const demos = Array.isArray(demonstratives) ? demonstratives : [];
    if (!demos.length) return [];

    const chosen = asList(selectedDemos);
    const activeDemos = chosen.length
        ? demos.filter((d) => chosen.includes(d.lemma))
        : demos;

    const nounEntries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma &&
            e.form &&
            e.case &&
            e.number &&
            e.gender &&
            e.lemmaDe
    );

    const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
    const NUMBERS = ["Sg", "Pl"];
    const GENDERS = ["m", "f", "n"];

    const groupsByPrompt = new Map();

    for (const demo of activeDemos) {
        for (const c of CASES) {
            for (const n of NUMBERS) {
                for (const g of GENDERS) {
                    const key = `${c}_${n}_${g}`;
                    const pronForm = demo.forms?.[key];
                    const ctx = demo.contextNouns?.[g];
                    if (!pronForm || !ctx) continue;

                    const noun = nounEntries.find(
                        (nn) =>
                            nn.lemma === ctx.la &&
                            nn.case === c &&
                            nn.number === n &&
                            nn.gender === g
                    );
                    if (!noun) continue; // keine künstlichen Formen

                    const prompt = `${pronForm} ${noun.form}`;
                    const germanNoun = ctx.de || noun.lemmaDe || "";
                    const dePhrase = `${demo.lemmaDe || ""} ${germanNoun}`.trim();

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
                        de: dePhrase
                    });
                }
            }
        }
    }

    const all = shuffle(Array.from(groupsByPrompt.values()));
    const take = Math.min(numQuestions, all.length);

    return all.slice(0, take).map((g, i) => ({
        id: `demo_${g.demo.id || g.demo.lemma}_${i}`,
        type: "demonstrative",
        prompt: g.prompt,
        lemma: g.demo.lemma,
        lemmaDe: g.demo.lemmaDe,
        correctOptions: g.correctOptions,
        usage: g.usage,
        topics: g.topics
    }));
}

// ---------------------------------------------------
// 4) Possessivpronomen – Possessiv + flektiertes Nomen
// ---------------------------------------------------

function buildPossessiveQuestions(numQuestions, selectedPossessives) {
    const possList = Array.isArray(possessives) ? possessives : [];
    if (!possList.length) return [];

    const chosen = asList(selectedPossessives);
    const activePoss = chosen.length
        ? possList.filter((p) => chosen.includes(p.lemma))
        : possList;

    const nounEntries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.form &&
            e.case &&
            e.number &&
            e.gender &&
            e.lemmaDe
    );

    const groupsByPrompt = new Map();

    for (const poss of activePoss) {
        const ctx = poss.contextNouns || {};

        for (const [key, form] of Object.entries(poss.forms || {})) {
            // key: "Nom_Sg_m"
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
                de: dePhrase
            });
        }
    }

    const all = shuffle(Array.from(groupsByPrompt.values()));
    const take = Math.min(numQuestions, all.length);

    return all.slice(0, take).map((g, i) => ({
        id: `poss_${g.poss.id || g.poss.lemma}_${i}`,
        type: "possessive",
        prompt: g.prompt,
        lemma: g.poss.lemma,
        lemmaDe: g.poss.lemmaDe,
        correctOptions: g.correctOptions,
        topics: g.topics
    }));
}

// ---------------------------------------------------
// 5) Verben
// ---------------------------------------------------

function buildVerbQuestions(numQuestions, lemma, verbSettings = {}) {
    const {
        tenses = ALL_VERB_TENSES,
        moods = ["Indikativ"],
        voices = ["Aktiv"]
    } = verbSettings;

    const activeTenses = (tenses.length ? tenses : ALL_VERB_TENSES).filter(
        (t) => VERB_DATA_BY_TENSE[t]
    );

    const lemmas = asList(lemma); // erlaubt später Multi-Verb-Auswahl
    const candidates = [];

    for (const tense of activeTenses) {
        const list = VERB_DATA_BY_TENSE[tense] || [];
        for (const verb of list) {
            if (lemmas.length && !lemmas.includes(verb.lemma)) continue;

            for (const mood of moods) {
                for (const voice of voices) {
                    const key = verbKey(tense, mood, voice);
                    if (!key) continue;
                    const table = verb.forms?.[key];
                    if (!table) continue;

                    for (const p of PERSONS) {
                        for (const n of NUMBERS_VERB) {
                            const cellKey = `${p}${n.toLowerCase()}`; // "1sg"
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
                de: c.de
            }
        ],
        topics: ["verb"]
    }));
}

// ---------------------------------------------------
// 6) Konjunktionen
// ---------------------------------------------------

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

// ---------------------------------------------------
// 7) generateRound – Haupteinstieg
// ---------------------------------------------------

export function generateRound({
    category,
    numQuestions,
    lemma = null,
    verbSettings = {},
    selectedDemos = null,
    selectedPossessives = null
}) {
    const safeNum =
        typeof numQuestions === "number" && numQuestions > 0
            ? numQuestions
            : 5;

    let questions = [];

    switch (category) {
        case "nouns":
            questions = buildNounQuestions(lemma, safeNum);
            break;

        case "adj_with_noun":
            questions = buildAdjWithNounQuestions(lemma, safeNum);
            break;

        case "demonstratives":
            questions = buildDemonstrativeQuestions(safeNum, selectedDemos);
            break;

        case "possessives":
            questions = buildPossessiveQuestions(safeNum, selectedPossessives);
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
