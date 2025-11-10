import { generateNounRound } from "./generators/nouns";

export function buildRound(config) {
    const {
        category,
        lemmas = [],
        numQuestions = 5,
        verbSettings = {},
        includeHelp = true
    } = config;

    switch (category) {
        case "nouns":
            return generateNounRound({ lemmas, numQuestions, includeHelp });
        default:
            return { category, questions: [] };
    }
}
