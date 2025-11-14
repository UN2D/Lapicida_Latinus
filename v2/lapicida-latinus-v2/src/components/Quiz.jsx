// src/Quiz.jsx
import React, { useState } from "react";
import { QuestionNoun } from "./QuestionNoun";
import { QuestionAdjContext } from "./QuestionAdjContext";
import { formatVerbSpec } from "../core/generators/verbs";
import QuestionVerb from "./QuestionVerb.jsx";


const GEND_DE = { m: "maskulin", f: "feminin", n: "neutrum" };

export function Quiz({ round, onExit }) {
    const { questions = [], showHelp = false } = round || {};
    const [index, setIndex] = useState(0);
    const [currentResult, setCurrentResult] = useState(null);
    const [history, setHistory] = useState([]);

    const total = questions.length;
    const current = questions[index] || null;

    if (!total) {
        return (
            <div className="screen">
                <header className="top-bar">
                    <div className="app-title">Lapicida Latinus</div>
                    <button className="top-bar-btn" onClick={onExit}>Zurück</button>
                </header>
                <main className="content">
                    <p>Für diese Auswahl wurden keine Aufgaben gefunden.</p>
                    <button className="primary-btn" onClick={onExit}>Zurück zur Auswahl</button>
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
            correctOptions,
            type: q?.type,
            lemma: q?.lemma,
            lemmaDe: q?.lemmaDe,
            paradigm: q?.paradigm || null,
        };

        setHistory((p) => [...p, result]);
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

    // === Summary ===
    if (currentResult && currentResult.done) {
        const correctCount = history.filter((h) => h.isCorrect).length;
        const totalCount = history.length || total;
        return (
            <div className="screen">
                <header className="top-bar">
                    <div className="app-title">Lapicida Latinus</div>
                    <button className="top-bar-btn" onClick={onExit}>Zurück</button>
                </header>
                <main className="content">
                    <h2>Runde beendet</h2>
                    <p>{correctCount} von {totalCount} richtig.</p>
                    <button className="primary-btn" onClick={onExit}>Zurück zur Auswahl</button>
                </main>
            </div>
        );
    }

    return (
        <div className="screen">
            <header className="top-bar">
                <div className="app-title">Lapicida Latinus</div>
                <div className="top-bar-center">Frage {index + 1} / {total}</div>
                <button className="top-bar-btn" onClick={onExit}>Zurück</button>
            </header>

            <main className="content">
                {/* Frage-Ansicht */}
                {!currentResult && current && (
                    <>
                        {current.type === "noun" && (
                            <QuestionNoun question={current} onAnswer={handleAnswer} showHelp={showHelp} />
                        )}
                        {current.type === "adj_context" && (
                            <QuestionAdjContext question={current} onAnswer={handleAnswer} showHelp={showHelp} />
                        )}
                        {current.type === "verb" && (
                            // <QuestionVerb …> – Kommt im nächsten Schritt, wenn du willst.
                            // Bis dahin kann die Runde korrekt erzeugt werden.
                            <QuestionVerb
                                question={current}
                                onAnswer={handleAnswer}
                                showHelp={showHelp && current.type === "verb"}
                            />
                        )}
                    </>
                )}

                {/* Ergebnis-Ansicht */}
                {currentResult && !currentResult.done && (
                    <div className="result-card">
                        {currentResult.question.lemma && (
                            <div className="result-lemma">
                                {currentResult.question.lemma}
                                {currentResult.question.lemmaDe && ` – ${currentResult.question.lemmaDe}`}
                            </div>
                        )}

                        <div className="result-form">{currentResult.question.prompt}</div>

                        <div className={"result-status " + (currentResult.isCorrect ? "correct" : "wrong")}>
                            {currentResult.isCorrect ? "Richtig!" : "Falsch!"}
                        </div>

                        <div className="result-correct-title">Richtige Bestimmung(en)</div>
                        <div className="result-correct-list">
                            {currentResult.correctOptions.map((opt, i) => (
                                <div key={i} className="result-correct-line">
                                    {currentResult.question.type === "verb"
                                        ? formatVerbSpec(opt)
                                        : <>
                                            {opt.case && opt.number && opt.gender
                                                ? `${opt.case} ${opt.number} ${opt.gender}`
                                                : ""}
                                            {opt.de ? ` – ${opt.de}` : ""}
                                        </>
                                    }
                                </div>
                            ))}
                        </div>

                        {/* Adjektiv-Hilfe (Fix: GEND_DE) */}
                        {currentResult.paradigm && Array.isArray(currentResult.paradigm) && showHelp && (
                            <div className="paradigm-box">
                                <div className="paradigm-title">
                                    Formenübersicht zu {currentResult.lemma}
                                    {currentResult.paradigmGender ? ` (${GEND_DE[currentResult.paradigmGender]})` : ""}
                                    {` – ${currentResult.lemmaDe}`}
                                </div>
                                <table className="paradigm-table">
                                    <colgroup>
                                        <col className="col-case" />
                                        <col className="col-sing" />
                                        <col className="col-plur" />
                                    </colgroup>
                                    <thead>
                                        <tr><th>Kasus</th><th>Singular</th><th>Plural</th></tr>
                                    </thead>
                                    <tbody>
                                        {currentResult.paradigm.map((row, i) => (
                                            <tr key={i}>
                                                <td className="col-case">{row.case}</td>
                                                <td className="cell-form">{row.singular}</td>
                                                <td className="cell-form">{row.plural}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <button className="primary-btn large" onClick={handleNext}>Weiter</button>
                    </div>
                )}
            </main>
        </div>
    );
}
