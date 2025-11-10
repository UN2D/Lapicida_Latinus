// src/App.jsx
import { useState, useMemo } from "react";
import { generateRound } from "./logic/generateRound";
import { Quiz } from "./components/Quiz";

import nounsAdjectives from "./data/nounsAdjectives.json";
import verbsPraesens from "./data/verbs_praesens.json";
import verbsImperfekt from "./data/verbs_imperfekt.json";
import verbsPerfekt from "./data/verbs_perfekt.json";
import verbsPlusquamperfekt from "./data/verbs_plusquamperfekt.json";
import verbsFutur1 from "./data/verbs_futur1.json";
import verbsFutur2 from "./data/verbs_futur2.json";
import demonstratives from "./data/demonstratives.json";
import possessives from "./data/possessives.json";

// ================== Verb-Konfiguration ==================

const VERB_DATA_BY_TENSE = {
  Praesens: verbsPraesens,
  Imperfekt: verbsImperfekt,
  Perfekt: verbsPerfekt,
  Plusquamperfekt: verbsPlusquamperfekt,
  "Futur I": verbsFutur1,
  "Futur II": verbsFutur2
};

const TENSE_OPTIONS = [
  "Praesens",
  "Imperfekt",
  "Perfekt",
  "Plusquamperfekt",
  "Futur I",
  "Futur II"
];

const MOOD_OPTIONS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICE_OPTIONS = ["Aktiv", "Passiv"];

function verbKey(tense, mood, voice) {
  const t = (tense || "").toLowerCase().replace(/\s+/g, "");
  const m = (mood || "").toLowerCase();
  const v = (voice || "").toLowerCase();

  if (t === "praesens" && m === "indikativ" && v === "aktiv")
    return "praesens_ind_akt";
  if (t === "praesens" && m === "indikativ" && v === "passiv")
    return "praesens_ind_pass";
  if (t === "praesens" && m === "konjunktiv" && v === "aktiv")
    return "praesens_konj_akt";
  if (t === "praesens" && m === "konjunktiv" && v === "passiv")
    return "praesens_konj_pass";
  if (t === "praesens" && m === "imperativ" && v === "aktiv")
    return "praesens_imp_akt";
  if (t === "praesens" && m === "imperativ" && v === "passiv")
    return "praesens_imp_pass";

  const base = t;
  if (!base) return null;

  if (m === "indikativ" && v === "aktiv") return `${base}_ind_akt`;
  if (m === "indikativ" && v === "passiv") return `${base}_ind_pass`;
  if (m === "konjunktiv" && v === "aktiv") return `${base}_konj_akt`;
  if (m === "konjunktiv" && v === "passiv") return `${base}_konj_pass`;
  if (m === "imperativ" && v === "aktiv") return `${base}_imp_akt`;
  if (m === "imperativ" && v === "passiv") return `${base}_imp_pass`;

  return null;
}

function hasComboForTense(tense, mood, voice) {
  const list = VERB_DATA_BY_TENSE[tense] || [];
  if (!list.length) return false;
  const key = verbKey(tense, mood, voice);
  if (!key) return false;
  return list.some((verb) => verb.forms && verb.forms[key]);
}

// Kombinationen, die für ALLE gewählten Zeiten existieren
function getAllowedCombosForTenses(tenses) {
  if (!tenses.length) return [];
  const allCombos = [];
  for (const mood of MOOD_OPTIONS) {
    for (const voice of VOICE_OPTIONS) {
      allCombos.push({ mood, voice });
    }
  }
  if (tenses.length === 1) {
    const t = tenses[0];
    return allCombos.filter((c) => hasComboForTense(t, c.mood, c.voice));
  }
  return allCombos.filter((c) =>
    tenses.every((t) => hasComboForTense(t, c.mood, c.voice))
  );
}

function isTenseDisabled(tense) {
  const list = VERB_DATA_BY_TENSE[tense];
  return !list || list.length === 0;
}

function buildVerbLemmaList() {
  const set = new Set();
  Object.values(VERB_DATA_BY_TENSE).forEach((list) => {
    (list || []).forEach((v) => {
      if (v.lemma) set.add(v.lemma);
    });
  });
  return Array.from(set).sort();
}

// ================== App-Komponente ==================

export default function App() {
  const [category, setCategory] = useState("nouns");
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedItems, setSelectedItems] = useState([]);
  const [round, setRound] = useState(null);

  const [showVerbSettings, setShowVerbSettings] = useState(false);
  const [verbSettings, setVerbSettings] = useState({
    tenses: ["Praesens"],
    moods: ["Indikativ"],
    voices: ["Aktiv"]
  });

  // ---- Lemmata pro Bereich ----

  const nounLemmas = useMemo(
    () =>
      Array.from(
        new Set(
          nounsAdjectives
            .filter((i) => i.pos === "noun")
            .map((i) => i.lemma)
        )
      ).sort(),
    []
  );

  const adjLemmas = useMemo(
    () =>
      Array.from(
        new Set(
          nounsAdjectives
            .filter((i) => i.pos === "adj")
            .map((i) => i.lemma)
        )
      ).sort(),
    []
  );

  const verbLemmas = useMemo(() => buildVerbLemmaList(), []);

  const demoLemmas = useMemo(
    () =>
      Array.from(
        new Set((demonstratives || []).map((d) => d.lemma).filter(Boolean))
      ).sort(),
    []
  );

  const possLemmas = useMemo(
    () =>
      Array.from(
        new Set((possessives || []).map((p) => p.lemma).filter(Boolean))
      ).sort(),
    []
  );

  // -------- Reset --------

  const reset = () => {
    setRound(null);
    setShowVerbSettings(false);
    setSelectedItems([]);
    setVerbSettings({
      tenses: ["Praesens"],
      moods: ["Indikativ"],
      voices: ["Aktiv"]
    });
    setNumQuestions(5);
  };

  // -------- Verb-Hilfen --------

  const getActiveTenses = () => {
    const selected = verbSettings.tenses.length
      ? verbSettings.tenses
      : ["Praesens"];
    const filtered = selected.filter((t) => !isTenseDisabled(t));
    return filtered.length ? filtered : ["Praesens"];
  };

  const allowedCombos = useMemo(
    () => getAllowedCombosForTenses(getActiveTenses()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verbSettings.tenses]
  );

  const isMoodDisabled = (mood) =>
    allowedCombos.length > 0 &&
    allowedCombos.every((c) => c.mood !== mood);

  const isVoiceDisabled = (voice) =>
    allowedCombos.length > 0 &&
    allowedCombos.every((c) => c.voice !== voice);

  const toggleVerbTense = (tense) => {
    if (isTenseDisabled(tense)) return;

    setVerbSettings((prev) => {
      const exists = prev.tenses.includes(tense);

      if (exists) {
        const remaining = prev.tenses.filter((t) => t !== tense);
        if (remaining.length > 0) {
          return { ...prev, tenses: remaining };
        }
        const fallback =
          (!isTenseDisabled("Praesens") && "Praesens") ||
          TENSE_OPTIONS.find((t) => !isTenseDisabled(t)) ||
          tense;
        return { ...prev, tenses: [fallback] };
      }

      return { ...prev, tenses: [...prev.tenses, tense] };
    });
  };

  const toggleVerbSettingArray = (key, value, isDisabledFn) => {
    if (isDisabledFn && isDisabledFn(value)) return;

    setVerbSettings((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      if (exists) {
        const next = current.filter((v) => v !== value);
        return next.length ? { ...prev, [key]: next } : prev;
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  // Auswahl-Toggle (Multi-Select) für alle Kategorien
  const toggleItem = (value) => {
    setSelectedItems((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const isStartDisabled = () => {
    if (
      ["nouns", "adj_with_noun", "verbs", "demonstratives", "possessives"].includes(
        category
      )
    ) {
      return selectedItems.length === 0;
    }
    return false;
  };

  // Hilfsfunktion: Mapping Selection -> generateRound-Props
  const buildRoundConfig = () => {
    switch (category) {
      case "nouns":
      case "adj_with_noun":
      case "verbs":
        return { lemma: selectedItems };
      case "demonstratives":
        return { selectedDemos: selectedItems };
      case "possessives":
        return { selectedPossessives: selectedItems };
      default:
        return {};
    }
  };

  // -------- Start vom Hauptscreen --------

  const startFromMain = () => {
    if (category === "verbs") {
      if (!selectedItems.length) return;
      setShowVerbSettings(true);
      return;
    }

    const cfg = buildRoundConfig();
    const newRound = generateRound({
      category,
      numQuestions,
      ...cfg
    });

    setRound(newRound);
  };

  // -------- Start der Verb-Runde --------

  const startVerbRound = () => {
    if (!selectedItems.length) return;

    const activeTenses = getActiveTenses();
    const cfg = {
      lemma: selectedItems,
      verbSettings: { ...verbSettings, tenses: activeTenses }
    };

    const newRound = generateRound({
      category: "verbs",
      numQuestions,
      ...cfg
    });

    setRound(newRound);
    setShowVerbSettings(false);
  };

  // ================== Verb-Einstellungs-Screen ==================

  if (showVerbSettings && !round) {
    const activeTenses = getActiveTenses();
    const localAllowedCombos = getAllowedCombosForTenses(activeTenses);

    const moodDisabled = (m) =>
      localAllowedCombos.length > 0 &&
      localAllowedCombos.every((c) => c.mood !== m);

    const voiceDisabled = (v) =>
      localAllowedCombos.length > 0 &&
      localAllowedCombos.every((c) => c.voice !== v);

    return (
      <div className="app">
        <header className="top-bar">
          <div className="top-title">Lapicida Latinus</div>
          <button className="top-back-btn" onClick={reset}>
            Zurück
          </button>
        </header>

        <main className="screen">
          <h1>Verbformen wählen</h1>
          <p className="hint">
            Wähle Zeit(en), Modus und Genus für:{" "}
            <strong>{selectedItems.join(" · ")}</strong>
          </p>

          {/* Zeitform */}
          <div className="section">
            <h2>Zeitform</h2>
            <div className="option-grid">
              {TENSE_OPTIONS.map((t) => {
                const disabled = isTenseDisabled(t);
                const selected = verbSettings.tenses.includes(t);
                return (
                  <button
                    key={t}
                    className={
                      "option-btn" +
                      (selected ? " selected" : "") +
                      (disabled ? " disabled" : "")
                    }
                    onClick={() => toggleVerbTense(t)}
                    disabled={disabled}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modus */}
          <div className="section">
            <h2>Modus</h2>
            <div className="option-row">
              {MOOD_OPTIONS.map((m) => {
                const disabled = moodDisabled(m);
                const selected = verbSettings.moods.includes(m);
                return (
                  <button
                    key={m}
                    className={
                      "option-btn" +
                      (selected ? " selected" : "") +
                      (disabled ? " disabled" : "")
                    }
                    onClick={() =>
                      toggleVerbSettingArray("moods", m, moodDisabled)
                    }
                    disabled={disabled}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genus */}
          <div className="section">
            <h2>Genus (Diathese)</h2>
            <div className="option-row">
              {VOICE_OPTIONS.map((v) => {
                const disabled = voiceDisabled(v);
                const selected = verbSettings.voices.includes(v);
                return (
                  <button
                    key={v}
                    className={
                      "option-btn" +
                      (selected ? " selected" : "") +
                      (disabled ? " disabled" : "")
                    }
                    onClick={() =>
                      toggleVerbSettingArray("voices", v, voiceDisabled)
                    }
                    disabled={disabled}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anzahl Aufgaben (Info) */}
          <div className="section">
            <h2>Anzahl Aufgaben</h2>
            <p className="hint">
              Aktuelle Auswahl: {numQuestions} Aufgaben (einstellbar auf dem
              Startbildschirm).
            </p>
          </div>

          <button className="start-btn" onClick={startVerbRound}>
            SPIELEN
          </button>
        </main>

        <footer className="bottom-bar">
          <div>v0.8 Beta</div>
          <div>verbs</div>
        </footer>
      </div>
    );
  }

  // ================== Startscreen ==================

  if (!round) {
    // Helper zum Rendern von Lemma-Optionen
    const renderLemmaButtons = (lemmas) => (
      <div className="option-grid">
        {lemmas.map((lemma) => (
          <button
            key={lemma}
            className={
              "option-btn small" +
              (selectedItems.includes(lemma) ? " selected" : "")
            }
            onClick={() => toggleItem(lemma)}
          >
            {lemma}
          </button>
        ))}
      </div>
    );

    return (
      <div className="app">
        <header className="top-bar">
          <div className="top-title">Lapicida Latinus</div>
        </header>

        <main className="screen">
          {/* Kategorie-Wahl */}
          <div className="section">
            <div className="category-grid">
              {[
                ["nouns", "Substantive"],
                ["adj_with_noun", "Adjektive im Kontext"],
                ["verbs", "Verben"],
                ["demonstratives", "Demonstrativpronomen"],
                ["possessives", "Possessivpronomen"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={
                    "option-btn" +
                    (category === key ? " selected" : "")
                  }
                  onClick={() => {
                    setCategory(key);
                    setSelectedItems([]);
                    setShowVerbSettings(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Wort-/Pronomen-/Verb-Auswahl */}
          {category === "nouns" && (
            <div className="section">
              <h1>Substantive wählen</h1>
              <p className="hint">
                Du übst die Formen der ausgewählten Substantive.
              </p>
              {renderLemmaButtons(nounLemmas)}
            </div>
          )}

          {category === "adj_with_noun" && (
            <div className="section">
              <h1>Adjektive im Kontext wählen</h1>
              <p className="hint">
                Du bestimmst die Adjektivform im passenden Nomen-Kontext.
              </p>
              {renderLemmaButtons(adjLemmas)}
            </div>
          )}

          {category === "verbs" && (
            <div className="section">
              <h1>Verb wählen</h1>
              <p className="hint">
                Danach wählst du auf der nächsten Seite Zeit, Modus und Genus.
              </p>
              {renderLemmaButtons(verbLemmas)}
            </div>
          )}

          {category === "demonstratives" && (
            <div className="section">
              <h1>Demonstrativpronomen wählen</h1>
              <p className="hint">
                Wähle, welche Demonstrativpronomen abgefragt werden sollen.
              </p>
              {renderLemmaButtons(demoLemmas)}
            </div>
          )}

          {category === "possessives" && (
            <div className="section">
              <h1>Possessivpronomen wählen</h1>
              <p className="hint">
                Wähle, welche Possessivpronomen abgefragt werden sollen.
              </p>
              {renderLemmaButtons(possLemmas)}
            </div>
          )}

          {/* Anzahl Aufgaben */}
          <div className="section">
            <h2>Anzahl Aufgaben</h2>
            <div className="option-row">
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  className={
                    "option-btn" + (numQuestions === n ? " selected" : "")
                  }
                  onClick={() => setNumQuestions(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="start-btn"
            onClick={startFromMain}
            disabled={isStartDisabled()}
          >
            SPIELEN
          </button>
          {isStartDisabled() && (
            <p className="hint">
              Bitte zuerst mindestens ein Wort / Pronomen auswählen.
            </p>
          )}
        </main>

        <footer className="bottom-bar">
          <div>v0.8 Beta</div>
        </footer>
      </div>
    );
  }

  // ================== Quiz aktiv ==================
  return <Quiz round={round} onFinish={reset} />;
}
