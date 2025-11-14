import React, { useMemo, useState } from "react";
import { Quiz } from "./components/Quiz";
import generateRound from "./core/generateRound";

const CATEGORIES = {
  nouns: "Substantive",
  adj_context: "Adjektive",
  verbs: "Verben",
};

const ALL_VERBS = [
  "laudare", "videre", "capere", "mittere", "audire",
  "esse", "posse", "ire", "ferre", "velle", "nolle", "malle", "fieri",
];

export default function App() {
  const [category, setCategory] = useState("nouns");

  // Gemeinsame Einstellungen
  const [numQuestions, setNumQuestions] = useState(5);
  const [showHelp, setShowHelp] = useState(true);

  // Lemma-Auswahl (für alle Kategorien wiederverwendet)
  const [selectedLemmas, setSelectedLemmas] = useState([]);

  // Verben: 2-Screen-Flow
  const [verbUiStep, setVerbUiStep] = useState(1);
  const [verbFilters, setVerbFilters] = useState({
    tenses: ["Praesens"],
    moods: ["Indikativ"],
    voices: ["Aktiv"],
  });

  const [round, setRound] = useState(null);

  // Kategorie-Wechsel: Auswahl & Verb-Flow zurücksetzen
  const switchCategory = (next) => {
    setCategory(next);
    setSelectedLemmas([]);
    if (next === "verbs") {
      setVerbUiStep(1);
    }
  };

  const toggleLemma = (lemma) => {
    setSelectedLemmas((prev) =>
      prev.includes(lemma) ? prev.filter((l) => l !== lemma) : [...prev, lemma]
    );
  };

  const toggleFilter = (key, value) => {
    setVerbFilters((prev) => {
      const list = prev[key] || [];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  // Start / Weiter / Spielen
  const handleStart = () => {
    const { questions, ...rest } = generateRound({
      category,
      lemmas: selectedLemmas,
      numQuestions,
      showHelp,
      settings: category === "verbs" ? { filters: verbFilters } : {},
    });
    setRound({ questions, showHelp, ...rest });
  };

  const canStart = useMemo(() => {
    // mindestens ein Lemma für alle Kategorien
    return selectedLemmas.length > 0;
  }, [selectedLemmas]);

  // ====== Rundenansicht ======
  if (round) {
    return <Quiz round={round} onExit={() => setRound(null)} />;
  }

  // ====== Auswahlansichten ======

  const renderCategoryPills = (
    <div className="pill-row">
      <button
        className={"pill-btn" + (category === "nouns" ? " selected" : "")}
        onClick={() => switchCategory("nouns")}
      >
        {CATEGORIES.nouns}
      </button>
      <button
        className={"pill-btn" + (category === "adj_context" ? " selected" : "")}
        onClick={() => switchCategory("adj_context")}
      >
        {CATEGORIES.adj_context}
      </button>
      <button
        className={"pill-btn" + (category === "verbs" ? " selected" : "")}
        onClick={() => switchCategory("verbs")}
      >
        {CATEGORIES.verbs}
      </button>
    </div>
  );

  const renderCommonAmountHelp = (
    <>
      <section className="section">
        <div className="section-title">Anzahl Aufgaben</div>
        <div className="pill-row">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              className={"pill-btn" + (numQuestions === n ? " selected" : "")}
              onClick={() => setNumQuestions(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-title">Hilfetabellen</div>
        <div className="pill-row">
          <button
            className={"pill-btn" + (showHelp ? " selected" : "")}
            onClick={() => setShowHelp(true)}
          >
            An
          </button>
          <button
            className={"pill-btn" + (!showHelp ? " selected" : "")}
            onClick={() => setShowHelp(false)}
          >
            Aus
          </button>
        </div>
      </section>
    </>
  );

  // ===== Substantive / Adjektive (unverändert) =====
  const renderLemmaGrid = (lemmas) => (
    <div className="pill-row lemma-row">
      {lemmas.map((l) => (
        <button
          key={l}
          className={"pill-btn lemma-btn" + (selectedLemmas.includes(l) ? " selected" : "")}
          onClick={() => toggleLemma(l)}
        >
          {l}
        </button>
      ))}
    </div>
  );

  // ***** STARTSCREEN: gesamte Auswahl *****
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
          {renderCategoryPills}
        </section>

        {/* ====== SUBSTANTIVE ====== */}
        {category === "nouns" && (
          <>
            <section className="section">
              <div className="section-title">Substantive wählen</div>
              {renderLemmaGrid(["amicus", "incola", "locus", "oppidum", "verbum", "villa"])}
            </section>

            {renderCommonAmountHelp}

            <button
              className={"primary-btn large" + (!canStart ? " disabled" : "")}
              onClick={canStart ? handleStart : undefined}
            >
              SPIELEN
            </button>

            {!canStart && (
              <p className="hint">Bitte zuerst mindestens ein Lemma auswählen.</p>
            )}
          </>
        )}

        {/* ====== ADJEKTIVE ====== */}
        {category === "adj_context" && (
          <>
            <section className="section">
              <div className="section-title">Adjektive wählen</div>
              {renderLemmaGrid(["bonus", "carus", "clarus", "liber", "magnus", "pulcher"])}
            </section>

            {renderCommonAmountHelp}

            <button
              className={"primary-btn large" + (!canStart ? " disabled" : "")}
              onClick={canStart ? handleStart : undefined}
            >
              SPIELEN
            </button>

            {!canStart && (
              <p className="hint">Bitte zuerst mindestens ein Lemma auswählen.</p>
            )}
          </>
        )}

        {/* ====== VERBEN ====== */}
        {category === "verbs" && (
          <>
            {verbUiStep === 1 && (
              <>
                <section className="section">
                  <div className="section-title">Verb wählen (mehrfach)</div>
                  <div className="pill-row lemma-row">
                    {ALL_VERBS.map((v) => (
                      <button
                        key={v}
                        className={
                          "pill-btn lemma-btn" +
                          (selectedLemmas.includes(v) ? " selected" : "")
                        }
                        onClick={() => toggleLemma(v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </section>

                {renderCommonAmountHelp}

                <button
                  className={"primary-btn large" + (!canStart ? " disabled" : "")}
                  onClick={canStart ? () => setVerbUiStep(2) : undefined}
                >
                  Weiter
                </button>
                {!canStart && (
                  <p className="hint">Bitte zuerst mindestens ein Verb auswählen.</p>
                )}
              </>
            )}

            {verbUiStep === 2 && (
              <>
                <section className="section">
                  <div className="section-title">Einstellungen</div>

                  <div className="subsection-title">Zeit</div>
                  <div className="pill-row">
                    {["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt", "Futur I", "Futur II"].map(
                      (t) => (
                        <button
                          key={t}
                          className={
                            "pill-btn" + (verbFilters.tenses.includes(t) ? " selected" : "")
                          }
                          onClick={() => toggleFilter("tenses", t)}
                        >
                          {t}
                        </button>
                      )
                    )}
                  </div>

                  <div className="subsection-title">Modus</div>
                  <div className="pill-row">
                    {["Indikativ", "Konjunktiv", "Imperativ"].map((m) => (
                      <button
                        key={m}
                        className={
                          "pill-btn" + (verbFilters.moods.includes(m) ? " selected" : "")
                        }
                        onClick={() => toggleFilter("moods", m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="subsection-title">Genus (Diathese)</div>
                  <div className="pill-row">
                    {["Aktiv", "Passiv"].map((v) => (
                      <button
                        key={v}
                        className={
                          "pill-btn" + (verbFilters.voices.includes(v) ? " selected" : "")
                        }
                        onClick={() => toggleFilter("voices", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="pill-row">
                  <button className="pill-btn" onClick={() => setVerbUiStep(1)}>
                    Zurück
                  </button>
                  <button className="primary-btn large" onClick={handleStart}>
                    SPIELEN
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
