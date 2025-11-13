// src/App.jsx
import { useState, useMemo } from "react";
import { generateRound } from "./core/generateRound";
import { Quiz } from "./components/Quiz";
import nounsAdjectives from "./data/nounsAdjectives.json";
import "./index.css";

const QUESTION_COUNTS = [5, 10, 20];

const CATEGORIES = {
  nouns: "Substantive",
  adj_context: "Adjektive",
  verbs: "Verben",
};


export default function App() {

  const [category, setCategory] = useState("nouns");
  const [selectedLemmas, setSelectedLemmas] = useState([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [showHelp, setShowHelp] = useState(true);
  const [round, setRound] = useState(null);

  const nounLemmas = useMemo(() => {
    const set = new Set(
      nounsAdjectives
        .filter((e) => e.pos === "noun" && e.lemma)
        .map((e) => e.lemma)
    );
    return Array.from(set).sort();
  }, []);

  const adjLemmas = useMemo(() => {
    const set = new Set(
      nounsAdjectives
        .filter((e) => e.pos === "adj" && e.lemma)
        .map((e) => e.lemma)
    );
    return Array.from(set).sort();
  }, []);

  const verbLemmas = useMemo(() => [
    "laudare", "videre", "capere", "mittere", "audire",
    "esse", "posse", "ire", "ferre", "velle", "nolle", "malle", "fieri"
  ], []);

  const toggleLemma = (lemma) => {
    setSelectedLemmas((prev) =>
      prev.includes(lemma)
        ? prev.filter((l) => l !== lemma)
        : [...prev, lemma]
    );
  };

  const resetToMain = () => {
    setRound(null);
    setSelectedLemmas([]);
    setNumQuestions(5);
  };

  const isStartDisabled = () => {
    if (category === "nouns" || category === "adj_context" || category === "verbs") {
      return selectedLemmas.length === 0;
    }
    return true;
  };

  const handleStart = () => {
    const { questions, ...rest } = generateRound({
      category,
      lemmas: selectedLemmas,
      numQuestions,
      showHelp,
    });

    setRound({
      category,
      ...rest,
      questions,
    });
  };

  const handleExitQuiz = () => {
    resetToMain();
  };

  if (round) {
    return <Quiz round={round} onExit={handleExitQuiz} />;
  }

  return (
    <div className="screen">
      <header className="top-bar">
        <div className="app-title">Lapicida Latinus</div>
        <div className="top-bar-center">Training</div>
        <div className="top-bar-right">v0.2</div>
      </header>

      <main className="content">
        {/* Kategorie */}
        <section className="section">
          <div className="section-title">Kategorie</div>
          <div className="pill-row">
            <button
              className={
                "pill-btn" + (category === "nouns" ? " selected" : "")
              }
              onClick={() => {
                setCategory("nouns");
                setSelectedLemmas([]);
              }}
            >
              {CATEGORIES.nouns}
            </button>
            <button
              className={
                "pill-btn" +
                (category === "adj_context" ? " selected" : "")
              }
              onClick={() => {
                setCategory("adj_context");
                setSelectedLemmas([]);
              }}
            >
              {CATEGORIES.adj_context}
            </button>
            <button
              className={
                "pill-btn" +
                (category === "verbs" ? " selected" : "")
              }
              onClick={() => {
                setCategory("verbs");
                setSelectedLemmas([]);
              }}
            >
              {CATEGORIES.verbs}
            </button>
          </div>
        </section>

        {/* Lemma-Auswahl */}
        {category === "nouns" && (
          <section className="section">
            <div className="section-title">
              Substantive wählen
            </div>
            <div className="pill-row lemma-row">
              {nounLemmas.map((lemma) => (
                <button
                  key={lemma}
                  className={
                    "pill-btn lemma-btn" +
                    (selectedLemmas.includes(lemma)
                      ? " selected"
                      : "")
                  }
                  onClick={() => toggleLemma(lemma)}
                >
                  {lemma}
                </button>
              ))}
            </div>
          </section>
        )}

        {category === "adj_context" && (
          <section className="section">
            <div className="section-title">
              Adjektive wählen
            </div>
            <div className="pill-row lemma-row">
              {adjLemmas.map((lemma) => (
                <button
                  key={lemma}
                  className={
                    "pill-btn lemma-btn" +
                    (selectedLemmas.includes(lemma)
                      ? " selected"
                      : "")
                  }
                  onClick={() => toggleLemma(lemma)}
                >
                  {lemma}
                </button>
              ))}
            </div>
          </section>
        )}

        {category === "verbs" && (
          <section className="section">
            <div className="section-title">Verben wählen</div>
            <div className="pill-row lemma-row">
              {verbLemmas.map((lemma) => (
                <button
                  key={lemma}
                  className={
                    "pill-btn lemma-btn" +
                    (selectedLemmas.includes(lemma) ? " selected" : "")
                  }
                  onClick={() => toggleLemma(lemma)}
                >
                  {lemma}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Anzahl Aufgaben */}
        <section className="section">
          <div className="section-title">Anzahl Aufgaben</div>
          <div className="pill-row">
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                className={
                  "pill-btn" +
                  (numQuestions === n ? " selected" : "")
                }
                onClick={() => setNumQuestions(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {/* Hilfe */}
        <section className="section">
          <div className="section-title">Hilfetabellen</div>
          <div className="pill-row">
            <button
              className={
                "pill-btn" + (showHelp ? " selected" : "")
              }
              onClick={() => setShowHelp(true)}
            >
              An
            </button>
            <button
              className={
                "pill-btn" + (!showHelp ? " selected" : "")
              }
              onClick={() => setShowHelp(false)}
            >
              Aus
            </button>
          </div>
        </section>

        {/* Start */}
        <section className="section">
          <button
            className={
              "primary-btn wide" +
              (isStartDisabled() ? " disabled" : "")
            }
            disabled={isStartDisabled()}
            onClick={handleStart}
          >
            SPIELEN
          </button>
          {isStartDisabled() && (
            <p className="section-hint">
              Bitte zuerst mindestens ein Lemma auswählen.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
