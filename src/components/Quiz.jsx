// src/components/Quiz.jsx

import { useState } from "react";
import merksaetze from "../data/merksaetze.json";

import { QuestionNounAdj } from "./QuestionNounAdj";
import { QuestionAdjWithNoun } from "./QuestionAdjWithNoun";
import { QuestionVerb } from "./QuestionVerb";
import { QuestionConjunction } from "./QuestionConjunction";

// ---------------- Labels & Helfer ----------------

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

function getDisplayForm(q) {
    if (!q) return "";
    if (
        q.type === "adj_with_noun" ||
        q.type === "demonstrative" ||
        q.type === "possessive"
    ) {
        if (q.prompt) return q.prompt;
        if (q.promptAdj && q.promptNoun) return `${q.promptAdj} ${q.promptNoun}`;
    }
    return q.prompt;
}

function findMerksatz(topics) {
    if (!topics || !topics.length) return null;
    const hits = merksaetze.filter((m) =>
        m.topics?.some((t) => topics.includes(t))
    );
    if (!hits.length) return null;
    return hits[Math.floor(Math.random() * hits.length)];
}

function buildExplanation(q) {
    if (!q) return null;

    if (q.type === "adj_with_noun" || q.type === "possessive") {
        return "Kasus, Numerus und Genus des Adjektivs/Pronomens richten sich nach dem Bezugswort.";
    }
    if (q.type === "demonstrative") {
        return (
            q.usage ||
            "Demonstrativpronomen passen sich Kasus, Numerus und Genus ihres Bezugswortes an."
        );
    }
    if (q.type === "noun_adj_analyze") {
        return "Bestimme Nomen über Kasus, Numerus und Genus im Satz.";
    }
    if (q.type === "verb") {
        return "Bestimme Verbformen über Person, Numerus, Zeit, Modus und Genus (Aktiv/Passiv).";
    }
    return null;
}

// ---------------- Quiz-Komponente ----------------

export function Quiz({ round, onFinish }) {
    const [questions, setQuestions] = useState(round.questions || []);
    const [index, setIndex] = useState(0);
    const [currentResult, setCurrentResult] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [mistakes, setMistakes] = useState([]);
    const [finished, setFinished] = useState(false);

    const total = questions.length;
    const current = questions[index] || null;

    // Fallback: keine Fragen
    if (!total) {
        return (
            <div className="app">
                <header className="top-bar">
                    <div className="top-title">Lapicida Latinus</div>
                    <button className="top-back-btn" onClick={onFinish}>
                        Zurück
                    </button>
                </header>
                <main className="screen">
                    <h1>Keine Aufgaben gefunden</h1>
                    <p>
                        Bitte auf dem Startbildschirm passende Wörter / Pronomen auswählen.
                    </p>
                    <button className="start-btn" onClick={onFinish}>
                        Zurück zum Start
                    </button>
                </main>
            </div>
        );
    }

    // ---------------- Zusammenfassung ----------------

    if (finished) {
        const correctCount = questions.filter((q) => q._isCorrect).length;
        const percent = Math.round((correctCount / total) * 100);

        let feedback = "Gut gemacht!";
        if (percent < 40) feedback = "Dranbleiben! Übung macht den Lapicida. 😉";
        else if (percent < 60) feedback = "Schon einiges richtig – weiter üben!";
        else if (percent < 80) feedback = "Sehr ordentlich! Noch ein Durchgang?";
        else if (percent < 100) feedback = "Stark! Fast alles richtig.";
        else feedback = "Perfekt! Alle Formen korrekt. 🎉";

        return (
            <div className="app">
                <header className="top-bar">
                    <div className="top-title">Lapicida Latinus</div>
                    <button className="top-back-btn" onClick={onFinish}>
                        Zurück
                    </button>
                </header>

                <main className="screen">
                    <div className="summary">
                        <h1>Runde beendet</h1>
                        <p className="summary-score">
                            {correctCount} von {total} richtig ({percent}%)
                        </p>
                        <p className="summary-feedback">{feedback}</p>

                        {mistakes.length > 0 && (
                            <>
                                <p>Diese Formen solltest du dir noch einmal ansehen:</p>
                                {mistakes.map((m, i) => {
                                    const q = m.question;
                                    const display = getDisplayForm(q);
                                    const correctList =
                                        m.correctOptions || q.correctOptions || [];

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
                </main>

                <footer className="bottom-bar">
                    <div>v0.8 Beta</div>
                </footer>
            </div>
        );
    }

    // ---------------- Aktuelle Frage ----------------

    const display = getDisplayForm(current);

    const handleAnswer = (isCorrect, detail) => {
        if (!current) return;

        const correctOptions = current.correctOptions || [];
        const explanation = buildExplanation(current);
        const merksatz = !isCorrect ? findMerksatz(current.topics) : null;

        const result = {
            isCorrect,
            type: current.type,
            detail,
            correctOptions,
            explanation,
            merksatz
        };

        // einmalige Wiederholung bei Fehler
        if (!isCorrect && !current._repeatedOnce) {
            const updated = [...questions];
            updated.push({ ...current, _repeatedOnce: true });
            setQuestions(updated);
        }

        // Fehler für Summary merken
        if (!isCorrect) {
            setMistakes((prev) => [
                ...prev,
                {
                    question: current,
                    correctOptions
                }
            ]);
        }

        // Flag auf Frage für Summary
        current._isCorrect = isCorrect;

        setCurrentResult(result);
        setAnswered(true);
    };

    const goNext = () => {
        if (index + 1 >= questions.length) {
            setFinished(true);
        } else {
            setIndex(index + 1);
            setAnswered(false);
            setCurrentResult(null);
        }
    };

    // ---------------- Render ----------------

    return (
        <div className="app">
            <header className="top-bar">
                <div className="top-title">Lapicida Latinus</div>
                <button className="top-back-btn" onClick={onFinish}>
                    Zurück
                </button>
            </header>

            <main className="screen">
                <div className="quiz-header">
                    <div className="quiz-progress">
                        Frage {index + 1} / {questions.length}
                    </div>
                </div>

                {/* Form-Karte oben */}
                <div className="form-card">
                    <div className="form-text">{display}</div>
                    {current.lemma && (
                        <div className="form-lemma">
                            ({current.lemma} – {current.lemmaDe})
                        </div>
                    )}
                </div>

                {/* Auswahl oder Ergebnis */}
                {!answered && (
                    <>
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
                            <QuestionNounAdj
                                question={current}
                                onAnswer={handleAnswer}
                            />
                        )}

                        {current.type === "possessive" && (
                            <QuestionNounAdj
                                question={current}
                                onAnswer={handleAnswer}
                            />
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

                {answered && currentResult && (
                    <>
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

                            {/* Deine Auswahl (nur bei Fehlern) */}
                            {!currentResult.isCorrect &&
                                currentResult.detail &&
                                currentResult.detail.userAnswer && (
                                    <div className="result-line">
                                        <span className="result-label">Deine Auswahl:</span>{" "}
                                        {(() => {
                                            const ua = currentResult.detail.userAnswer;
                                            if (current.type === "verb") {
                                                const { person, number, tense, mood, voice } = ua;
                                                return `${person}. Person ${number}, ${tense}, ${mood}, ${voice} (nicht passend)`;
                                            }
                                            return `${caseLabel(ua)} (nicht passend)`;
                                        })()}
                                    </div>
                                )}

                            {/* Richtige Formen */}
                            <div className="result-subtitle">Richtige Form(en)</div>
                            <div className="result-list">
                                {current.type === "verb"
                                    ? (current.correctOptions || []).map((opt, i) => (
                                        <div key={i} className="result-line-strong">
                                            {opt.person}. Person {opt.number},{" "}
                                            {opt.tense}, {opt.mood}, {opt.voice}
                                        </div>
                                    ))
                                    : (current.correctOptions || []).map((opt, i) => (
                                        <div key={i} className="result-line-strong">
                                            {caseLabel(opt)}
                                            {opt.de && ` – ${opt.de}`}
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Merksatz / Erklärung */}
                        {(currentResult.explanation || currentResult.merksatz) && (
                            <div className="hint-box">
                                <strong>Merke:</strong>{" "}
                                {currentResult.merksatz || currentResult.explanation}
                            </div>
                        )}

                        <button className="start-btn" onClick={goNext}>
                            Weiter
                        </button>
                    </>
                )}
            </main>

            <footer className="bottom-bar">
                <div>v0.8 Beta</div>
            </footer>
        </div>
    );
}
