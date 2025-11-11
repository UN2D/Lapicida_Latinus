// src/App.jsx

import { useState, useMemo } from "react";
import { generateRound } from "./logic/generateRound";
import { Quiz } from "./components/Quiz";
import nounsAdjectives from "./data/nounsAdjectives.json";

export default function App() {
  const [category, setCategory] = useState("nouns");
  const [selectedLemmas, setSelectedLemmas] = useState([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [showHelp, setShowHelp] = useState(true);
  const [round, setRound] = useState(null);

  // verfügbare Nomen-Lemmata
  const nounLemmas = useMemo(() => {
    const set = new Set();
    nounsAdjectives.forEach((e) => {
      if (e.pos === "noun" && e.lemma) set.add(e.lemma);
    });
    return Array.from(set).sort();
  }, []);

  const toggleLemma = (lemma) => {
    setSelectedLemmas((prev) =>
      prev.includes(lemma)
        ? prev.filter((l) => l !== lemma)
        : [...prev, lemma]
    );
  };

  const canStart =
    category === "nouns" &&
    Array.isArray(selectedLemmas) &&
    selectedLemmas.length > 0;

  const startRound = () => {
    if (!canStart) return;

    const newRound = generateRound({
      category,
      lemmas: selectedLemmas,
      numQuestions,
      showHelp,
    });

    setRound(newRound);
  };

  const exitRound = () => {
    setRound(null);
  };

  // ---------- Quiz aktiv ----------

  if (round) {
    return <Quiz round={round} onExit={exitRound} />;
  }

  // ---------- Startbildschirm ----------

  return (
    <div className="screen">
      <header className="top-bar">
        <div className="app-title">Lapicida Latinus</div>
        <div className="top-bar-right">Training</div>
      </header>

      <main className="content">
        {/* Kategorie (vorbereitet für später) */}
        <section className="section">
          <h2>Kategorie</h2>
          <div className="pill-row">
            <button
              className={
                "pill-btn " + (category === "nouns" ? "selected" : "")
              }
              onClick={() => {
                setCategory("nouns");
                setSelectedLemmas([]);
              }}
            >
              Substantive
            </button>
            <button
              className="pill-btn disabled"
              disabled
            >
              Adjektive im Kontext
            </button>
            <button
              className="pill-btn disabled"
              disabled
            >
              Verben
            </button>
          </div>
        </section>

        {/* Nomen-Auswahl */}
        {category === "nouns" && (
          <>
            <section className="section">
              <h2>Substantive wählen</h2>
              <p className="hint">
                Wähle ein oder mehrere Substantive. Die Runde zieht zufällige
                Formen dieser Wörter.
              </p>
              <div className="pill-row wrap">
                {nounLemmas.map((lemma) => (
                  <button
                    key={lemma}
                    className={
                      "pill-btn small " +
                      (selectedLemmas.includes(lemma) ? "selected" : "")
                    }
                    onClick={() => toggleLemma(lemma)}
                  >
                    {lemma}
                  </button>
                ))}
              </div>
            </section>

            {/* Anzahl Aufgaben */}
            <section className="section">
              <h2>Anzahl Aufgaben</h2>
              <div className="pill-row">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    className={
                      "pill-btn " +
                      (numQuestions === n ? "selected" : "")
                    }
                    onClick={() => setNumQuestions(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>

            {/* Hilfetabellen */}
            <section className="section">
              <h2>Hilfetabellen</h2>
              <p className="hint">
                Zeigt nach jeder Aufgabe eine Formenübersicht (z.B.
                vollständige Deklination des gewählten Substantivs).
              </p>
              <div className="pill-row">
                <button
                  className={
                    "pill-btn " + (showHelp ? "selected" : "")
                  }
                  onClick={() => setShowHelp(true)}
                >
                  An
                </button>
                <button
                  className={
                    "pill-btn " + (!showHelp ? "selected" : "")
                  }
                  onClick={() => setShowHelp(false)}
                >
                  Aus
                </button>
              </div>
            </section>
          </>
        )}

        <section className="section">
          <button
            className={
              "primary-btn " + (!canStart ? "disabled" : "")
            }
            onClick={startRound}
            disabled={!canStart}
          >
            SPIELEN
          </button>
          {!canStart && (
            <p className="hint">
              Bitte wähle mindestens ein Substantiv.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
