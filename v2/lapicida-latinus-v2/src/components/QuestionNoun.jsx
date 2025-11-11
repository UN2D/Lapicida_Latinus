// src/components/QuestionNoun.jsx
import { useState } from "react";
import {
    CASE_LABELS,
    NUMBER_LABELS,
    GENDER_LABELS,
} from "../core/labels";

/**
 * Frage-Komponente für Substantive:
 * - 1. Prüfen:
 *      - wenn korrekt: direkt Ergebnis (onAnswer(true,...))
 *      - wenn falsch: Teil-Feedback (rot/grün auf gewählten Buttons), aber
 *        wir BLEIBEN in der Frage und rufen onAnswer noch NICHT auf
 * - 2. Prüfen (wenn schon Feedback sichtbar war):
 *      - endgültige Auswertung → onAnswer(...)
 * - Feedback verschwindet, sobald der User eine Auswahl ändert
 */

export function QuestionNoun({ question, onAnswer }) {
    const correctOptions = question.correctOptions || [];

    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);

    // null = noch kein Fehlversuch
    // { caseOk, numberOk, genderOk } = Feedback nach 1. Fehlversuch
    const [feedback, setFeedback] = useState(null);

    const canCheck =
        selectedCase !== null &&
        selectedNumber !== null &&
        selectedGender !== null;

    const isFullCorrect = (c, n, g) =>
        correctOptions.some(
            (opt) =>
                opt.case === c &&
                opt.number === n &&
                opt.gender === g
        );

    const handleCheck = () => {
        if (!canCheck) return;

        // Wenn wir schon Feedback gezeigt haben:
        // -> dieser Klick ist jetzt der ENDGÜLTIGE Versuch
        if (feedback) {
            const finalCorrect = isFullCorrect(
                selectedCase,
                selectedNumber,
                selectedGender
            );

            onAnswer(finalCorrect, {
                userAnswer: {
                    case: selectedCase,
                    number: selectedNumber,
                    gender: selectedGender,
                },
                correctOptions,
                // optional: Feedback mitschicken
                feedback,
            });

            return;
        }

        // Noch kein Feedback gezeigt -> erster Prüfen-Klick

        // Falls direkt korrekt: sofort Ergebnis
        if (isFullCorrect(selectedCase, selectedNumber, selectedGender)) {
            onAnswer(true, {
                userAnswer: {
                    case: selectedCase,
                    number: selectedNumber,
                    gender: selectedGender,
                },
                correctOptions,
            });
            return;
        }

        // Falsch -> Teil-Feedback berechnen, aber noch KEIN onAnswer
        const caseOk = correctOptions.some(
            (opt) => opt.case === selectedCase
        );
        const numberOk = correctOptions.some(
            (opt) => opt.number === selectedNumber
        );
        const genderOk = correctOptions.some(
            (opt) => opt.gender === selectedGender
        );

        setFeedback({ caseOk, numberOk, genderOk });
    };

    // Auswahl ändern: Feedback zurücksetzen, sonst könnte man
    // die Lösung „herumklicken“.
    const resetFeedbackAndSelect = (dimension, value) => {
        if (feedback) {
            setFeedback(null);
        }
        if (dimension === "case") setSelectedCase(value);
        if (dimension === "number") setSelectedNumber(value);
        if (dimension === "gender") setSelectedGender(value);
    };

    const getButtonClass = (dimension, value) => {
        const classes = ["choice-btn"];

        const isSelected =
            (dimension === "case" && selectedCase === value) ||
            (dimension === "number" && selectedNumber === value) ||
            (dimension === "gender" && selectedGender === value);

        if (isSelected) {
            classes.push("selected");
        }

        // Feedback NUR auf den aktuell gewählten Buttons anzeigen
        if (feedback && isSelected) {
            if (dimension === "case") {
                classes.push(feedback.caseOk ? "correct" : "wrong");
            }
            if (dimension === "number") {
                classes.push(feedback.numberOk ? "correct" : "wrong");
            }
            if (dimension === "gender") {
                classes.push(feedback.genderOk ? "correct" : "wrong");
            }
        }

        return classes.join(" ");
    };

    const lemmaLine =
        question.lemma && question.lemmaDe
            ? `${question.lemma} – ${question.lemmaDe}`
            : question.lemma || "";

    return (
        <div className="question-card">
            {lemmaLine && (
                <div className="question-lemma">
                    {lemmaLine}
                </div>
            )}

            <div className="question-form-main">
                {question.prompt}
            </div>

            {/* Kasus */}
            <div className="choice-group">
                <div className="choice-label">Kasus</div>
                <div className="choice-row">
                    {Object.entries(CASE_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            className={getButtonClass("case", key)}
                            onClick={() => resetFeedbackAndSelect("case", key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Numerus */}
            <div className="choice-group">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {Object.entries(NUMBER_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            className={getButtonClass("number", key)}
                            onClick={() => resetFeedbackAndSelect("number", key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus */}
            <div className="choice-group">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {Object.entries(GENDER_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            className={getButtonClass("gender", key)}
                            onClick={() => resetFeedbackAndSelect("gender", key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={
                    "primary-btn" + (!canCheck ? " disabled" : "")
                }
                disabled={!canCheck}
                onClick={handleCheck}
            >
                Prüfen
            </button>
        </div>
    );
}
