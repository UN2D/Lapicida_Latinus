// src/components/QuestionConjunction.jsx
import { useState } from "react";

/**
 * Mögliche Funktions-Typen.
 * Du kannst das jederzeit an deine conjunctions.json anpassen.
 * Wenn du nur kopulative drin hast, wird das für den Start trivial,
 * aber die Struktur steht dann schon.
 */
const TYPE_OPTIONS = [
    "kopulativ",
    "adversativ",
    "kausal",
    "konsekutiv",
    "temporal"
];

export function QuestionConjunction({ question, onAnswer }) {
    const [selectedType, setSelectedType] = useState(null);

    const canCheck = selectedType !== null;

    const handleCheck = () => {
        if (!canCheck) return;

        const correctType = (question.correct && question.correct.type) || null;
        const isCorrect =
            correctType &&
            selectedType.toLowerCase() === correctType.toLowerCase();

        onAnswer(isCorrect, {
            userAnswer: {
                type: selectedType
            }
        });
    };

    return (
        <div className="question">
            {/* Konjunktion */}
            <p className="form">{question.prompt}</p>

            {/* kleiner Hinweis */}
            <p className="lemma">
                Welche Funktion hat diese Konjunktion im Satz?
            </p>

            <div className="choice-block">
                <div className="choice-label">Funktion / Typ</div>
                <div className="choice-row">
                    {TYPE_OPTIONS.map((t) => (
                        <button
                            key={t}
                            className={
                                "choice-btn" +
                                (selectedType === t ? " selected" : "")
                            }
                            onClick={() => setSelectedType(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={
                    "check-btn" + (!canCheck ? " disabled" : "")
                }
                onClick={handleCheck}
                disabled={!canCheck}
            >
                Überprüfen
            </button>
        </div>
    );
}
