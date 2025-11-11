// src/App.jsx
import { useState, useMemo } from "react";
import { generateRound } from "./logic/generateRound";
import { Quiz } from "./components/Quiz";
import nounsAdjectives from "./data/nounsAdjectives.json";
import "./index.css";

/**
 * Hauptbildschirm:
 * - Kategorie wählen
 * - Lemmata wählen (Substantive, Adjektive im Kontext)
 * - Anzahl Aufgaben
 * - Hilfetabellen an/aus (nur für passende Kategorien genutzt)
 * - Start -> Quiz
 */

const CATEGORIES = {
  nouns: "Substantive",
  adj_context: "Adjektive im Kontext",
  verbs: "Verben"
};

const QUESTION_COUNTS = [5, 10, 20];

export default function App() {
  const [category, setCategory] = useState("nouns");

  // gemeinsam genutzt: ausgewählte Lemmata der aktuellen Kategorie
  const [selectedLemmas, setSelectedLemmas] = useState([]);

  const [numQuestions, setNumQuestions] = useState(5);
  const [showHelp, setShowHelp] = useState(true);

  const [round, setRound] = useState(null);

  // -------- Lemmalisten aus nounsAdjectives --------

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

  // -------- Hilfsfunktionen --------

  const resetToMain = () => {
    setRound(null);
    setSelectedLemmas([]);
    setNumQuestions(5);
    // showHelp bleibt bewusst erhalten (User-Präferenz)
  };

  const toggleLemma = (lemma) => {
    setSelectedLemmas((prev) =>
      prev.includes(lemma)
        ? prev.filter((l) => l !== lemma)
        : [...prev, lemma]
    );
  };

  const isStartDisabled = () => {
    // Für aktive Kategorien: mindestens ein Lemma
    if (category === "nouns" || category === "adj_context") {
      return selectedLemmas.length === 0;
    }
    // Verben aktuell nicht implementiert
    if (category === "verbs") return true;
    return true;
  };

  const handleStart = () => {
    if (isStartDisabled()) return;

    const newRound = generateRound({
      category,
      lemmas: selectedLemmas,
      numQuestions,
      showHelp
    });

    setRound(newRound);
  };

  const handleExitQuiz = () => {
    resetToMain();
  };

  // Wenn eine Runde aktiv ist -> Quiz anzeigen
  if (round) {
    return <Quiz round={round} onExit={handleExitQuiz} />;
  }

  // -------- Startbildschirm --------

  return (
    <div className="screen">
      <header className="top-bar">
        <div className="app-title">Lapicida Latinus</div>
        <div className="top-bar-center">Training</div>
        <div className="top-bar-right">v0.2 (neu)</div>
      </header>

      <main className="content">
        {/* Kategorie-Auswahl */}
        <section className="section">
          <div className="section-title">Kategorie</div>
          <div className="tab-row">
            {/* Substantive */}
            <button
              className={
                "tab-btn" + (category === "nouns" ? " active" : "")
              }
              onClick={() => {
                setCategory("nouns");
                setSelectedLemmas([]);
              }}
            >
              {CATEGORIES.nouns}
            </button>

            {/* Adjektive im Kontext */}
            <button
              className={
                "tab-btn" +
                (category === "adj_context" ? " active" : "")
              }
              onClick={() => {
                setCategory("adj_context");
                setSelectedLemmas([]);
              }}
            >
              {CATEGORIES.adj_context}
            </button>

            {/* Verben – sichtbar, aber noch deaktiviert */}
            <button
              className={
                "tab-btn disabled" +
                (category === "verbs" ? " active" : "")
              }
              onClick={() => {
                // später aktivieren; aktuell nur optisch
                // setCategory("verbs");
                // setSelectedLemmas([]);
              }}
              disabled
            >
              {CATEGORIES.verbs}
            </button>
          </div>
        </section>

        {/* Lemma-Auswahl je Kategorie */}

        {category === "nouns" && (
          <section className="section">
            <div className="section-title">Substantive wählen</div>
            <p className="section-hint">
              Wähle ein oder mehrere Substantive. Die Runde zieht
              zufällige Formen dieser Wörter.
            </p>
            <div className="lemma-grid">
              {nounLemmas.map((lemma) => (
                <button
                  key={lemma}
                  className={
                    "lemma-btn" +
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
              Adjektive im Kontext wählen
            </div>
            <p className="section-hint">
              Wähle ein oder mehrere Adjektive. Es werden
              Adjektiv-Nomen-Paare gebildet; du bestimmst Kasus,
              Numerus und Genus des Adjektivs im Kontext.
            </p>
            <div className="lemma-grid">
              {adjLemmas.map((lemma) => (
                <button
                  key={lemma}
                  className={
                    "lemma-btn" +
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

        {/* Hilfetabellen (nur wirklich genutzt, wo es Paradigmen gibt) */}
        <section className="section">
          <div className="section-title">Hilfetabellen</div>
          <p className="section-hint">
            Zeigt nach jeder Aufgabe eine Formenübersicht
            (z.&nbsp;B. vollständige Deklination des gewählten
            Substantivs). Für Adjektive und Verben wird diese
            Funktion später ergänzt.
          </p>
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
