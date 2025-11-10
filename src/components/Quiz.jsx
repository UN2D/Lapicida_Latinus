// src/components/Quiz.jsx

import { useState } from "react";
import merksaetze from "../data/merksaetze.json";

import { QuestionNounAdj } from "./QuestionNounAdj";
import { QuestionAdjWithNoun } from "./QuestionAdjWithNoun";
import { QuestionConjunction } from "./QuestionConjunction";
import { QuestionVerb } from "./QuestionVerb";

// --------------------------------------------------
// Labels / Helfer
// --------------------------------------------------

const CASE_LABELS = {
    Nom: "Nominativ",
    Gen: "Genitiv",
    Dat: "Dativ",
    Akk: "Akkusativ",
    Abl: "Ablativ",
    Vok: "Vokativ"
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

function caseLabel(opt) {
    if (!opt) return "";
    const c = CASE_LABELS[opt.case] || opt.case || "";
    const n = NUMBER_LABELS[opt.number] || opt.number || "";
    const g = GENDER_LABELS[opt.gender] || opt.gender || "";
    return [c, n, g].filter(Boolean).join(" ");
}

// Anzeige im großen Feld
function getDisplayForm(q) {
    if (!q) return "";
    if (
        q.type === "adj_with_noun" ||
        q.type === "possessive" ||
        q.type === "demonstrative"
    ) {
        if (q.prompt) return q.prompt;
        if (q.promptNoun && q.promptAdj) {
            return `${q.promptAdj} ${q.promptNoun}`;
        }
    }
    return q.prompt;
}

// Einfacher Merksatz passend zu Topics
function findMerksatz(topics) {
    if (!topics || !topics.length) return null;
    const hits = merksaetze.filter((m) =>
        m.topics?.some((t) => topics.includes(t))
    );
    if (!hits.length) return null;
    return hits[Math.floor(Math.random() * hits.length)];
}

// kompakte Standard-Erklärung
function buildExplanation(currentResult, currentQuestion) {
    if (!currentResult || !currentQuestion) return null;
    const q = currentQuestion;

    if (q.type === "adj_with_noun" || q.type === "possessive") {
        return {
            headline: "Merke",
            text:
                "Kasus, Numerus und Genus von Adjektiv/Pronomen richten sich nach dem Bezugswort."
        };
    }

    if (q.type === "demonstrative") {
        return {
            headline: "Merke",
            text:
                q.usage ||
                "Demonstrativpronomen passen sich Kasus, Numerus und Genus ihres Bezugswortes an."
        };
    }

    if (q.type === "noun_adj_analyze") {
        return {
            headline: "Merke",
            text: "Bestimme Nomen über Kasus, Numerus und Genus im Satz."
        };
    }

    if (q.type === "verb") {
        return {
            headline: "Merke",
            text:
                "Bestimme Verbformen über Person, Numerus, Zeit, Modus und Genus (Aktiv/Passiv)."
        };
    }

    return null;
}

// --------------------------------------------------
// Quiz-Komponente
// --------------------------------------------------

export function Quiz({ round, onFinish }) {
    const [questions, setQuestions] = useState(round.questions || []);
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([]);
    const [currentResult, setCurrentResult] = useState(null);
    const [answered, setAnswered] = useState(false);

    const current = questions[index];

    // ------------------------------------------------
    // Summary, wenn keine Fragen oder alles durch
    // ------------------------------------------------

    if (!current || index >= questions.length) {
        const total = history.length;
        const correctCount = history.filter((h) => h.isCorrect).length;
        const mistakes = history.filter((h) => !h.isCorrect);
        const percent = total
            ? Math.round((correctCount / total) * 100)
            : 0;

        let feedback;
        if (total === 0) {
            feedback = "Keine Aufgaben in dieser Runde.";
        } else if (percent === 100) {
            feedback = "Fantastisch! Alles richtig. 🏅";
        } else if (percent >= 80) {
            feedback =
                "Sehr stark! Nur wenige Formen solltest du dir noch ansehen.";
        } else if (percent >= 60) {
            feedback =
                "Gut! Schau dir die folgenden Formen noch einmal in Ruhe an.";
        } else if (percent >= 40) {
            feedback =
                "Du bist auf dem richtigen Weg. Übe vor allem die Formen unten.";
        } else {
            feedback =
                "Guter Anfang – nimm dir besonders die folgenden Formen noch einmal vor.";
        }

        return (
            <div className="quiz">
                <div className="top-bar">
                    <div className="app-title">Lapicida Latinus</div>
                    <button className="top-back-btn" onClick={onFinish}>
                        Zurück
                    </button>
                </div>

                <div className="summary">
                    <h2>Runde beendet</h2>

                    {total > 0 && (
                        <p className="summary-score">
                            {correctCount} von {total} richtig ({percent}%)
                        </p>
                    )}

                    <p>{feedback}</p>

                    {mistakes.length > 0 && (
                        <>
                            <p>Diese Formen solltest du dir noch einmal ansehen:</p>
                            {mistakes.map((m, i) => {
                                const q = m.question;
                                const display = getDisplayForm(q);
                                const rd = m.resultData || {};
                                const correctList =
                                    rd.correctOptions || q.correctOptions || [];

                                return (
                                    <div key={i} className="summary-card">
                                        {q.lemma && (
                                            <div className="summary-lemma">
                                                ({q.lemma} – {q.lemmaDe})
                                            </div>
                                        )}
                                        <div className="summary-form">{display}</div>

                                        {correctList.length > 0 && (
                                            <div className="summary-correct-list">
                                                <div className="summary-correct-title">
                                                    Richtige Form(en)
                                                </div>
                                                {q.type === "verb"
                                                    ? correctList.map((opt, j) => (
                                                        <div
                                                            key={j}
                                                            className="summary-correct-line"
                                                        >
                                                            {opt.person}. Person {opt.number},{" "}
                                                            {opt.tense}, {opt.mood}, {opt.voice}
                                                        </div>
                                                    ))
                                                    : correctList.map((opt, j) => (
                                                        <div
                                                            key={j}
                                                            className="summary-correct-line"
                                                        >
                                                            {caseLabel(opt)}
                                                            {opt.de && ` – ${opt.de}`}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    <button className="start-btn" onClick={onFinish}>
                        Zurück zum Start
                    </button>
                </div>
            </div>
        );
    }

    // ------------------------------------------------
    // Antwort einsammeln
    // ------------------------------------------------

    const explanation = buildExplanation(currentResult, current);

    const handleAnswer = (isCorrect, detail) => {
        const q = current;
        if (!q) return;

        const correctOptions = q.correctOptions || [];

        // Bei erstem Fehler Frage einmal hinten anhängen
        if (!isCorrect && !q._repeatedOnce) {
            const updated = [...questions];
            updated.push({ ...q, _repeatedOnce: true });
            setQuestions(updated);
        }

        const merksatz = !isCorrect ? findMerksatz(q.topics) : null;

        const rd = {
            isCorrect,
            type: q.type,
            prompt: q.prompt,
            promptNoun: q.promptNoun,
            promptAdj: q.promptAdj,
            lemma: q.lemma,
            lemmaDe: q.lemmaDe,
            merksatz,
            correctOptions: [],
            detail // wichtig für "Deine Auswahl"
        };

        // Formen-Typen: alle korrekten Optionen aufheben
        if (
            q.type === "noun_adj_analyze" ||
            q.type === "adj_with_noun" ||
            q.type === "demonstrative" ||
            q.type === "possessive"
        ) {
            rd.correctOptions = correctOptions.map((opt) => ({ ...opt }));
        }

        // Verben: eindeutige Bestimmung
        if (q.type === "verb") {
            const opt = correctOptions[0] || {};
            rd.correctOptions = [opt];
        }

        // Konjunktionen
        if (q.type === "conjunction") {
            rd.correctLabel = q.correct?.type;
            rd.german = q.correct
                ? `${q.correct.meaning} – ${q.correct.explanation}`
                : "";
        }

        setHistory((prev) => [
            ...prev,
            {
                question: q,
                isCorrect,
                detail,
                merksatz,
                resultData: rd
            }
        ]);

        setCurrentResult(rd);
        setAnswered(true);
    };

    const goNext = () => {
        if (!answered) return;
        const next = index + 1;
        setAnswered(false);
        setCurrentResult(null);
        if (next >= questions.length) {
            setIndex(questions.length); // Summary
        } else {
            setIndex(next);
        }
    };

    const display = getDisplayForm(current);

    // ------------------------------------------------
    // Render: aktive Frage
    // ------------------------------------------------

    return (
        <div className="quiz">
            {/* Top-Leiste */}
            <div className="top-bar">
                <div className="app-title">Lapicida Latinus</div>
                <button className="top-back-btn" onClick={onFinish}>
                    Zurück
                </button>
            </div>

            {/* Fortschritt */}
            <div className="quiz-header">
                <h2>
                    Frage {index + 1} / {questions.length}
                </h2>
                {/* Abbrechen-Button optional, aktuell ausgeblendet */}
                {/* <button className="abort-btn" onClick={onFinish}>Abbrechen</button> */}
            </div>

            {/* Eingabe-Ansicht */}
            {!answered && (
                <>
                    {/* Form-Karte */}
                    <div className="form-card">
                        <div className="form-text">{display}</div>
                        {current.lemma && (
                            <div className="form-lemma">
                                ({current.lemma} – {current.lemmaDe})
                            </div>
                        )}
                    </div>

                    {/* Fragetyp-spezifisch */}
                    {current.type === "noun_adj_analyze" && (
                        <QuestionNounAdj question={current} onAnswer={handleAnswer} />
                    )}

                    {current.type === "adj_with_noun" && (
                        <QuestionAdjWithNoun
                            question={current}
                            onAnswer={handleAnswer}
                        />
                    )}

                    {current.type === "demonstrative" && (
                        <QuestionNounAdj question={current} onAnswer={handleAnswer} />
                    )}

                    {current.type === "possessive" && (
                        <QuestionNounAdj question={current} onAnswer={handleAnswer} />
                    )}

                    {current.type === "verb" && (
                        <QuestionVerb question={current} onAnswer={handleAnswer} />
                    )}

                    {current.type === "conjunction" && (
                        <QuestionConjunction
                            question={current}
                            onAnswer={handleAnswer}
                        />
                    )}
                </>
            )}

            {/* Ergebnis-Ansicht */}
            {answered && currentResult && (
                <>
                    {/* Form-Karte bleibt stehen */}
                    <div className="form-card">
                        <div className="form-text">{display}</div>
                        {current.lemma && (
                            <div className="form-lemma">
                                ({current.lemma} – {current.lemmaDe})
                            </div>
                        )}
                    </div>

                    {/* Result-Box */}
                    <div
                        className={
                            "result-box " +
                            (currentResult.isCorrect
                                ? "result-correct"
                                : "result-wrong")
                        }
                    >
                        <div className="result-title">
                            {currentResult.isCorrect ? "Richtig!" : "Falsch!"}
                        </div>

                        {/* Deine Auswahl bei Fehler */}
                        {current.type !== "conjunction" &&
                            currentResult.isCorrect === false &&
                            currentResult.detail &&
                            currentResult.detail.userAnswer && (
                                <div className="result-line">
                                    <span className="result-label">
                                        Deine Auswahl:
                                    </span>{" "}
                                    {(() => {
                                        const ua = currentResult.detail.userAnswer;
                                        if (current.type === "verb") {
                                            const {
                                                person,
                                                number,
                                                tense,
                                                mood,
                                                voice
                                            } = ua;
                                            return `${person}. Person ${number}, ${tense}, ${mood}, ${voice} (nicht passend)`;
                                        }
                                        return `${caseLabel(ua)} (nicht passend)`;
                                    })()}
                                </div>
                            )}

                        {/* Richtige Form(en) */}
                        <div className="result-subtitle">Richtige Form(en)</div>

                        {/* Nomen / Adj / Demo / Poss */}
                        {(current.type === "noun_adj_analyze" ||
                            current.type === "adj_with_noun" ||
                            current.type === "demonstrative" ||
                            current.type === "possessive") &&
                            currentResult.correctOptions &&
                            currentResult.correctOptions.length > 0 && (
                                <div className="result-list">
                                    {currentResult.correctOptions.map((opt, i) => (
                                        <div key={i} className="result-line-strong">
                                            {caseLabel(opt)}
                                            {opt.de && ` – ${opt.de}`}
                                        </div>
                                    ))}
                                </div>
                            )}

                        {/* Verben */}
                        {current.type === "verb" &&
                            currentResult.correctOptions &&
                            currentResult.correctOptions.length > 0 && (
                                <div className="result-list">
                                    {currentResult.correctOptions.map((opt, i) => (
                                        <div key={i} className="result-line-strong">
                                            {opt.person}. Person {opt.number},{" "}
                                            {opt.tense}, {opt.mood}, {opt.voice}
                                        </div>
                                    ))}
                                </div>
                            )}

                        {/* Konjunktionen */}
                        {current.type === "conjunction" && (
                            <div className="result-list">
                                {currentResult.correctLabel && (
                                    <div className="result-line-strong">
                                        {currentResult.correctLabel}
                                    </div>
                                )}
                                {currentResult.german && (
                                    <div className="result-line">
                                        {currentResult.german}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Merkkasten */}
                    {(explanation || currentResult.merksatz) && (
                        <div className="merged-hint-box">
                            {explanation && (
                                <div className="merke-line">
                                    {explanation.headline}: {explanation.text}
                                </div>
                            )}
                            {currentResult.merksatz && (
                                <div className="merke-line merke-line-secondary">
                                    Merksatz: {currentResult.merksatz.text}
                                </div>
                            )}
                        </div>
                    )}

                    <button className="start-btn" onClick={goNext}>
                        Weiter
                    </button>
                </>
            )}
        </div>
    );
}
