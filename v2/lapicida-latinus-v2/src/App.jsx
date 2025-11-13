// src/App.jsx
import { useState, useMemo, useEffect } from "react";
import { generateRound } from "./core/generateRound";
import { Quiz } from "./components/Quiz";
import nounsAdjectives from "./data/nounsAdjectives.json";
import "./index.css";

export default function App() {
  const QUESTION_COUNTS = [5, 10, 20];

  const CATEGORIES = {
    nouns: "Substantive",
    adj_context: "Adjektive",
    verbs: "Verben",
  };
  const [category, setCategory] = useState("nouns");
  const [verbStep, setVerbStep] = useState(1);
  const [selectedLemmas, setSelectedLemmas] = useState([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [showHelp, setShowHelp] = useState(true);
  const [round, setRound] = useState(null);


  const isVerbs = category === "verbs";
  const canGoNext = isVerbs ? selectedLemmas.length > 0 : true;

  function goNextVerbs() { if (canGoNext) setVerbStep(2); }
  function goBackVerbs() { setVerbStep(1); }


  useEffect(() => {
    // Beim Wechsel der Kategorie startet der Verb-Wizard wieder bei Schritt 1
    setVerbStep(1);
    // (Optional) Verb-Auswahl leeren:
    // if (category !== "verbs") setSelectedLemmas([]);
  }, [category]);

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

  const VERB_LEMMAS = [
    "laudare", "videre", "capere", "mittere", "audire",
    "esse", "posse", "ire", "ferre", "velle", "nolle", "malle", "fieri"
  ];

  const VERB_TENSES = ["Praesens", "Imperfekt", "Perfekt", "Plusquamperfekt", "Futur I", "Futur II"];
  const VERB_MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
  const VERB_VOICES = ["Aktiv", "Passiv"];

  const TENSES = VERB_TENSES;
  const MOODS = VERB_MOODS;
  const VOICES = VERB_VOICES;

  // Falls du verbFilters schon hast, so lassen; ansonsten:
  const [verbFilters, setVerbFilters] = useState({
    tenses: ["Praesens"],      // Default
    moods: ["Indikativ"],     // Default
    voices: ["Aktiv"]          // Default
  });


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

  async function handleStart() {
    try {
      const { questions, ...rest } = generateRound({
        category,
        lemmas: selectedLemmas,
        numQuestions,
        showHelp,
        settings: category === "verbs" ? { filters: verbFilters } : {}
      });

      setRound({
        category,
        ...rest,
        questions,
      });
    } catch (err) {
      console.error("[Start] Fehler beim Rundenaufbau:", err);
      alert("Ups – Runde konnte nicht erzeugt werden. Details in der Konsole.");
    }
  }

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

        {/* ===== VERBEN: SCREEN 1 – Verb-Auswahl ===== */}
        {isVerbs && verbStep === 1 && (
          <>
            <section className="section">
              <div className="section-title">Verb wählen (mehrfach)</div>
              <div className="pill-row lemma-row">
                {["laudare", "videre", "capere", "mittere", "audire", "esse", "posse", "ire", "ferre", "velle", "nolle", "malle", "fieri"].map(v => (
                  <button
                    key={v}
                    className={"pill-btn lemma-btn" + (selectedLemmas.includes(v) ? " selected" : "")}
                    onClick={() => {
                      setSelectedLemmas(prev =>
                        prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
                      );
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </section>

            {/* Anzahl Aufgaben & Hilfetabellen BELASSEN auf Screen 1 (wie besprochen) */}
            <section className="section">
              <div className="section-title">Anzahl Aufgaben</div>
              <div className="pill-row">
                {[5, 10, 20].map(n => (
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
                >An</button>
                <button
                  className={"pill-btn" + (!showHelp ? " selected" : "")}
                  onClick={() => setShowHelp(false)}
                >Aus</button>
              </div>
            </section>

            {/* Weiter-Button im gleichen Look wie "Spielen" */}
            <div className="footer-cta">
              <button
                className={"cta-btn" + (!canGoNext ? " disabled" : "")}
                disabled={!canGoNext}
                onClick={goNextVerbs}
              >
                Weiter
              </button>
            </div>
          </>
        )}

        {/* ===== VERBEN: SCREEN 2 – Einstellungen ===== */}
        {isVerbs && verbStep === 2 && (
          <>
            <section className="section">
              <div className="section-title">Einstellungen</div>

              {/* Zeit */}
              <div className="subsection-title">Zeit</div>
              <div className="pill-row">
                {["praes", "imperf", "perf", "plusq", "fut1", "fut2"].map(k => (
                  <button
                    key={k}
                    className={"pill-btn" + (verbFilters.tense[k] ? " selected" : "")}
                    onClick={() =>
                      setVerbFilters(f => ({ ...f, tense: { ...f.tense, [k]: !f.tense[k] } }))
                    }
                  >
                    {{
                      praes: "Praesens", imperf: "Imperfekt", perf: "Perfekt",
                      plusq: "Plusquamperfekt", fut1: "Futur I", fut2: "Futur II"
                    }[k]}
                  </button>
                ))}
              </div>

              {/* Modus */}
              <div className="subsection-title">Modus</div>
              <div className="pill-row">
                {["ind", "konj", "imp"].map(k => (
                  <button
                    key={k}
                    className={"pill-btn" + (verbFilters.mood[k] ? " selected" : "")}
                    onClick={() =>
                      setVerbFilters(f => ({ ...f, mood: { ...f.mood, [k]: !f.mood[k] } }))
                    }
                  >
                    {{ ind: "Indikativ", konj: "Konjunktiv", imp: "Imperativ" }[k]}
                  </button>
                ))}
              </div>

              {/* Diathese */}
              <div className="subsection-title">Genus (Diathese)</div>
              <div className="pill-row">
                {["act", "pass"].map(k => (
                  <button
                    key={k}
                    className={"pill-btn" + (verbFilters.voice[k] ? " selected" : "")}
                    onClick={() =>
                      setVerbFilters(f => ({ ...f, voice: { ...f.voice, [k]: !f.voice[k] } }))
                    }
                  >
                    {{ act: "Aktiv", pass: "Passiv" }[k]}
                  </button>
                ))}
              </div>
            </section>

            {/* Footer: Zurück / Spielen */}
            <div className="footer-cta two">
              <button className="pill-btn" onClick={goBackVerbs}>Zurück</button>
              <button className="cta-btn" onClick={handleStart}>Spielen</button>
            </div>
          </>
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

        {/* Start / CTA unten – bei Verben im Wizard ausblenden */}
        {category !== "verbs" && (
          <section className="section">
            <button
              className={
                "primary-btn large" + (isStartDisabled() ? " disabled" : "")
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
        )}
      </main>
    </div>
  );
}
