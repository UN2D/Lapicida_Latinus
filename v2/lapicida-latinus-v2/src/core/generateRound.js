// src/logic/generateRound.js

import { buildNounQuestions } from "../core/generators/nouns";
import { generateAdjWithNounRound } from "../core/generators/adjectives";
import { buildVerbQuestions } from "./generators/verbs";

/**
 * Erzeugt eine Trainingsrunde für die gewählte Kategorie.
 * Alle Spiele hängen hier dran, damit App.jsx nur eine Quelle hat.
 */
export default function generateRound(opts) {
    const {
        category,
        lemmas = [],
        numQuestions = 5,
        showHelp = true,
        settings = {}    // <— wichtig!
    } = opts || {};
    const safeNum = Math.max(1, Number(numQuestions) || 5);
    const safeSettings = settings || {};
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
        settings,
    };
}
