// src/core/generators/nouns.js

import nounsAdjectives from "../../data/nounsAdjectives.json";
import { shuffle, buildNounDeLabel } from "../morphUtils";

/**
 * Sammelt alle Nomen-Einträge für die gewünschten Lemmata.
 * - Wenn lemmas leer ist: alle Nomen im Datensatz.
 */
function collectNounEntries(lemmas) {
    const hasFilter = Array.isArray(lemmas) && lemmas.length > 0;
    const lemmaSet = hasFilter ? new Set(lemmas) : null;

    return nounsAdjectives.filter((e) => {
        if (e.pos !== "noun") return false;
        if (!e.form || !e.case || !e.number || !e.gender) return false;
        if (lemmaSet && !lemmaSet.has(e.lemma)) return false;
        return true;
    });
}

/**
 * Erzeugt eine Nomen-Runde:
 * - Jede lateinische Form (prompt) fasst alle möglichen Analysen zusammen.
 * - correctOptions: Array aller gültigen (Kasus/Num/Genus)-Kombis.
 */
export function generateNounRound({
    lemmas = [],
    numQuestions = 5
}) {
    const entries = collectNounEntries(lemmas);

    if (!entries.length) {
        return {
            category: "nouns",
            lemmas,
            numQuestions: 0,
            questions: []
        };
    }

    // form -> Gruppe
    const groups = new Map();

    for (const e of entries) {
        const { form } = e;
        if (!groups.has(form)) {
            groups.set(form, {
                prompt: form,
                lemma: e.lemma,
                lemmaDe: e.lemmaDe,
                correctOptions: []
            });
        }

        const group = groups.get(form);

        group.correctOptions.push({
            case: e.case,
            number: e.number,
            gender: e.gender,
            // nur deutsche Bedeutung; Kasus/Num/Genus macht später die UI
            de: buildNounDeLabel({ lemmaDe: e.lemmaDe })
        });
    }

    const allGroups = shuffle(Array.from(groups.values()));
    const take = Math.min(numQuestions, allGroups.length);

    const questions = allGroups.slice(0, take).map((g, index) => ({
        id: `noun_${g.prompt}_${index}`,
        type: "noun",
        prompt: g.prompt,
        lemma: g.lemma,
        lemmaDe: g.lemmaDe,
        correctOptions: g.correctOptions,
        topics: ["noun"]
    }));

    return {
        category: "nouns",
        lemmas,
        numQuestions: questions.length,
        questions
    };
}
