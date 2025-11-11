// src/components/QuestionAdjContext.jsx

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

export function QuestionAdjContext({ question, onAnswer }) {
    const correctOptions = question.correctOptions || [];

    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);

    const [locked, setLocked] = useState(false);

    const canCheck =
        !!selectedCase && !!selectedNumber && !!selectedGender;

    const isCorrectCombo = (c, n, g) =>
        correctOptions.some(
            (opt) =>
                opt.case === c &&
                opt.number === n &&
                opt.gender === g
        );

    const handleCheck = () => {
        if (!canCheck || locked) return;

        const ok = isCorrectCombo(
            selectedCase,
            selectedNumber,
            selectedGender
        );

        setLocked(true);

        onAnswer(ok, {
            userAnswer: {
                case: selectedCase,
                number: selectedNumber,
                gender: selectedGender
            }
        });
    };

    const btnClass = (dimension, value) => {
        const base = ["choice-btn"];

        const selected =
            (dimension === "case" && selectedCase === value) ||
            (dimension === "number" && selectedNumber === value) ||
            (dimension === "gender" && selectedGender === value);

        if (selected) base.push("selected");

        if (locked && selected) {
            const ok = isCorrectCombo(
                dimension === "case" ? value : selectedCase,
                dimension === "number" ? value : selectedNumber,
                dimension === "gender" ? value : selectedGender
            );
            base.push(ok ? "correct" : "wrong");
        }

        if (locked) base.push("locked");

        return base.join(" ");
    };

    return (
        <div className="question-card">
            <div className="lemma-line">
                {question.lemma} – {question.lemmaDe}
                {question.contextLemma && (
                    <> | {question.contextLemma} – {question.contextLemmaDe}</>
                )}
            </div>

            <div className="prompt-big">{question.prompt}</div>

            <div className="choice-group">
                <div className="choice-label">Kasus</div>
                <div className="choice-row">
                    {CASES.map((c) => (
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

            <div className="choice-group">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {NUMBERS.map((n) => (
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

            <div className="choice-group">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {GENDERS.map((g) => (
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
                    "primary-btn" + (!canCheck || locked ? " disabled" : "")
                }
                disabled={!canCheck || locked}
                onClick={handleCheck}
            >
                Prüfen
            </button>
        </div>
    );
}
