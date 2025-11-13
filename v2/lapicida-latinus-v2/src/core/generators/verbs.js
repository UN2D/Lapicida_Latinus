// src/core/generators/verbs.js
// Verb-Runden-Generator v1
// - Mehrfach-Lemmata (laudare, videre, capere, mittere, audire, + esse/posse/ire/ferre/velle/nolle/malle/fieri)
// - Zeiten: Praesens, Perfekt
// - Modi: Indikativ, Konjunktiv, Imperativ
// - Diathese: Aktiv, Passiv (Imperativ nur Aktiv)
// - Gleichmäßige Verteilung über gewählte Lemmata
// - Bei "ire": jede 2. Aufgabe ein Kompositum (ad/ex/in/re/transire)
// - Bei "esse": 25% Kompositum (ab/ads/de/inter/prodesse)
import PRAES from "../../data/verbs_praesens.json";
import PERF from "../../data/verbs_perfekt.json";

const BANK = {
    "Praesens": PRAES,
    "Perfekt": PERF
    // später: "Imperfekt": IMPF, ...
};

const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];
const TENSES = Object.keys(BANK);

// Utility: sichere Liste
function asList(v) { return Array.isArray(v) ? v : (v ? [v] : []); }

// Map -> schönes Label (immer ausgeschrieben)
export function formatVerbSpec(opt) {
    const numFull = opt.number === "Sg" ? "Singular" : "Plural";
    return `${opt.person}. Person ${numFull} ${opt.mood} ${opt.voice} ${opt.tense}`;
}

const shuffle = (a) => {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function evenSplitPick(pools, target) {
    const out = [];
    let i = 0;
    while (out.length < target && pools.some((p) => p.length)) {
        const p = pools[i % pools.length];
        if (p.length) out.push(p.shift());
        i++;
    }
    return out;
}

/**
 * Erwartetes Datenformat in verbs.json:
 * [
 *  {
 *    "lemma": "laudare",
 *    "lemmaDe": "loben",
 *    "forms": {
 *       "Praesens": {
 *         "Indikativ": {
 *           "Aktiv": { "1Sg": "laudo", "2Sg":"laudas", ... "3Pl":"laudant" },
 *           "Passiv": { ... }
 *         },
 *         "Konjunktiv": {...},
 *         "Imperativ": {...} // hier typischerweise nur 2Sg/2Pl sinnvoll
 *       },
 *       "Perfekt": { ... },
 *       ...
 *    },
 *    "notes": ["eunt (nicht iunt)", ...]  // optional: Merksätze, Hilfen
 *  },
 *  ...
 * ]
 */

const LEMMA_META = {
    laudare: { de: "loben" },
    videre: { de: "sehen" },
    capere: { de: "ergreifen" },
    mittere: { de: "schicken" },
    audire: { de: "hören" },
    esse: { de: "sein" },
    posse: { de: "können" },
    ire: { de: "gehen" },
    ferre: { de: "tragen" },
    velle: { de: "wollen" },
    nolle: { de: "nicht wollen" },
    malle: { de: "lieber wollen" },
    fieri: { de: "werden/geschehen" },
};

const REG = {
    laudare: {
        Praesens: {
            Indikativ: {
                Aktiv: { "1|Sg": "laudo", "2|Sg": "laudas", "3|Sg": "laudat", "1|Pl": "laudamus", "2|Pl": "laudatis", "3|Pl": "laudant" },
                Passiv: { "1|Sg": "laudor", "2|Sg": "laudaris", "3|Sg": "laudatur", "1|Pl": "laudamur", "2|Pl": "laudamini", "3|Pl": "laudantur" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "laudem", "2|Sg": "laudes", "3|Sg": "laudet", "1|Pl": "laudemus", "2|Pl": "laudetis", "3|Pl": "laudent" },
                Passiv: { "1|Sg": "lauder", "2|Sg": "lauderis", "3|Sg": "laudetur", "1|Pl": "laudemur", "2|Pl": "laudemini", "3|Pl": "laudentur" },
            },
            Imperativ: { Aktiv: { "2|Sg": "lauda", "2|Pl": "laudate" } },
        },
        Perfekt: {
            Indikativ: {
                Aktiv: { "1|Sg": "laudavi", "2|Sg": "laudavisti", "3|Sg": "laudavit", "1|Pl": "laudavimus", "2|Pl": "laudavistis", "3|Pl": "laudaverunt" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "laudaverim", "2|Sg": "laudaveris", "3|Sg": "laudaverit", "1|Pl": "laudaverimus", "2|Pl": "laudaveritis", "3|Pl": "laudaverint" },
            },
        },
    },
    videre: {
        Praesens: {
            Indikativ: {
                Aktiv: { "1|Sg": "video", "2|Sg": "vides", "3|Sg": "videt", "1|Pl": "videmus", "2|Pl": "videtis", "3|Pl": "vident" },
                Passiv: { "1|Sg": "videor", "2|Sg": "videris", "3|Sg": "videtur", "1|Pl": "videmur", "2|Pl": "videmini", "3|Pl": "videntur" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "videam", "2|Sg": "videas", "3|Sg": "videat", "1|Pl": "videamus", "2|Pl": "videatis", "3|Pl": "videant" },
                Passiv: { "1|Sg": "videar", "2|Sg": "videaris", "3|Sg": "videatur", "1|Pl": "videamur", "2|Pl": "videamini", "3|Pl": "videantur" },
            },
            Imperativ: { Aktiv: { "2|Sg": "vide", "2|Pl": "videte" } },
        },
        Perfekt: {
            Indikativ: {
                Aktiv: { "1|Sg": "vidi", "2|Sg": "vidisti", "3|Sg": "vidit", "1|Pl": "vidimus", "2|Pl": "vidistis", "3|Pl": "viderunt" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "viderim", "2|Sg": "videris", "3|Sg": "viderit", "1|Pl": "viderimus", "2|Pl": "videritis", "3|Pl": "viderint" },
            },
        },
    },
    mittere: {
        Praesens: {
            Indikativ: {
                Aktiv: { "1|Sg": "mitto", "2|Sg": "mittis", "3|Sg": "mittit", "1|Pl": "mittimus", "2|Pl": "mittitis", "3|Pl": "mittunt" },
                Passiv: { "1|Sg": "mittor", "2|Sg": "mitteris", "3|Sg": "mittitur", "1|Pl": "mittimur", "2|Pl": "mittimini", "3|Pl": "mittuntur" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "mittam", "2|Sg": "mittas", "3|Sg": "mittat", "1|Pl": "mittamus", "2|Pl": "mittatis", "3|Pl": "mittant" },
                Passiv: { "1|Sg": "mittar", "2|Sg": "mittaris", "3|Sg": "mittatur", "1|Pl": "mittamur", "2|Pl": "mittamini", "3|Pl": "mittantur" },
            },
            Imperativ: { Aktiv: { "2|Sg": "mitte", "2|Pl": "mittite" } },
        },
        Perfekt: {
            Indikativ: {
                Aktiv: { "1|Sg": "misi", "2|Sg": "misisti", "3|Sg": "misit", "1|Pl": "misimus", "2|Pl": "misistis", "3|Pl": "miserunt" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "miserim", "2|Sg": "miseris", "3|Sg": "miserit", "1|Pl": "miserimus", "2|Pl": "miseritis", "3|Pl": "miserint" },
            },
        },
    },
    capere: {
        Praesens: {
            Indikativ: {
                Aktiv: { "1|Sg": "capio", "2|Sg": "capis", "3|Sg": "capit", "1|Pl": "capimus", "2|Pl": "capitis", "3|Pl": "capiunt" },
                Passiv: { "1|Sg": "capior", "2|Sg": "caperis", "3|Sg": "capitur", "1|Pl": "capimur", "2|Pl": "capimini", "3|Pl": "capiuntur" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "capiam", "2|Sg": "capias", "3|Sg": "capiat", "1|Pl": "capiamus", "2|Pl": "capiatis", "3|Pl": "capiant" },
                Passiv: { "1|Sg": "capiar", "2|Sg": "capiaris", "3|Sg": "capiatur", "1|Pl": "capiamur", "2|Pl": "capiamini", "3|Pl": "capiantur" },
            },
            Imperativ: { Aktiv: { "2|Sg": "cape", "2|Pl": "capite" } },
        },
        Perfekt: {
            Indikativ: {
                Aktiv: { "1|Sg": "cepi", "2|Sg": "cepisti", "3|Sg": "cepit", "1|Pl": "cepimus", "2|Pl": "cepistis", "3|Pl": "ceperunt" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "ceperim", "2|Sg": "ceperis", "3|Sg": "ceperit", "1|Pl": "ceperimus", "2|Pl": "ceperitis", "3|Pl": "ceperint" },
            },
        },
    },
    audire: {
        Praesens: {
            Indikativ: {
                Aktiv: { "1|Sg": "audio", "2|Sg": "audis", "3|Sg": "audit", "1|Pl": "audimus", "2|Pl": "auditis", "3|Pl": "audiunt" },
                Passiv: { "1|Sg": "audior", "2|Sg": "audiris", "3|Sg": "auditur", "1|Pl": "audimur", "2|Pl": "audimini", "3|Pl": "audiuntur" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "audiam", "2|Sg": "audias", "3|Sg": "audiat", "1|Pl": "audiamus", "2|Pl": "audiatis", "3|Pl": "audiant" },
                Passiv: { "1|Sg": "audiar", "2|Sg": "audiaris", "3|Sg": "audiatur", "1|Pl": "audiamur", "2|Pl": "audiamini", "3|Pl": "audiantur" },
            },
            Imperativ: { Aktiv: { "2|Sg": "audi", "2|Pl": "audite" } },
        },
        Perfekt: {
            Indikativ: {
                Aktiv: { "1|Sg": "audivi", "2|Sg": "audivisti", "3|Sg": "audivit", "1|Pl": "audivimus", "2|Pl": "audivistis", "3|Pl": "audiverunt" },
            },
            Konjunktiv: {
                Aktiv: { "1|Sg": "audiverim", "2|Sg": "audiveris", "3|Sg": "audiverit", "1|Pl": "audiverimus", "2|Pl": "audiveritis", "3|Pl": "audiverint" },
            },
        },
    },
};

const IRR = {
    esse: {
        Praesens: {
            Indikativ: { Aktiv: { "1|Sg": "sum", "2|Sg": "es", "3|Sg": "est", "1|Pl": "sumus", "2|Pl": "estis", "3|Pl": "sunt" } },
            Konjunktiv: { Aktiv: { "1|Sg": "sim", "2|Sg": "sis", "3|Sg": "sit", "1|Pl": "simus", "2|Pl": "sitis", "3|Pl": "sint" } },
            Imperativ: { Aktiv: { "2|Sg": "es", "2|Pl": "este" } },
        },
        Perfekt: {
            Indikativ: { Aktiv: { "1|Sg": "fui", "2|Sg": "fuisti", "3|Sg": "fuit", "1|Pl": "fuimus", "2|Pl": "fuistis", "3|Pl": "fuerunt" } },
            Konjunktiv: { Aktiv: { "1|Sg": "fuerim", "2|Sg": "fueris", "3|Sg": "fuerit", "1|Pl": "fuerimus", "2|Pl": "fueritis", "3|Pl": "fuerint" } },
        },
    },
    posse: {
        Praesens: {
            Indikativ: { Aktiv: { "1|Sg": "possum", "2|Sg": "potes", "3|Sg": "potest", "1|Pl": "possumus", "2|Pl": "potestis", "3|Pl": "possunt" } },
            Konjunktiv: { Aktiv: { "1|Sg": "possim", "2|Sg": "possis", "3|Sg": "possit", "1|Pl": "possimus", "2|Pl": "possitis", "3|Pl": "possint" } },
        },
        Perfekt: {
            Indikativ: { Aktiv: { "1|Sg": "potui", "2|Sg": "potuisti", "3|Sg": "potuit", "1|Pl": "potuimus", "2|Pl": "potuistis", "3|Pl": "potuerunt" } },
        },
    },
    ire: {
        Praesens: {
            Indikativ: { Aktiv: { "1|Sg": "eo", "2|Sg": "is", "3|Sg": "it", "1|Pl": "imus", "2|Pl": "itis", "3|Pl": "eunt" } },
            Konjunktiv: { Aktiv: { "1|Sg": "eam", "2|Sg": "eas", "3|Sg": "eat", "1|Pl": "eamus", "2|Pl": "eatis", "3|Pl": "eant" } },
            Imperativ: { Aktiv: { "2|Sg": "i", "2|Pl": "ite" } },
        },
        Perfekt: {
            Indikativ: { Aktiv: { "1|Sg": "ii", "2|Sg": "isti", "3|Sg": "iit", "1|Pl": "iimus", "2|Pl": "iistis", "3|Pl": "ierunt" } },
        },
    },
    ferre: {
        Praesens: {
            Indikativ: {
                Aktiv: { "1|Sg": "fero", "2|Sg": "fers", "3|Sg": "fert", "1|Pl": "ferimus", "2|Pl": "fertis", "3|Pl": "ferunt" },
                Passiv: { "1|Sg": "feror", "2|Sg": "ferris", "3|Sg": "fertur", "1|Pl": "ferimur", "2|Pl": "ferimini", "3|Pl": "feruntur" },
            },
            Imperativ: { Aktiv: { "2|Sg": "fer", "2|Pl": "ferte" } },
        },
        Perfekt: {
            Indikativ: { Aktiv: { "1|Sg": "tuli", "2|Sg": "tulisti", "3|Sg": "tulit", "1|Pl": "tulimus", "2|Pl": "tulistis", "3|Pl": "tulerunt" } },
        },
    },
    velle: {
        Praesens: { Indikativ: { Aktiv: { "1|Sg": "volo", "2|Sg": "vis", "3|Sg": "vult", "1|Pl": "volumus", "2|Pl": "vultis", "3|Pl": "volunt" } } },
        Perfekt: { Indikativ: { Aktiv: { "1|Sg": "volui", "2|Sg": "voluisti", "3|Sg": "voluit", "1|Pl": "voluimus", "2|Pl": "voluistis", "3|Pl": "voluerunt" } } },
    },
    nolle: {
        Praesens: {
            Indikativ: { Aktiv: { "1|Sg": "nolo", "2|Sg": "non vis", "3|Sg": "non vult", "1|Pl": "nolumus", "2|Pl": "non vultis", "3|Pl": "nolunt" } },
            Imperativ: { Aktiv: { "2|Sg": "noli", "2|Pl": "nolite" } },
        },
        Perfekt: { Indikativ: { Aktiv: { "1|Sg": "nolui", "2|Sg": "noluisti", "3|Sg": "noluit", "1|Pl": "noluimus", "2|Pl": "noluistis", "3|Pl": "noluerunt" } } },
    },
    malle: {
        Praesens: { Indikativ: { Aktiv: { "1|Sg": "malo", "2|Sg": "mavis", "3|Sg": "mavult", "1|Pl": "malumus", "2|Pl": "mavultis", "3|Pl": "malunt" } } },
        Perfekt: { Indikativ: { Aktiv: { "1|Sg": "malui", "2|Sg": "maluisti", "3|Sg": "maluit", "1|Pl": "maluimus", "2|Pl": "maluistis", "3|Pl": "maluerunt" } } },
    },
    fieri: {
        Praesens: {
            Indikativ: { Aktiv: { "1|Sg": "fio", "2|Sg": "fis", "3|Sg": "fit", "1|Pl": "fimus", "2|Pl": "fitis", "3|Pl": "fiunt" } },
            Konjunktiv: { Aktiv: { "1|Sg": "fiam", "2|Sg": "fias", "3|Sg": "fiat", "1|Pl": "fiamus", "2|Pl": "fiatis", "3|Pl": "fiant" } },
        },
        Perfekt: {
            Indikativ: { Aktiv: { "1|Sg": "factus sum", "2|Sg": "factus es", "3|Sg": "factus est", "1|Pl": "facti sumus", "2|Pl": "facti estis", "3|Pl": "facti sunt" } },
        },
    },
};

const IRE_COMPOUNDS = [
    {
        key: "adire", de: "herangehen/aufsuchen",
        P: { "1|Sg": "adeo", "2|Sg": "adis", "3|Sg": "adit", "1|Pl": "adimus", "2|Pl": "aditis", "3|Pl": "adeunt" },
        I: { "2|Sg": "adi", "2|Pl": "adite" },
        F: { "1|Sg": "adii", "2|Sg": "adiisti", "3|Sg": "adiit", "1|Pl": "adiimus", "2|Pl": "adiistis", "3|Pl": "adierunt" }
    },
    {
        key: "exire", de: "hinausgehen",
        P: { "1|Sg": "exeo", "2|Sg": "exis", "3|Sg": "exit", "1|Pl": "eximus", "2|Pl": "exitis", "3|Pl": "exeunt" },
        I: { "2|Sg": "exi", "2|Pl": "exite" },
        F: { "1|Sg": "exii", "2|Sg": "existi", "3|Sg": "exiit", "1|Pl": "exiimus", "2|Pl": "exiistis", "3|Pl": "exierunt" }
    },
    {
        key: "inire", de: "hineingehen/beginnen",
        P: { "1|Sg": "ineo", "2|Sg": "inis", "3|Sg": "init", "1|Pl": "inimus", "2|Pl": "initis", "3|Pl": "ineunt" },
        I: { "2|Sg": "ini", "2|Pl": "inite" },
        F: { "1|Sg": "inii", "2|Sg": "inisti", "3|Sg": "iniit", "1|Pl": "iniimus", "2|Pl": "iniistis", "3|Pl": "inierunt" }
    },
    {
        key: "redire", de: "zurückkehren",
        P: { "1|Sg": "redeo", "2|Sg": "redis", "3|Sg": "redit", "1|Pl": "redimus", "2|Pl": "reditis", "3|Pl": "redeunt" },
        I: { "2|Sg": "redi", "2|Pl": "redite" },
        F: { "1|Sg": "redii", "2|Sg": "redisti", "3|Sg": "rediit", "1|Pl": "rediimus", "2|Pl": "rediistis", "3|Pl": "redierunt" }
    },
    {
        key: "transire", de: "hinübergehen/überqueren",
        P: { "1|Sg": "transeo", "2|Sg": "transis", "3|Sg": "transit", "1|Pl": "transimus", "2|Pl": "transitis", "3|Pl": "transeunt" },
        I: { "2|Sg": "transi", "2|Pl": "transite" },
        F: { "1|Sg": "transii", "2|Sg": "transisti", "3|Sg": "transiit", "1|Pl": "transiimus", "2|Pl": "transiistis", "3|Pl": "transierunt" }
    },
];

const ESSE_COMPOUNDS = [
    { key: "abesse", de: "abwesend sein" },
    { key: "adesse", de: "dabeisein; beistehen" },
    { key: "deesse", de: "fehlen" },
    { key: "interesse", de: "teilnehmen; wichtig sein" },
    { key: "prodesse", de: "nützen" },
];

function getBankEntry(lemmaKey, tense, mood, voice) {
    const base = (REG[lemmaKey] || IRR[lemmaKey] || {})[tense] || {};
    const m = base[mood] || {};
    return m[voice] || {};
}
function availablePNKeys(map) {
    return Object.keys(map).filter((k) => !!map[k]);
}
function deLabel(tense, mood, voice) {
    const t = tense === "Praesens" ? "Präsens" : "Perfekt";
    return `${t} ${mood} ${voice}`;
}
const DE_PRON = {
    "1|Sg": "ich", "2|Sg": "du", "3|Sg": "er/sie/es",
    "1|Pl": "wir", "2|Pl": "ihr", "3|Pl": "sie",
};
function renderDeClause(_lemmaDe, formDe, pnKey) {
    const subj = DE_PRON[pnKey] || "";
    return subj ? `${subj} ${formDe}` : formDe;
}
function promptDe(lemmaShown, form) {
    if (lemmaShown === "nolle" && (form === "noli" || form === "nolite")) return "nicht (tun)";
    return form;
}
function sampleSentence(lemmaShown, _de, tense, _mood, _voice, pnKey) {
    const n = pnKey.endsWith("|Pl") ? "Pl" : "Sg";
    if (lemmaShown === "ire" || IRE_COMPOUNDS.some((c) => c.key === lemmaShown)) {
        return n === "Pl" ? "Rōmam eunt." : "Rōmam it.";
    }
    if (lemmaShown === "ferre") return n === "Pl" ? "Librōs ferimus." : "Librum fers.";
    if (lemmaShown === "posse") return "Venire possum.";
    if (lemmaShown === "nolle") return "Noli timere!";
    if (lemmaShown === "esse") return n === "Pl" ? "Romae sumus." : "Romae sum.";
    if (lemmaShown === "prodesse") return "Amicīs prodest.";
    if (lemmaShown === "adesse") return "Amicīs adest.";
    if (lemmaShown === "interesse") return "Mea interest.";
    if (lemmaShown === "fieri") return "Rex fit.";
    return "—";
}
function helperTable(lemmaShown, lemmaDe, tense, mood, voice, formsMap) {
    const title = `Formenübersicht zu ${lemmaShown} – ${lemmaDe} (${tense}, ${mood}${voice ? `, ${voice}` : ""})`;
    const rows = PERSONS.map((pp) => {
        const sg = formsMap[`${pp}|Sg`] || "—";
        const pl = formsMap[`${pp}|Pl`] || "—";
        return { person: `${pp}.`, singular: sg, plural: pl };
    });
    return { title, rows };
}

let ireToggle = 0;

export function buildVerbQuestions({ lemmas, numQuestions, filters }) {
    const allowTenses = asList(filters?.tenses).length ? filters.tenses : TENSES;
    const allowMoods = asList(filters?.moods).length ? filters.moods : MOODS;
    const allowVoices = asList(filters?.voices).length ? filters.voices : VOICES;

    const lemmaSet = new Set(asList(lemmas));
    const wantedAll = lemmaSet.size === 0;

    const candidates = [];

    for (const tense of allowTenses) {
        const rows = BANK[tense] || [];
        for (const row of rows) {
            if (!wantedAll && !lemmaSet.has(row.lemma)) continue;
            if (!allowMoods.includes(row.mood)) continue;
            if (!allowVoices.includes(row.voice)) continue;

            for (const person of PERSONS) {
                for (const number of NUMBERS) {
                    const key = `${person}${number}`;
                    const form = row.forms?.[key];
                    if (!form) continue;

                    candidates.push({
                        id: `verb_${row.lemma}_${tense}_${row.mood}_${row.voice}_${key}`,
                        type: "verb",
                        prompt: form,
                        lemma: row.lemma,
                        lemmaDe: row.lemmaDe,
                        correctOptions: [{ person, number, tense, mood: row.mood, voice: row.voice }],
                        helpParadigm: [
                            { label: "1. Person", singular: row.forms["1Sg"] || "", plural: row.forms["1Pl"] || "" },
                            { label: "2. Person", singular: row.forms["2Sg"] || "", plural: row.forms["2Pl"] || "" },
                            { label: "3. Person", singular: row.forms["3Sg"] || "", plural: row.forms["3Pl"] || "" }
                        ],
                        helpTitle: `${row.lemma} – ${row.lemmaDe} (${row.mood} ${row.voice} ${tense})`,
                        topics: ["verb"]
                    });
                }
            }
        }
    }

    if (!candidates.length) return [];

    // faire Round-Robin-Verteilung über Lemmata
    const byLemma = new Map();
    for (const c of candidates) {
        if (!byLemma.has(c.lemma)) byLemma.set(c.lemma, []);
        byLemma.get(c.lemma).push(c);
    }
    for (const arr of byLemma.values()) arr.sort(() => Math.random() - 0.5);

    const buckets = Array.from(byLemma.values());
    const out = [];
    let i = 0;
    while (out.length < numQuestions && buckets.some(b => b.length)) {
        const b = buckets[i % buckets.length];
        if (b.length) out.push(b.shift());
        i++;
    }
    return out;
}

// baut kleine Personen-Tabelle für die Hilfe
function buildParadigmForBlock(voiceBlock) {
    // voiceBlock: { "1Sg": "...", "2Sg": "...", ..., "3Pl":"..." }
    const rows = [
        { label: "1. Person", singular: voiceBlock["1Sg"] || "", plural: voiceBlock["1Pl"] || "" },
        { label: "2. Person", singular: voiceBlock["2Sg"] || "", plural: voiceBlock["2Pl"] || "" },
        { label: "3. Person", singular: voiceBlock["3Sg"] || "", plural: voiceBlock["3Pl"] || "" },
    ];
    return rows;
}
