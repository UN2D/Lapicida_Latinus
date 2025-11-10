// src/core/roundFactory.js

import { generateNounRound } from "./generators/nouns";

/**
 * Zentrale Fabrik zum Erzeugen einer Runde.
 * 
 * Später:
 *  - verbs: generateVerbRound(...)
 *  - adj_with_noun: generateAdjWithNounRound(...)
 *  - demonstratives: generateDemonstrativeRound(...)
 *  - possessives: generatePossessiveRound(...)
 */

export function buildRound(config) {
    const {
        category,
        lemmas = [],
        numQuestions = 5,
        verbSettings = {},
        includeHelp = true
    } = config || {};

    if (category === "nouns") {
        return generateNounRound({ lemmas, numQuestions, includeHelp });
    }

    // Fallback: leere Runde – nichts kaputt machen.
    return {
        category: category || "unknown",
        lemmas,
        numQuestions: 0,
        questions: []
    };
}
