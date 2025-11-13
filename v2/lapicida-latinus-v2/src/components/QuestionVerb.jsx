// src/components/QuestionVerb.jsx
import { useState } from "react";
import { formatVerbSpec } from "../core/generators/verbs";

const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const TENSES = ["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt", "Futur I", "Futur II"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];

const LABELS = {
    Sg: "Singular",
    Pl: "Plural",
};

export function QuestionVerb({ question, onAnswer, showHelp }) {
    const correct = (question.correctOptions || [])[0] || {};

    const [sel, setSel] = useState({
        person: null,
        number: null,
        tense: null,
        mood: null,
        voice: null,
    });

    const [phase, setPhase] = useState("idle"); // idle | hinted | locked
    const canCheck = Object.values(sel).every(Boolean);

    const isCorrectNow =
        sel.person === correct.person &&
        sel.number === correct.number &&
        sel.tense === correct.tense &&
        sel.mood === correct.mood &&
        sel.voice === correct.voice;

    const handleCheck = () => {
        if (!canCheck) return;

        // Hilfe AUS: immer 1 Fehlversuch mit einmaligem Feedback, kein Live
        if (!showHelp) {
            if (phase === "idle") {
                // erster Prüfversuch -> nur markieren, kein Ergebnis-Screen
                setPhase("hinted");
                return;
            }
            // zweiter Klick -> final
            onAnswer(isCorrectNow, {
                userAnswer: { ...sel },
                attempts: 2,
            });
            setPhase("locked");
            return;
        }

        // Hilfe AN
        if (phase === "idle") {
            if (!isCorrectNow) {
                setPhase("hinted"); // Live-Update aktiv
                return;
            }
            // direkt richtig
            onAnswer(true, { userAnswer: { ...sel }, attempts: 1 });
            setPhase("locked");
            return;
        }

        // phase === "hinted": final werten
        onAnswer(isCorrectNow, { userAnswer: { ...sel }, attempts: 2 });
        setPhase("locked");
    };

    const clickIfEditable = (updater) => {
        if (phase === "locked") return;
        setSel(prev => ({ ...prev, ...updater }));
    };

    // Button-Klassen: identisch zum Nomen-Flow
    const btnClass = (kind, value) => {
        const base = ["pill-btn"];
        const selected = sel[kind] === value;
        if (selected) base.push("selected");

        if (phase === "hinted") {
            const test = { ...sel, [kind]: value };
            const ok =
                test.person === correct.person &&
                test.number === correct.number &&
                test.tense === correct.tense &&
                test.mood === correct.mood &&
                test.voice === correct.voice;

            if (!showHelp) {
                // Hilfe AUS: nur die **aktuelle** Auswahl einfärben (keine Live-Neuberechnung beim Wechsel)
                if (selected) base.push(ok ? "correct" : "wrong");
            } else {
                // Hilfe AN: Live-Update – aktuell gewählte Buttons zeigen grün/rot live
                if (selected) base.push(ok ? "correct" : "wrong");
            }
        }
        return base.join(" ");
    };

    const lemmaLine =
        question.lemma && question.lemmaDe
            ? `${question.lemma} – ${question.lemmaDe}`
            : question.lemma || "";

    return (
        <div className="question-card">
            {lemmaLine && <div className="question-lemma">{lemmaLine}</div>}

            <div className="question-form-box">
                <div className="question-form">{question.prompt}</div>
            </div>

            {/* Person */}
            <div className="choice-group compact">
                <div className="choice-label">Person</div>
                <div className="grid-3">
                    {PERSONS.map(p => (
                        <button
                            key={p}
                            className={btnClass("person", p)}
                            onClick={() => clickIfEditable({ person: p })}
                        >
                            {p}. Person
                        </button>
                    ))}
                </div>
            </div>

            {/* Numerus */}
            <div className="choice-group compact">
                <div className="choice-label">Numerus</div>
                <div className="grid-3">
                    {NUMBERS.map(n => (
                        <button
                            key={n}
                            className={btnClass("number", n)}
                            onClick={() => clickIfEditable({ number: n })}
                        >
                            {LABELS[n]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zeit */}
            <div className="choice-group compact">
                <div className="choice-label">Zeit</div>
                <div className="grid-3">
                    {TENSES.map(t => (
                        <button
                            key={t}
                            className={btnClass("tense", t)}
                            onClick={() => clickIfEditable({ tense: t })}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modus */}
            <div className="choice-group compact">
                <div className="choice-label">Modus</div>
                <div className="grid-3">
                    {MOODS.map(m => (
                        <button
                            key={m}
                            className={btnClass("mood", m)}
                            onClick={() => clickIfEditable({ mood: m })}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus (Diathese) */}
            <div className="choice-group compact">
                <div className="choice-label">Genus (Diathese)</div>
                <div className="grid-3">
                    {VOICES.map(v => (
                        <button
                            key={v}
                            className={btnClass("voice", v)}
                            onClick={() => clickIfEditable({ voice: v })}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={"primary-btn" + (!canCheck ? " disabled" : "")}
                disabled={!canCheck}
                onClick={handleCheck}
            >
                Prüfen
            </button>
        </div>
    );
}
