// src/components/QuestionAdjWithNoun.jsx
import { useState } from "react";

const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
const NUMBERS = ["Sg", "Pl"];
const GENDERS = ["m", "f", "n"];

const CASE_LABELS = {
    Nom: "Nominativ",
    Gen: "Genitiv",
    Dat: "Dativ",
    Akk: "Akkusativ",
    Abl: "Ablativ"
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

/**
 * Adjektiv im Kontext (Adj + Nomen).
 * Gleiche UX wie QuestionNounAdj:
 * - 1. Check:
 *    - korrekt → final
 *    - falsch → gezieltes Feedback pro Dimension, kein onAnswer
 * - Änderung → Feedback weg
 * - 2. Check → final (onAnswer)
 */
export function QuestionAdjWithNoun({ question, onAnswer }) {
    const correctOptions = question.correctOptions || [];

    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);

    const [firstAttemptUsed, setFirstAttemptUsed] = useState(false);
    const [locked, setLocked] = useState(false);

    const [caseFeedback, setCaseFeedback] = useState(null);
    const [numberFeedback, setNumberFeedback] = useState(null);
    const [genderFeedback, setGenderFeedback] = useState(null);

    const canCheck =
        !!selectedCase && !!selectedNumber && !!selectedGender;

    const isCorrectCombo = (c, n, g) =>
        correctOptions.some(
            (opt) =>
                opt.case === c &&
                opt.number === n &&
                opt.gender === g
        );

    const isCorrectForDimension = (dimension, value) => {
        if (!value) return false;
        const key =
            dimension === "case"
                ? "case"
                : dimension === "number"
                    ? "number"
                    : "gender";
        return correctOptions.some((opt) => opt[key] === value);
    };

    const setFirstAttemptFeedback = () => {
        setCaseFeedback(
            isCorrectForDimension("case", selectedCase)
                ? "correct"
                : "wrong"
        );
        setNumberFeedback(
            isCorrectForDimension("number", selectedNumber)
                ? "correct"
                : "wrong"
        );
        setGenderFeedback(
            isCorrectForDimension("gender", selectedGender)
                ? "correct"
                : "wrong"
        );
    };

    const clearFeedback = () => {
        setCaseFeedback(null);
        setNumberFeedback(null);
        setGenderFeedback(null);
    };

    const handleCheck = () => {
        if (!canCheck || locked) return;

        const ok = isCorrectCombo(
            selectedCase,
            selectedNumber,
            selectedGender
        );

        if (!firstAttemptUsed) {
            if (ok) {
                setLocked(true);
                onAnswer(true, {
                    userAnswer: {
                        case: selectedCase,
                        number: selectedNumber,
                        gender: selectedGender
                    }
                });
            } else {
                setFirstAttemptUsed(true);
                setFirstAttemptFeedback();
            }
            return;
        }

        setLocked(true);
        onAnswer(ok, {
            userAnswer: {
                case: selectedCase,
                number: selectedNumber,
                gender: selectedGender
            }
        });
    };

    const handleSelectCase = (value) => {
        if (locked) return;
        if (firstAttemptUsed) clearFeedback();
        setSelectedCase(value);
    };

    const handleSelectNumber = (value) => {
        if (locked) return;
        if (firstAttemptUsed) clearFeedback();
        setSelectedNumber(value);
    };

    const handleSelectGender = (value) => {
        if (locked) return;
        if (firstAttemptUsed) clearFeedback();
        setSelectedGender(value);
    };

    const displayForm =
        question.promptAdj && question.promptNoun
            ? `${question.promptAdj} ${question.promptNoun}`
            : question.prompt;

    const btnClass = (dimension, value) => {
        const classes = ["choice-btn"];

        const selected =
            (dimension === "case" && selectedCase === value) ||
            (dimension === "number" && selectedNumber === value) ||
            (dimension === "gender" && selectedGender === value);

        if (selected) classes.push("selected");

        if (!locked && firstAttemptUsed) {
            if (dimension === "case" && selected) {
                if (caseFeedback === "correct") classes.push("correct");
                if (caseFeedback === "wrong") classes.push("wrong");
            }
            if (dimension === "number" && selected) {
                if (numberFeedback === "correct") classes.push("correct");
                if (numberFeedback === "wrong") classes.push("wrong");
            }
            if (dimension === "gender" && selected) {
                if (genderFeedback === "correct") classes.push("correct");
                if (genderFeedback === "wrong") classes.push("wrong");
            }
        }

        if (locked) classes.push("disabled");

        return classes.join(" ");
    };

    return (
        <div className="question">
            <p className="form">{displayForm}</p>
            {question.lemma && (
                <p className="lemma">
                    ({question.lemma} – {question.lemmaDe})
                </p>
            )}

            {/* Kasus */}
            <div className="choice-block">
                <div className="choice-label">Kasus</div>
                <div className="choice-row">
                    {CASES.map((c) => (
                        <button
                            key={c}
                            className={btnClass("case", c)}
                            onClick={() => handleSelectCase(c)}
                        >
                            {CASE_LABELS[c]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Numerus */}
            <div className="choice-block">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {NUMBERS.map((n) => (
                        <button
                            key={n}
                            className={btnClass("number", n)}
                            onClick={() => handleSelectNumber(n)}
                        >
                            {NUMBER_LABELS[n]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus */}
            <div className="choice-block">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {GENDERS.map((g) => (
                        <button
                            key={g}
                            className={btnClass("gender", g)}
                            onClick={() => handleSelectGender(g)}
                        >
                            {GENDER_LABELS[g]}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={
                    "check-btn" +
                    (!canCheck || locked ? " disabled" : "")
                }
                onClick={handleCheck}
                disabled={!canCheck || locked}
            >
                Überprüfen
            </button>
        </div>
    );
}
