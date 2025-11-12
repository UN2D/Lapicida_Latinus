// src/core/generators/adjectives.js
import data from "../../data/nounsAdjectives.json";

/* ===== Konstanten ===== */
const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
const NUMBERS = ["Sg", "Pl"];
const GENDERS = ["m", "f", "n"];

/* ===== Utilities ===== */
const isNounEntry = (e) => {
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
};

const isAdjBase = (e) => {
    // Adjektiv-Basen sind im Datensatz ohne Kasus/Num/Genus – nur Grundinfos
    return (e.pos || "").toLowerCase() === "adj" && e.lemma && e.lemmaDe;
};

const mapCaseDe = (c) =>
    ({ Nom: "Nominativ", Gen: "Genitiv", Dat: "Dativ", Akk: "Akkusativ", Abl: "Ablativ" }[c] || c);
const mapNumDe = (n) => ({ Sg: "Singular", Pl: "Plural" }[n] || n);
const mapGenDe = (g) => ({ m: "maskulin", f: "feminin", n: "neutrum" }[g] || g);

/* Deutscher Artikel passend zu Kasus/Num/Genus */
function germanArticle(k, n, g) {
    if (n === "Pl") {
        return { Nom: "die", Akk: "die", Dat: "den", Gen: "der", Abl: "den" }[k] || "die";
    }
    // Singular
    if (g === "m") {
        return { Nom: "der", Akk: "den", Dat: "dem", Gen: "des", Abl: "dem" }[k] || "der";
    }
    if (g === "f") {
        return { Nom: "die", Akk: "die", Dat: "der", Gen: "der", Abl: "der" }[k] || "die";
    }
    // neutrum
    return { Nom: "das", Akk: "das", Dat: "dem", Gen: "des", Abl: "dem" }[k] || "das";
}

/* Ablativ Zusatz-Hinweis */
function ablHint(k) {
    return k === "Abl" ? " (mit/bei/von)" : "";
}

/* Deutsche Ausgabe für die „Richtige Bestimmung(en)“-Zeile */
function formatAdjContextDe(k, n, g, adjDe, nounDe) {
    const art = germanArticle(k, n, g);
    const kase = mapCaseDe(k);
    const num = mapNumDe(n);
    const gen = mapGenDe(g);
    const pluralTag = n === "Pl" ? " (Plural)" : "";
    // „Genitiv Plural maskulin – der gut(e) Bewohner (Plural)“
    // Adjektiv bleibt Grundform als Bedeutung (nicht flektiert), ok für Anfänger.
    return `${kase} ${num} ${gen} – ${art} ${adjDe} ${nounDe}${pluralTag}${ablHint(k)}`;
}

/* a/o-Deklination – kompakte Paradigma-Zeilen für die Hilfetabelle */
function aoParadigmRows(stem = "bon") {
    return [
        { case: "Nominativ", singular: `${stem}us, ${stem}a, ${stem}um`, plural: `${stem}i, ${stem}ae, ${stem}a` },
        { case: "Genitiv", singular: `${stem}i, ${stem}ae, ${stem}i`, plural: `${stem}orum, ${stem}arum, ${stem}orum` },
        { case: "Dativ", singular: `${stem}o, ${stem}ae, ${stem}o`, plural: `${stem}is, ${stem}is, ${stem}is` },
        { case: "Akkusativ", singular: `${stem}um, ${stem}am, ${stem}um`, plural: `${stem}os, ${stem}as, ${stem}a` },
        { case: "Ablativ", singular: `${stem}o, ${stem}a, ${stem}o`, plural: `${stem}is, ${stem}is, ${stem}is` },
    ];
}

/* Hilfs-Shuffle */
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* ===== Generator: Adjektive im Kontext ===== */
export function generateAdjWithNounRound({ lemmas = [], numQuestions = 5 }) {
    const adjBasesAll = data.filter(isAdjBase);
    const nounFormsAll = data.filter(isNounEntry);

    const lemmaSet = new Set(lemmas);
    const adjBases =
        lemmaSet.size === 0 ? adjBasesAll : adjBasesAll.filter((a) => lemmaSet.has(a.lemma));

    // Pool bilden: für jedes Nomen gibt es u. U. mehrere richtige Optionen
    const questionsByPrompt = new Map();

    for (const adj of adjBases) {
        // einfacher Stamm aus bonus → bon
        const stem = adj.lemma.replace(/us$/i, "");
        const possiblePairs = shuffle(nounFormsAll).slice(0, 200); // Deckel drauf

        for (const noun of possiblePairs) {
            // Erzeuge eine lateinische Phrase (grob, ohne Sonderfälle)
            const prompt = `${latinAdjForm(stem, noun)} ${noun.form}`.trim();

            // Karte zum Prompt anlegen (ein Prompt kann mehrere richtige Bestimmungen besitzen)
            if (!questionsByPrompt.has(prompt)) {
                questionsByPrompt.set(prompt, {
                    id: `adjctx_${adj.lemma}_${noun.form}`,
                    type: "adj_context",
                    prompt,
                    lemma: adj.lemma,
                    lemmaDe: adj.lemmaDe,
                    // für Hilfetabelle:
                    paradigm: aoParadigmRows(stem),
                    correctOptions: [],
                });
            }

            const q = questionsByPrompt.get(prompt);
            q.correctOptions.push({
                case: noun.case,
                number: noun.number,
                gender: noun.gender,
                de: formatAdjContextDe(noun.case, noun.number, noun.gender, adj.lemmaDe, noun.lemmaDe),
            });
        }
    }

    // finaler Satz Fragen:
    const allQs = Array.from(questionsByPrompt.values());
    return shuffle(allQs).slice(0, numQuestions);
}

/* sehr grobe Flektionsanzeige für die Anzeige (kein echter Morph-Parser) */
function latinAdjForm(stem, noun) {
    // Wir zeigen einfach den Stamm + grobe Endung je nach Genus/Num/Kasus des Nomens.
    // Für die Anzeige reicht das (richtige Lösung wird über noun-Merkmale bewertet).
    const { case: k, number: n, gender: g } = noun;

    // Endungen (a/o-Deklination)
    const endings = {
        m: { Sg: { Nom: "us", Gen: "i", Dat: "o", Akk: "um", Abl: "o" }, Pl: { Nom: "i", Gen: "orum", Dat: "is", Akk: "os", Abl: "is" } },
        f: { Sg: { Nom: "a", Gen: "ae", Dat: "ae", Akk: "am", Abl: "a" }, Pl: { Nom: "ae", Gen: "arum", Dat: "is", Akk: "as", Abl: "is" } },
        n: { Sg: { Nom: "um", Gen: "i", Dat: "o", Akk: "um", Abl: "o" }, Pl: { Nom: "a", Gen: "orum", Dat: "is", Akk: "a", Abl: "is" } },
    };

    const end = (endings[g] && endings[g][n] && endings[g][n][k]) || "";
    return `${stem}${end}`;
}
