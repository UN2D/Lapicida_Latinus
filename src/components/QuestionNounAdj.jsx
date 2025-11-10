// src/components/QuestionNounAdj.jsx
//
// Eingabekomponente für:
// - Substantive
// - Adjektive im Kontext
// - Demonstrativpronomen-Phrasen
// - Possessivpronomen-Phrasen
//
// Einheitliches Verhalten:
// - 1. Fehlversuch: zeigt farbig, was an deiner Wahl (teil-)passt
// - Du kannst korrigieren
// - 2. Klick auf "Überprüfen": meldet endgültig ans Quiz

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

export function QuestionNounAdj({ question, onAnswer }) {
    const correctOptions = question.correctOptions || [];

    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);

    const [attempted, setAttempted] = useState(false); // ob bereits ein Fehlversuch gezeigt wurde
    const [feedback, setFeedback] = useState(null); // { caseCorrect, numberCorrect, genderCorrect }

    const canCheck =
        !!selectedCase && !!selectedNumber && !!selectedGender;

    const isCorrectCombo = (c, n, g) =>
        correctOptions.some(
            (opt) =>
                opt.case === c && opt.number === n && opt.gender === g
        );

    const handleCheck = () => {
        if (!canCheck) return;

        const ok = isCorrectCombo(
            selectedCase,
            selectedNumber,
            selectedGender
        );

        // Wenn korrekt -> direkt ans Quiz melden
        if (ok) {
            onAnswer(true, {
                userAnswer: {
                    case: selectedCase,
                    number: selectedNumber,
                    gender: selectedGender
                }
            });
            return;
        }

        // Wenn noch kein Fehlversuch: Feedback zeigen, aber NICHT ans Quiz melden
        if (!attempted) {
            const anyCorrect = correctOptions.some(
                (opt) =>
                (opt.case === selectedCase ||
                    opt.number === selectedNumber ||
                    opt.gender === selectedGender)
            );

            setAttempted(true);
            setFeedback({
                caseCorrect: correctOptions.some(
                    (opt) => opt.case === selectedCase
                ),
                numberCorrect: correctOptions.some(
                    (opt) => opt.number === selectedNumber
                ),
                genderCorrect: correctOptions.some(
                    (opt) => opt.gender === selectedGender
                ),
                anyCorrect
            });
            return;
        }

        // Zweiter Klick (nach Feedback) -> endgültig melden
        onAnswer(ok, {
            userAnswer: {
                case: selectedCase,
                number: selectedNumber,
                gender: selectedGender
            }
        });
    };

    const displayForm =
        question.prompt || // zusammengesetzte Phrasen bringen prompt bereits mit
        (question.promptNoun && question.promptAdj
            ? `${question.promptAdj} ${question.promptNoun}`
            : "");

    // Hilfsfunktion für Button-Klassen
    const btnClass = (dimension, value) => {
        const base = ["pill-btn", "choice-btn"];

        const selected =
            (dimension === "case" && selectedCase === value) ||
            (dimension === "number" && selectedNumber === value) ||
            (dimension === "gender" && selectedGender === value);

        if (selected) base.push("selected");

        if (attempted && feedback) {
            if (dimension === "case" && selectedCase === value) {
                if (!feedback.caseCorrect) base.push("wrong");
                else base.push("correct");
            }
            if (dimension === "number" && selectedNumber === value) {
                if (!feedback.numberCorrect) base.push("wrong");
                else base.push("correct");
            }
            if (dimension === "gender" && selectedGender === value) {
                if (!feedback.genderCorrect) base.push("wrong");
                else base.push("correct");
            }
        }

        return base.join(" ");
    };

    const checkLabel = attempted
        ? "Weiter überprüfen"
        : "Überprüfen";

    return (
        <div className="question">
            <div className="question-header">
                <div className="form-box">
                    <div className="form">{displayForm}</div>
                </div>
                {question.lemma && (
                    <div className="lemma">
                        ({question.lemma} – {question.lemmaDe})
                    </div>
                )}
            </div>

            {/* Kasus */}
            <div className="choice-panel">
                <div className="choice-label">Kasus</div>
                <div className="choice-row">
                    {CASES.map((c) => (
                        <button
                            key={c}
                            className={btnClass("case", c)}
                            onClick={() => setSelectedCase(c)}
                        >
                            {CASE_LABELS[c]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Numerus */}
            <div className="choice-panel">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {NUMBERS.map((n) => (
                        <button
                            key={n}
                            className={btnClass("number", n)}
                            onClick={() => setSelectedNumber(n)}
                        >
                            {NUMBER_LABELS[n]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus */}
            <div className="choice-panel">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {GENDERS.map((g) => (
                        <button
                            key={g}
                            className={btnClass("gender", g)}
                            onClick={() => setSelectedGender(g)}
                        >
                            {GENDER_LABELS[g]}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={
                    "primary-btn check-btn" +
                    (!canCheck ? " disabled" : "")
                }
                onClick={handleCheck}
                disabled={!canCheck}
            >
                {checkLabel}
            </button>
        </div>
    );
}
