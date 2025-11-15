// src/components/Quiz.jsx
import React, { useState } from "react";

// Frage-Komponenten (bestehend)
import { QuestionNoun } from "./QuestionNoun";
import { QuestionAdjContext } from "./QuestionAdjContext";
import QuestionVerb from "./QuestionVerb.jsx";

// Verb-Helfer für die Ergebniszeile
import { formatVerbSpec } from "../core/generators/verbs";


// Lokale Maps für die Anzeige (wie bisher)
const CASE_DE = { Nom: "Nominativ", Gen: "Genitiv", Dat: "Dativ", Akk: "Akkusativ", Abl: "Ablativ" };
const NUM_DE = { Sg: "Singular", Pl: "Plural" };
const GEND_DE = { m: "maskulin", f: "feminin", n: "neutrum" };

/**
 * Nomen/Adjektiv: "Genitiv Plural neutrum"
 */
function formatCaseNumberGender(o = {}) {
    const c = CASE_DE[o.case] || o.case || "";
    const n = NUM_DE[o.number] || o.number || "";
    const g = GEND_DE[o.gender] || o.gender || "";
    return [c, n, g].filter(Boolean).join(" ");
}

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

    /**
     * Callback aus den Frage-Komponenten
     */
    const handleAnswer = (isCorrect, detail) => {
        const q = current;
        if (!q) return;

        const result = {
            question: q,
            isCorrect,
            userAnswer: detail?.userAnswer || null,
            attempts: detail?.attempts || 1,
            correctOptions: q.correctOptions || [],
            type: q.type,
            lemma: q.lemma,
            lemmaDe: q.lemmaDe,
            paradigm: q.paradigm || null,
            paradigmGender: q.paradigmGender || null,
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

    // ==== Abschlussseite ====
    if (currentResult && currentResult.done) {
        const correctCount = history.filter((h) => h.isCorrect).length;
        const totalCount = history.length || total;
        const mistakes = history.filter((h) => !h.isCorrect);
        return (
            <div className="screen">
                <header className="top-bar">
                    <div className="app-title">Lapicida Latinus</div>
                    <button className="top-bar-btn" onClick={onExit}>Zurück</button>
                </header>

                <main className="content">
                    <h2>Runde beendet</h2>
                    <p>{correctCount} von {totalCount} richtig.</p>

                    {mistakes.length > 0 && (
                        <>
                            <h3>Diese Formen solltest du dir ansehen:</h3>
                            {mistakes.map((m, i) => (
                                <div key={i} className="summary-card">
                                    {m.question.lemma && (
                                        <div className="summary-lemma">
                                            {m.question.lemma} {m.question.lemmaDe ? `– ${m.question.lemmaDe}` : ""}
                                        </div>
                                    )}
                                    <div className="summary-form">{m.question.prompt}</div>

                                    <div className="summary-correct-title">Richtige Bestimmung(en)</div>
                                    <div className="summary-correct-list">
                                        {m.correctOptions.map((opt, j) => {
                                            // Nomen/Adjektiv
                                            if (m.type === "noun" || m.type === "adj_context") {
                                                const c = CASE_DE[opt.case] || opt.case || "";
                                                const n = NUM_DE[opt.number] || opt.number || "";
                                                const g = GEND_DE[opt.gender] || opt.gender || "";
                                                const label = [c, n, g].filter(Boolean).join(" ");
                                                const line = opt.de && opt.de.startsWith(label) ? opt.de
                                                    : opt.de ? `${label} – ${opt.de}`
                                                        : label;
                                                return <div key={j} className="summary-correct-line">{line}</div>;
                                            }
                                            // Verben
                                            const verbLine = formatVerbSpec(opt);
                                            const line = opt.de && opt.de.startsWith(verbLine) ? opt.de
                                                : opt.de ? `${verbLine} – ${opt.de}`
                                                    : verbLine;
                                            return <div key={j} className="summary-correct-line">{line}</div>;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

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

                {/* === FRAGE === */}
                {!currentResult && current && (
                    <>
                        {current.type === "noun" && (
                            <QuestionNoun
                                question={current}
                                onAnswer={handleAnswer}
                                showHelp={showHelp}
                            />
                        )}

                        {current.type === "adj_context" && (
                            <QuestionAdjContext
                                question={current}
                                onAnswer={handleAnswer}
                                showHelp={showHelp}
                            />
                        )}

                        {current.type === "verb" && (
                            <QuestionVerb
                                question={current}
                                onAnswer={handleAnswer}
                                showHelp={showHelp}
                            />
                        )}
                    </>
                )}

                {/* === ERGEBNIS === */}
                {currentResult && !currentResult.done && (
                    <div className="result-card">

                        {/* Lemma-Zeile */}
                        {currentResult.question.lemma && (
                            <div className="result-lemma">
                                {currentResult.question.lemma}
                                {currentResult.question.lemmaDe && ` – ${currentResult.question.lemmaDe}`}
                            </div>
                        )}

                        {/* Großes Formfeld */}
                        <div className="result-form">{currentResult.question.prompt}</div>

                        {/* Richtig/Falsch */}
                        <div className={"result-status " + (currentResult.isCorrect ? "correct" : "wrong")}>
                            {currentResult.isCorrect ? "Richtig!" : "Falsch!"}
                        </div>

                        {/* Richtige Bestimmung(en) */}
                        <div className="result-correct-title">Richtige Bestimmung(en)</div>

                        {/* — NOMEN & ADJEKTIVE — */}
                        {(currentResult.question.type === "noun" || currentResult.question.type === "adj_context") && (
                            <div className="result-correct-list">
                                {(currentResult.correctOptions || []).map((opt, i) => {
                                    const label = formatCaseNumberGender(opt); // "Genitiv Plural neutrum"
                                    // Doppelung vermeiden, falls opt.de bereits mit dem Label startet
                                    const line = opt.de && opt.de.startsWith(label)
                                        ? opt.de
                                        : opt.de
                                            ? `${label} – ${opt.de}`
                                            : label;

                                    return <div key={i} className="result-correct-line">{line}</div>;
                                })}
                            </div>
                        )}

                        {/* — VERBEN — */}
                        {currentResult?.question?.type === "verb" && (
                            <>
                                {(currentResult.question.helpGloss || currentResult.question.helpExample) && (
                                    <div className="example-box">
                                        {currentResult.question.helpGloss && (
                                            <div className="ex-gloss">
                                                {currentResult.question.helpGloss}
                                            </div>
                                        )}
                                        {currentResult.question.helpExample && (
                                            <div className="ex-la">
                                                <em>
                                                    {currentResult.question.helpExample.latin?.replace(/\.$/, "")}
                                                    {" – "}
                                                    {currentResult.question.helpExample.german?.replace(/\.$/, "")}
                                                </em>
                                            </div>
                                        )}
                                        {Array.isArray(currentResult.question.helpExample?.hints) &&
                                            currentResult.question.helpExample.hints.length > 0 && (
                                                <ul className="ex-hints">
                                                    {currentResult.question.helpExample.hints.map((h, i) => (
                                                        <li key={i}>{h}</li>
                                                    ))}
                                                </ul>
                                            )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* === HILFE: Nomen / Adjektive – Paradigma === */}
                        {showHelp &&
                            (currentResult.question.type === "noun" || currentResult.question.type === "adj_context") &&
                            currentResult.paradigm &&
                            Array.isArray(currentResult.paradigm) && (
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
                                            <tr>
                                                <th>Kasus</th>
                                                <th>Singular</th>
                                                <th>Plural</th>
                                            </tr>
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

                        {/* === HILFE: Verben – Beispiel + Paradigma === */}
                        {currentResult.question.type === "verb" &&
                            currentResult.question.helpParadigm &&
                            Array.isArray(currentResult.question.helpParadigm) && (

                                <div className="paradigm-box">
                                    {currentResult.question.helpExample && (
                                        <div className="example-box">
                                            <div className="ex-la">
                                                <em>{currentResult.question.helpExample.latin} - {currentResult.question.helpExample.german}</em>
                                            </div>
                                            {currentResult.question.helpExample.hints?.length > 0 && (
                                                <ul className="ex-hints">
                                                    {currentResult.question.helpExample.hints.map((h, i) => <li key={i}>{h}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    <div className="paradigm-title">
                                        Formenübersicht: {currentResult.question.lemma} – {currentResult.question.lemmaDe}
                                    </div>

                                    <table className="paradigm-table">
                                        <colgroup>
                                            <col className="col-case" />
                                            <col className="col-sing" />
                                            <col className="col-plur" />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th>Person</th>
                                                <th>Singular</th>
                                                <th>Plural</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentResult.question.helpParadigm.map((row, i) => (
                                                <tr key={i}>
                                                    <td className="col-case">{i + 1}.</td>
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

export default Quiz;
