// src/Quiz.jsx
import { useState } from "react";
import { QuestionNoun } from "./QuestionNoun";
import { formatCaseNumberGender } from "../core/labels";

/**
 * Rundengesteuertes Quiz:
 * - zeigt jeweils eine Frage
 * - bekommt von QuestionNoun ein endgültiges Ergebnis
 * - zeigt klare Richtig/Falsch-Karte
 * - am Ende: Zusammenfassung
 */

export function Quiz({ round, onExit }) {
    const { questions = [], showHelp = false } = round || {};
    const [index, setIndex] = useState(0);
    const [currentResult, setCurrentResult] = useState(null);
    const [history, setHistory] = useState([]);

    const total = questions.length;
    const current = questions[index] || null;

    // Keine Fragen -> sauber zurück
    if (!total) {
        return (
            <div className="screen">
                <header className="top-bar">
                    <div className="app-title">Lapicida Latinus</div>
                    <button className="top-bar-btn" onClick={onExit}>
                        Zurück
                    </button>
                </header>
                <main className="content">
                    <p>Für diese Auswahl wurden keine Aufgaben gefunden.</p>
                    <button className="primary-btn" onClick={onExit}>
                        Zurück zur Auswahl
                    </button>
                </main>
            </div>
        );
    }

    const handleAnswer = (isCorrect, detail) => {
        const q = current;
        if (!q) return;

        const correctOptions = q.correctOptions || [];

        const result = {
            question: q,
            isCorrect,
            userAnswer: detail?.userAnswer || null,
            attempts: detail?.attempts || 1,
            correctOptions
        };

        setHistory((prev) => [...prev, result]);
        setCurrentResult(result);
    };

    const handleNext = () => {
        if (!currentResult) return;

        const next = index + 1;
        if (next >= total) {
            setCurrentResult({ done: true });
            return;
        }

        setIndex(next);
        setCurrentResult(null);
    };

    // ===== Summary =====
    if (currentResult && currentResult.done) {
        const correctCount = history.filter((h) => h.isCorrect).length;
        const totalCount = history.length || total;
        const ratio = totalCount ? correctCount / totalCount : 0;

        let feedback;
        if (ratio === 1) {
            feedback = "Perfekt! Alle Formen korrekt. 🏛️";
        } else if (ratio >= 0.8) {
            feedback = "Sehr stark! Nur wenige Formen nochmal ansehen.";
        } else if (ratio >= 0.6) {
            feedback = "Gut! Wiederhole die markierten Formen.";
        } else if (ratio >= 0.4) {
            feedback = "Du bist auf dem Weg – dranbleiben lohnt sich.";
        } else {
            feedback = "Guter Start. Übung macht den Lapicida. 💪";
        }

        const mistakes = history.filter((h) => !h.isCorrect);

        return (
            <div className="screen">
                <header className="top-bar">
                    <div className="app-title">Lapicida Latinus</div>
                    <button className="top-bar-btn" onClick={onExit}>
                        Zurück
                    </button>
                </header>
                <main className="content">
                    <h2>Runde beendet</h2>
                    <p>
                        {correctCount} von {totalCount} richtig.
                    </p>
                    <p>{feedback}</p>

                    {mistakes.length > 0 && (
                        <>
                            <h3>Diese Formen solltest du dir noch einmal ansehen:</h3>
                            {mistakes.map((m, i) => (
                                <div key={i} className="summary-card">
                                    {m.question.lemma && (
                                        <div className="summary-lemma">
                                            {m.question.lemma}{" "}
                                            {m.question.lemmaDe && `– ${m.question.lemmaDe}`}
                                        </div>
                                    )}
                                    <div className="summary-form">
                                        {m.question.prompt}
                                    </div>
                                    <div className="summary-correct-title">
                                        Richtige Bestimmung(en)
                                    </div>
                                    <div className="summary-correct-list">
                                        {m.correctOptions.map((opt, j) => (
                                            <div
                                                key={j}
                                                className="summary-correct-line"
                                            >
                                                {formatCaseNumberGender(opt)}
                                                {opt.de && ` – ${opt.de}`}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    <button className="primary-btn" onClick={onExit}>
                        Zurück zur Auswahl
                    </button>
                </main>
            </div>
        );
    }

    // ===== Aktive Frage / Ergebnis =====
    return (
        <div className="screen">
            <header className="top-bar">
                <div className="app-title">Lapicida Latinus</div>
                <div className="top-bar-center">
                    Frage {index + 1} / {total}
                </div>
                <button className="top-bar-btn" onClick={onExit}>
                    Zurück
                </button>
            </header>

            <main className="content">
                {/* Eingabe-Ansicht */}
                {!currentResult && current && (
                    <>
                        {(current.type === "noun" ||
                            current.type === "adj_context") && (
                                <QuestionNoun
                                    question={current}
                                    onAnswer={handleAnswer}
                                    showHelp={
                                        showHelp && current.type === "noun"
                                    }
                                />
                            )}
                    </>
                )}

                {/* Ergebnis-Ansicht */}
                {currentResult && !currentResult.done && (
                    <div className="result-card">
                        {currentResult.question.lemma && (
                            <div className="result-lemma">
                                {currentResult.question.lemma}{" "}
                                {currentResult.question.lemmaDe &&
                                    `– ${currentResult.question.lemmaDe}`}
                            </div>
                        )}

                        <div className="result-form">
                            {currentResult.question.prompt}
                        </div>

                        <div
                            className={
                                "result-status " +
                                (currentResult.isCorrect
                                    ? "correct"
                                    : "wrong")
                            }
                        >
                            {currentResult.isCorrect
                                ? "Richtig!"
                                : "Falsch!"}
                        </div>

                        <div className="result-correct-title">
                            Richtige Bestimmung(en)
                        </div>
                        <div className="result-correct-list">
                            {currentResult.correctOptions.map((opt, i) => (
                                <div
                                    key={i}
                                    className="result-correct-line"
                                >
                                    {formatCaseNumberGender(opt)}
                                    {opt.de && ` – ${opt.de}`}
                                </div>
                            ))}
                        </div>

                        {/* Paradigma nur für Nomen + Hilfe */}
                        {showHelp &&
                            currentResult.question.type === "noun" &&
                            currentResult.question.paradigm &&
                            currentResult.question.paradigm.length > 0 && (
                                <div className="paradigm-box">
                                    <div className="paradigm-title">
                                        Formenübersicht zu{" "}
                                        {currentResult.question.lemma}
                                        {currentResult.question.lemmaDe &&
                                            ` – ${currentResult.question.lemmaDe}`}
                                    </div>
                                    <div className="paradigm-header-row">
                                        <div className="paradigm-cell head">
                                            Kasus
                                        </div>
                                        <div className="paradigm-cell head">
                                            Singular
                                        </div>
                                        <div className="paradigm-cell head">
                                            Plural
                                        </div>
                                    </div>
                                    {currentResult.question.paradigm.map(
                                        (row, i) => (
                                            <div
                                                key={i}
                                                className="paradigm-row"
                                            >
                                                <div className="paradigm-cell case">
                                                    {row.case}
                                                </div>
                                                <div className="paradigm-cell form">
                                                    {row.singular || "–"}
                                                </div>
                                                <div className="paradigm-cell form">
                                                    {row.plural || "–"}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                        <button
                            className="primary-btn"
                            onClick={handleNext}
                        >
                            Weiter
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
