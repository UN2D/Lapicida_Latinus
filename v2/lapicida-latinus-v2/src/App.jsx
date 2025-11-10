// src/App.jsx
import { useState } from "react";
import { generateRound } from "./logic/generateRound";
import { Quiz } from "./components/Quiz";

const CATEGORY_OPTIONS = [
  { id: "nouns", label: "Substantive" },
  { id: "adj_with_noun", label: "Adjektive im Kontext", disabled: true },
  { id: "verbs", label: "Verben", disabled: true },
  // weitere Kategorien später
];

const NUM_QUESTION_OPTIONS = [5, 10, 20];

export default function App() {
  const [category, setCategory] = useState("nouns");
  const [selectedLemmas, setSelectedLemmas] = useState([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [showHelpTables, setShowHelpTables] = useState(true);

  const [round, setRound] = useState(null);

  // --- Dummy-Lemmata nur für Demo (für Nomen haben wir echte Daten) ---
  const nounLemmas = ["amicus", "incola", "locus", "oppidum", "verbum", "villa"];

  const toggleLemma = (lemma) => {
    setSelectedLemmas((prev) =>
      prev.includes(lemma)
        ? prev.filter((l) => l !== lemma)
        : [...prev, lemma]
    );
  };

  const canStart = () => {
    // Für Nomen mind. ein Lemma
    if (category === "nouns") {
      return selectedLemmas.length > 0;
    }
    // andere Kategorien später spezifisch
    return false;
  };

  const startRound = () => {
    if (!canStart()) return;

    const newRound = generateRound({
      category,
      numQuestions,
      lemmas: selectedLemmas,
      showHelpTables,
    });

    setRound(newRound);
  };

  const exitRound = () => {
    setRound(null);
    // Auswahl bewusst NICHT resetten, damit man schnell neue Runden starten kann
  };

  // ================== Quiz aktiv ==================
  if (round) {
    return (
      <Quiz
        round={round}
        onExit={exitRound}
      />
    );
  }

  // ================== Start-/Trainingsscreen ==================
  return (
    <div className="screen">
      <header className="top-bar">
        <div className="app-title">Lapicida Latinus</div>
        <div className="top-bar-mode">Training</div>
      </header>

      <main className="content">
        {/* Kategorie */}
        <section className="section">
          <h2 className="section-title">Kategorie</h2>
          <div className="pill-row">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.id}
                className={
                  "pill-btn" +
                  (category === c.id ? " selected" : "") +
                  (c.disabled ? " disabled" : "")
                }
                onClick={() => !c.disabled && setCategory(c.id)}
                disabled={c.disabled}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Lemma-Auswahl (aktuell nur Substantive aktiv) */}
        {category === "nouns" && (
          <section className="section">
            <h2 className="section-title">Substantive wählen</h2>
            <p className="section-hint">
              Wähle ein oder mehrere Substantive. Die Runde zieht zufällige Formen
              dieser Wörter.
            </p>
            <div className="pill-row">
              {nounLemmas.map((lemma) => (
                <button
                  key={lemma}
                  className={
                    "pill-btn" +
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
          <h2 className="section-title">Anzahl Aufgaben</h2>
          <div className="pill-row">
            {NUM_QUESTION_OPTIONS.map((n) => (
              <button
                key={n}
                className={
                  "pill-btn" + (numQuestions === n ? " selected" : "")
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
          <h2 className="section-title">Hilfetabellen</h2>
          <p className="section-hint">
            Zeigt nach jeder Aufgabe eine Formenübersicht
            (z.&nbsp;B. vollständige Deklination des Substantivs).
          </p>
          <div className="pill-row">
            <button
              className={
                "pill-btn" + (showHelpTables ? " selected" : "")
              }
              onClick={() => setShowHelpTables(true)}
            >
              An
            </button>
            <button
              className={
                "pill-btn" + (!showHelpTables ? " selected" : "")
              }
              onClick={() => setShowHelpTables(false)}
            >
              Aus
            </button>
          </div>
        </section>

        {/* Start-Button */}
        <div className="section">
          <button
            className={
              "primary-btn" + (!canStart() ? " disabled" : "")
            }
            onClick={startRound}
            disabled={!canStart()}
          >
            SPIELEN
          </button>
          {!canStart() && (
            <p className="section-hint error">
              Bitte zuerst mindestens ein Wort auswählen.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
