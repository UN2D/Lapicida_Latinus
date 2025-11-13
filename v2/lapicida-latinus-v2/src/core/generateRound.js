// src/logic/generateRound.js

import { buildNounQuestions } from "../core/generators/nouns";
import { generateAdjWithNounRound } from "../core/generators/adjectives";
import { buildVerbQuestions } from "./generators/verbs";

/**
 * Erzeugt eine Trainingsrunde für die gewählte Kategorie.
 * Alle Spiele hängen hier dran, damit App.jsx nur eine Quelle hat.
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
            });
            break;

        case "adj_context":
            questions = generateAdjWithNounRound({
                lemmas,
                numQuestions: safeNum,
            });
            break;

        case "verbs":
            questions = buildVerbQuestions({
                lemmas,
                numQuestions: safeNum,
                filters: settings?.filters || {}
            });
            break;
        // weitere Kategorien (verbs, demonstratives, possessives, ...)
        // kommen hier später sauber getrennt dazu

        default:
            questions = [];
    }

    return {
        category,
        lemmas,
        numQuestions: safeNum,
        questions,
        showHelp,
    };
}
