// src/components/QuestionNoun.jsx
import { useState } from "react";
import { CASE_LABELS, NUMBER_LABELS, GENDER_LABELS } from "../core/labels";

/**
 * Frage-Komponente für Nomen-Formbestimmung.
 *
 * Props:
 * - question: { prompt, lemma, lemmaDe, correctOptions: [...] }
 * - onAnswer(isCorrect, detail)
 */
export function QuestionNoun({ question, onAnswer }) {
    const correctOptions = question.correctOptions || [];

    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);

    const [attempt, setAttempt] = useState(0);    // 0 = noch kein Check, 1 = ein Fehlversuch
    const [locked, setLocked] = useState(false);  // true = Ergebnis an Quiz gemeldet

    const canCheck =
        !!selectedCase && !!selectedNumber && !!selectedGender && !locked;

    // Prüft, ob eine (c,n,g)-Kombi eine der korrekten Lösungen ist
    const isCorrectCombo = (c, n, g) =>
        correctOptions.some(
            (opt) =>
                opt.case === c &&
                opt.number === n &&
                opt.gender === g
        );

    // Hilfsfunktionen für das visuelle Feedback nach einem Fehlversuch
    const valueIsPossibleInAnyCorrect = (dimension, value) => {
        if (!correctOptions.length) return false;
        if (dimension === "case") {
            return correctOptions.some((opt) => opt.case === value);
        }
        if (dimension === "number") {
            return correctOptions.some((opt) => opt.number === value);
        }
        if (dimension === "gender") {
            return correctOptions.some((opt) => opt.gender === value);
        }
        return false;
    };

    const handleCheck = () => {
        if (!canCheck) return;

        const comboCorrect = isCorrectCombo(
            selectedCase,
            selectedNumber,
            selectedGender
        );

        // Wenn direkt korrekt oder bereits ein Fehlversuch hinter uns:
        // -> final werten und sperren
        if (comboCorrect || attempt >= 1) {
            setLocked(true);
            onAnswer(comboCorrect, {
                userAnswer: {
                    case: selectedCase,
                    number: selectedNumber,
                    gender: selectedGender
                }
            });
            return;
        }

        // Erster Fehlversuch: nur Feedback, noch kein onAnswer
        setAttempt(1);
    };

    /**
     * Liefert die CSS-Klasse für einen Button (Case/Number/Gender),
     * basierend auf Auswahl + Fehlversuch.
     */
    const btnClass = (dimension, value) => {
        const classes = ["choice-btn"];

        const isSelected =
            (dimension === "case" && selectedCase === value) ||
            (dimension === "number" && selectedNumber === value) ||
            (dimension === "gender" && selectedGender === value);

        if (isSelected) {
            classes.push("selected");
        }

        // Nach finalem Lock keine zusätzlichen Farben setzen
        if (locked) {
            if (isSelected) classes.push("locked");
            return classes.join(" ");
        }

        // Nach einem Fehlversuch: gezieltes Feedback
        if (attempt === 1 && isSelected) {
            const possible = valueIsPossibleInAnyCorrect(dimension, value);
            if (possible) {
                classes.push("partial-correct"); // z.B. grünlicher Rand
            } else {
                classes.push("wrong");           // rot
            }
        }

        return classes.join(" ");
    };

    const displayForm = question.prompt;

    return (
        <div className="question-card">
            {/* Lemma klein über der Form */}
            {question.lemma && (
                <div className="question-lemma">
                    {question.lemma} – {question.lemmaDe}
                </div>
            )}

            {/* große Form */}
            <div className="question-form">
                {displayForm}
            </div>

            {/* Kasus */}
            <div className="choice-group">
                <div className="choice-label">Kasus</div>
                <div className="choice-row">
                    {["Nom", "Gen", "Dat", "Akk", "Abl"].map((c) => (
                        <button
                            key={c}
                            className={btnClass("case", c)}
                            onClick={() => !locked && setSelectedCase(c)}
                        >
                            {CASE_LABELS[c]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Numerus */}
            <div className="choice-group">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {["Sg", "Pl"].map((n) => (
                        <button
                            key={n}
                            className={btnClass("number", n)}
                            onClick={() => !locked && setSelectedNumber(n)}
                        >
                            {NUMBER_LABELS[n]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus */}
            <div className="choice-group">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {["m", "f", "n"].map((g) => (
                        <button
                            key={g}
                            className={btnClass("gender", g)}
                            onClick={() => !locked && setSelectedGender(g)}
                        >
                            {GENDER_LABELS[g]}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={
                    "primary-btn" + (!canCheck ? " disabled" : "")
                }
                onClick={handleCheck}
                disabled={!canCheck}
            >
                Prüfen
            </button>
        </div>
    );
}
