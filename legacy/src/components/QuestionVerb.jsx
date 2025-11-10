// src/components/QuestionVerb.jsx
//
// Eingabekomponente für Verbformen.
// Gleiche UX wie QuestionNounAdj:
// - Auswahl Person / Numerus / Modus / Genus / Zeit
// - 1. Fehlversuch: farbiges Feedback (teilweise richtig wird grün)
// - 2. Klick: endgültige Auswertung via onAnswer()

import { useState } from "react";

const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];
const TENSES = [
    "Praesens",
    "Imperfekt",
    "Perfekt",
    "Plusquamperfekt",
    "Futur I",
    "Futur II"
];

export function QuestionVerb({ question, onAnswer }) {
    const correct = (question.correctOptions || [])[0] || {};

    const [person, setPerson] = useState(null);
    const [number, setNumber] = useState(null);
    const [mood, setMood] = useState(null);
    const [voice, setVoice] = useState(null);
    const [tense, setTense] = useState(null);

    const [attempted, setAttempted] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const canCheck =
        person && number && mood && voice && tense;

    const isExact =
        person === correct.person &&
        number === correct.number &&
        mood === correct.mood &&
        voice === correct.voice &&
        tense === correct.tense;

    const handleCheck = () => {
        if (!canCheck) return;

        if (isExact) {
            onAnswer(true, {
                userAnswer: {
                    person,
                    number,
                    mood,
                    voice,
                    tense
                }
            });
            return;
        }

        if (!attempted) {
            setAttempted(true);
            setFeedback({
                personCorrect: person === correct.person,
                numberCorrect: number === correct.number,
                moodCorrect: mood === correct.mood,
                voiceCorrect: voice === correct.voice,
                tenseCorrect: tense === correct.tense
            });
            return;
        }

        onAnswer(isExact, {
            userAnswer: {
                person,
                number,
                mood,
                voice,
                tense
            }
        });
    };

    const btnClass = (dimension, value) => {
        const base = ["pill-btn", "choice-btn"];

        const selected =
            (dimension === "person" && person === value) ||
            (dimension === "number" && number === value) ||
            (dimension === "mood" && mood === value) ||
            (dimension === "voice" && voice === value) ||
            (dimension === "tense" && tense === value);

        if (selected) base.push("selected");

        if (attempted && feedback) {
            if (dimension === "person" && person === value) {
                base.push(feedback.personCorrect ? "correct" : "wrong");
            }
            if (dimension === "number" && number === value) {
                base.push(feedback.numberCorrect ? "correct" : "wrong");
            }
            if (dimension === "mood" && mood === value) {
                base.push(feedback.moodCorrect ? "correct" : "wrong");
            }
            if (dimension === "voice" && voice === value) {
                base.push(feedback.voiceCorrect ? "correct" : "wrong");
            }
            if (dimension === "tense" && tense === value) {
                base.push(feedback.tenseCorrect ? "correct" : "wrong");
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
                    <div className="form">{question.prompt}</div>
                </div>
                {question.lemma && (
                    <div className="lemma">
                        ({question.lemma} – {question.lemmaDe})
                    </div>
                )}
            </div>

            {/* Person */}
            <div className="choice-panel">
                <div className="choice-label">Person</div>
                <div className="choice-row">
                    {PERSONS.map((p) => (
                        <button
                            key={p}
                            className={btnClass("person", p)}
                            onClick={() => setPerson(p)}
                        >
                            {p}
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
                            onClick={() => setNumber(n)}
                        >
                            {n === "Sg" ? "Singular" : "Plural"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modus */}
            <div className="choice-panel">
                <div className="choice-label">Modus</div>
                <div className="choice-row">
                    {MOODS.map((m) => (
                        <button
                            key={m}
                            className={btnClass("mood", m)}
                            onClick={() => setMood(m)}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus (Diathese) */}
            <div className="choice-panel">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {VOICES.map((v) => (
                        <button
                            key={v}
                            className={btnClass("voice", v)}
                            onClick={() => setVoice(v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zeitform */}
            <div className="choice-panel">
                <div className="choice-label">Zeitform</div>
                <div className="choice-row">
                    {TENSES.map((t) => (
                        <button
                            key={t}
                            className={btnClass("tense", t)}
                            onClick={() => setTense(t)}
                        >
                            {t}
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
