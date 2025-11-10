// src/logic/generateRound.js

// ========= Daten =========
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

// ========= kleine Utilities =========
const CASE_LABELS = {
    Nom: "Nominativ",
    Gen: "Genitiv",
    Dat: "Dativ",
    Akk: "Akkusativ",
    Abl: "Ablativ",
    Vok: "Vokativ",
};
const NUMBER_LABELS = { Sg: "Singular", Pl: "Plural" };
const GENDER_LABELS = { m: "maskulin", f: "feminin", n: "neutrum" };

function labelForCombo({ case: c, number: n, gender: g }) {
    const cc = CASE_LABELS[c] || c || "";
    const nn = NUMBER_LABELS[n] || n || "";
    const gg = GENDER_LABELS[g] || g || "";
    return [cc, nn, gg].filter(Boolean).join(" ");
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Akzeptiert lemma (String) ODER lemmas (Array). Gibt ein Set zurück oder null (= kein Filter).
function toLemmaFilterSet(lemma, lemmas) {
    if (Array.isArray(lemmas) && lemmas.length) {
        return new Set(lemmas.map(String));
    }
    if (typeof lemma === "string" && lemma.trim()) {
        return new Set([lemma.trim()]);
    }
    return null;
}

// ========= Verben-Konfiguration =========
const VERB_DATA_BY_TENSE = {
    Praesens: verbsPraesens,
    Imperfekt: verbsImperfekt,
    Perfekt: verbsPerfekt,
    Plusquamperfekt: verbsPlusquamperfekt,
    "Futur I": verbsFutur1,
    "Futur II": verbsFutur2,
};

const ALL_VERB_TENSES = [
    "Praesens",
    "Imperfekt",
    "Perfekt",
    "Plusquamperfekt",
    "Futur I",
    "Futur II",
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

// ========= Substantive =========
function buildNounQuestions(lemmaFilter, numQuestions) {
    // Filter: kein Set => ALLE; sonst nur Lemma im Set
    const entries = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.lemma &&
            (!lemmaFilter || lemmaFilter.has(e.lemma)) &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );
    if (!entries.length) return [];

    // gleiche Form kann mehrere Analysen haben (Mehrdeutigkeiten)
    const groupsByForm = new Map();
    for (const e of entries) {
        const form = e.form;
        if (!groupsByForm.has(form)) {
            groupsByForm.set(form, {
                prompt: form,
                lemma: e.lemma,
                lemmaDe: e.lemmaDe,
                correctOptions: [],
            });
        }
        groupsByForm.get(form).correctOptions.push({
            case: e.case,
            number: e.number,
            gender: e.gender,
            de: e.de || labelForCombo(e),
        });
    }

    const grouped = shuffle([...groupsByForm.values()]);
    const take = Math.min(numQuestions, grouped.length);
    return grouped.slice(0, take).map((g, i) => ({
        id: `noun_${g.lemma}_${i}`,
        type: "noun_adj_analyze",
        prompt: g.prompt,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        topics: ["noun"],
    }));
}

// ========= Adjektive: a-/o-Stämme (Basis) =========
function buildAdjForm(lemma, pattern, case_, number, gender) {
    const endings = {
        m: {
            Sg: { Nom: "us", Gen: "i", Dat: "o", Akk: "um", Abl: "o" },
            Pl: { Nom: "i", Gen: "orum", Dat: "is", Akk: "os", Abl: "is" },
        },
        f: {
            Sg: { Nom: "a", Gen: "ae", Dat: "ae", Akk: "am", Abl: "a" },
            Pl: { Nom: "ae", Gen: "arum", Dat: "is", Akk: "as", Abl: "is" },
        },
        n: {
            Sg: { Nom: "um", Gen: "i", Dat: "o", Akk: "um", Abl: "o" },
            Pl: { Nom: "a", Gen: "orum", Dat: "is", Akk: "a", Abl: "is" },
        },
    };
    const end = endings[gender]?.[number]?.[case_];
    if (!end) return null;

    // Standard: -us, -a, -um
    if (!pattern || pattern === "regular") {
        if (lemma.endsWith("us")) return lemma.replace(/us$/, "") + end;
        if (lemma.endsWith("er")) return lemma.replace(/er$/, "") + end; // minimal
        return lemma + end; // fallback
    }

    if (pattern === "pulcher") {
        if (gender === "m" && number === "Sg" && case_ === "Nom") return "pulcher";
        return "pulchr" + end;
    }
    if (pattern === "liber") {
        if (gender === "m" && number === "Sg" && case_ === "Nom") return "liber";
        return "libr" + end;
    }
    return null;
}

// ========= Adjektiv im Kontext =========
// robust: wir verwenden ALLE vorhandenen flektierten Nomen (keine lemmaDe-Pflicht),
// bilden dazu die passende Adjektivform, und nehmen nur echte Kongruenz-Paare.
function buildAdjWithNounQuestions(adjLemmaFilter, numQuestions) {
    // adjLemmaFilter ist Set oder null (null => alle Adjektive erlaubt)
    const adjLemmata = new Set(
        nounsAdjectives
            .filter((e) => e.pos === "adj")
            .map((e) => e.lemma)
    );
    // Falls du explizit auswählen willst: nur die ausgewählten Adjektive
    const targetAdjLemmata =
        adjLemmaFilter && adjLemmaFilter.size
            ? [...adjLemmaFilter].filter((l) => adjLemmata.has(l))
            : [...adjLemmata];

    if (!targetAdjLemmata.length) return [];

    const nounForms = nounsAdjectives.filter(
        (e) =>
            e.pos === "noun" &&
            e.form &&
            e.case &&
            e.number &&
            e.gender
    );
    if (!nounForms.length) return [];

    const groups = new Map();

    for (const adjLemma of targetAdjLemmata) {
        const adjBase =
            nounsAdjectives.find((e) => e.pos === "adj" && e.lemma === adjLemma) ||
            null;
        if (!adjBase) continue;

        const pattern = adjBase.pattern || "regular";

        for (const n of nounForms) {
            const adjForm = buildAdjForm(adjBase.lemma, pattern, n.case, n.number, n.gender);
            if (!adjForm) continue;

            const phrase = `${adjForm} ${n.form}`;
            if (!groups.has(phrase)) {
                groups.set(phrase, {
                    prompt: phrase,
                    promptAdj: adjForm,
                    promptNoun: n.form,
                    lemma: adjBase.lemma,
                    lemmaDe: adjBase.lemmaDe,
                    correctOptions: [],
                });
            }
            groups.get(phrase).correctOptions.push({
                case: n.case,
                number: n.number,
                gender: n.gender,
                de: `${labelForCombo(n)} – ${adjBase.lemmaDe || ""} ${n.lemmaDe || ""}`.trim(),
            });
        }
    }

    const grouped = shuffle([...groups.values()]);
    const take = Math.min(numQuestions, grouped.length);
    return grouped.slice(0, take).map((g, i) => ({
        id: `adjctx_${g.lemma}_${i}`,
        type: "adj_with_noun",
        prompt: g.prompt,
        promptAdj: g.promptAdj,
        promptNoun: g.promptNoun,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        topics: ["adj_with_noun"],
    }));
}

// ========= Mini-Nomen-Flexer (für Demo/Possessiv-Kontext) =========
// Unterstützt femina (a-Dekl.), vir (o-Dekl. vir-Typ), templum (o-Dekl. neutrum)
function flexSimpleNoun(lemma, gender, case_, number) {
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
    return null;
}

// ========= Demonstrativa =========
function buildDemonstrativeQuestions(numQuestions, lemmaFilter) {
    const list = Array.isArray(demonstratives) ? demonstratives : [];
    // nach Auswahl filtern (wenn vorhanden)
    const demos = lemmaFilter
        ? list.filter((d) => lemmaFilter.has(d.lemma))
        : list;

    if (!demos.length) return [];

    const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
    const NUMBERS = ["Sg", "Pl"];
    const GENDERS = ["m", "f", "n"];

    const groups = new Map();

    for (const demo of demos) {
        const ctx = demo.contextNouns || {};

        for (const c of CASES) {
            for (const n of NUMBERS) {
                for (const g of GENDERS) {
                    const key = `${c}_${n}_${g}`;
                    const pronForm = demo.forms?.[key];
                    const ctxNoun = ctx[g];
                    if (!pronForm || !ctxNoun) continue;

                    const nounForm = flexSimpleNoun(ctxNoun.la, g, c, n);
                    if (!nounForm) continue;

                    const prompt = `${pronForm} ${nounForm}`;

                    if (!groups.has(prompt)) {
                        groups.set(prompt, {
                            prompt,
                            demo,
                            usage: demo.usage,
                            correctOptions: [],
                            topics: ["demonstrative"],
                        });
                    }
                    groups.get(prompt).correctOptions.push({
                        case: c,
                        number: n,
                        gender: g,
                        de: `${labelForCombo({ case: c, number: n, gender: g })} – ${demo.lemmaDe || ""} ${ctxNoun.de || ""}`.trim(),
                    });
                }
            }
        }
    }

    const grouped = shuffle([...groups.values()]);
    const take = Math.min(numQuestions, grouped.length);
    return grouped.slice(0, take).map((g, i) => ({
        id: `demo_${g.demo.id}_${i}`,
        type: "demonstrative",
        prompt: g.prompt,
        lemma: g.demo.lemma,
        lemmaDe: g.demo.lemmaDe,
        correctOptions: g.correctOptions,
        usage: g.usage,
        topics: g.topics,
    }));
}

// ========= Possessiva =========
function buildPossessiveQuestions(numQuestions, lemmaFilter) {
    const list = Array.isArray(possessives) ? possessives : [];
    const poss = lemmaFilter
        ? list.filter((p) => lemmaFilter.has(p.lemma))
        : list;

    if (!poss.length) return [];

    const groups = new Map();

    for (const p of poss) {
        const ctx = p.contextNouns || {};

        for (const [key, form] of Object.entries(p.forms || {})) {
            const [c, n, g] = key.split("_");
            if (!form || !c || !n || !g) continue;

            const ctxNoun = ctx[g];
            if (!ctxNoun) continue;

            const nounForm = flexSimpleNoun(ctxNoun.la, g, c, n);
            if (!nounForm) continue;

            const prompt = `${form} ${nounForm}`;

            if (!groups.has(prompt)) {
                groups.set(prompt, {
                    prompt,
                    poss: p,
                    correctOptions: [],
                    topics: ["possessive"],
                });
            }
            groups.get(prompt).correctOptions.push({
                case: c,
                number: n,
                gender: g,
                de: `${labelForCombo({ case: c, number: n, gender: g })} – ${p.lemmaDe || ""} ${ctxNoun.de || ""}`.trim(),
            });
        }
    }

    const grouped = shuffle([...groups.values()]);
    const take = Math.min(numQuestions, grouped.length);
    return grouped.slice(0, take).map((g, i) => ({
        id: `poss_${g.poss.id}_${i}`,
        type: "possessive",
        prompt: g.prompt,
        lemma: g.poss.lemma,
        lemmaDe: g.poss.lemmaDe,
        correctOptions: g.correctOptions,
        topics: g.topics,
    }));
}

// ========= Verben =========
function buildVerbQuestions(numQuestions, lemmaFilter, verbSettings = {}) {
    const {
        tenses = ALL_VERB_TENSES,
        moods = ["Indikativ"],
        voices = ["Aktiv"],
    } = verbSettings;

    const activeTenses = (tenses.length ? tenses : ALL_VERB_TENSES).filter(
        (t) => VERB_DATA_BY_TENSE[t] && VERB_DATA_BY_TENSE[t].length
    );
    if (!activeTenses.length) return [];

    const candidates = [];

    for (const tense of activeTenses) {
        const list = VERB_DATA_BY_TENSE[tense] || [];
        for (const verb of list) {
            // Filter nach Auswahl (lemma ODER id zulassen)
            const allow =
                !lemmaFilter ||
                lemmaFilter.has(verb.lemma) ||
                (verb.id && lemmaFilter.has(verb.id));
            if (!allow) continue;

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
                                voice,
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
            },
        ],
        topics: ["verb"],
    }));
}

// ========= Konjunktionen =========
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
            explanation: c.explanation,
        },
        topics: ["conjunction"],
    }));
}

// ========= Hauptexport =========
export function generateRound({
    category,
    numQuestions,
    // rückwärtskompatibel:
    lemma = null,   // String
    lemmas = null,  // Array<string>
    verbSettings = {},
}) {
    const safeNum = typeof numQuestions === "number" && numQuestions > 0 ? numQuestions : 5;
    const filterSet = toLemmaFilterSet(lemma, lemmas); // null => kein Filter

    let questions = [];

    switch (category) {
        case "nouns":
            questions = buildNounQuestions(filterSet, safeNum);
            break;

        case "adj_with_noun":
            questions = buildAdjWithNounQuestions(filterSet, safeNum);
            break;

        case "demonstratives":
            questions = buildDemonstrativeQuestions(safeNum, filterSet);
            break;

        case "possessives":
            questions = buildPossessiveQuestions(safeNum, filterSet);
            break;

        case "verbs":
            questions = buildVerbQuestions(safeNum, filterSet, verbSettings);
            break;

        case "conjunctions":
            questions = buildConjunctionQuestions(safeNum);
            break;

        default:
            questions = [];
    }

    return {
        category,
        // für Debug/Transparenz beide zurückgeben:
        lemma: lemma || null,
        lemmas: Array.isArray(lemmas) ? lemmas : null,
        numQuestions: safeNum,
        questions,
    };
}
