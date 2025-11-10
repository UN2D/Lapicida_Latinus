// src/App.jsx
//
// Hauptentry der Lapicida-Latinus-App.
// - Gemeinsamer Startscreen für alle Kategorien
// - Mehrfachauswahl von Lemmata/Pronomen
// - Verb-Spezialscreen für Zeit/Modus/Genus
// - Startet Quiz mit generateRound()

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

// Mapping (Zeit, Modus, Genus) -> Key in Verbtabellen
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

// Nutzt Verbtabellen, um zu prüfen, ob es für (tense, mood, voice) überhaupt Formen gibt.
function hasComboForTense(tense, mood, voice) {
  const list = VERB_DATA_BY_TENSE[tense] || [];
  if (!list.length) return false;
  const key = verbKey(tense, mood, voice);
  if (!key) return false;
  return list.some((verb) => verb.forms && verb.forms[key]);
}

// Ermittelt erlaubte (mood, voice)-Kombos für die gewählten Zeiten.
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

  // Für alle Kategorien: Mehrfachauswahl von Lemmata/Pronomen
  const [selectedItems, setSelectedItems] = useState([]);

  const [round, setRound] = useState(null);

  // Verb-Spezialscreen
  const [showVerbSettings, setShowVerbSettings] = useState(false);
  const [verbSettings, setVerbSettings] = useState({
    tenses: ["Praesens"],
    moods: ["Indikativ"],
    voices: ["Aktiv"]
  });

  // -------- Lemmata / Pronomen-Listen --------

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
        new Set((demonstratives || []).map((d) => d.lemma))
      ).sort(),
    []
  );

  const possLemmas = useMemo(
    () =>
      Array.from(new Set((possessives || []).map((p) => p.lemma))).sort(),
    []
  );

  // -------- Helpers --------

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

  // Auswahl-Toggle für alle Kategorien
  const toggleItem = (value) => {
    setSelectedItems((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const isStartDisabled = () => {
    // Für diese Kategorien muss mind. ein Item gewählt sein
    if (
      ["nouns", "adj_with_noun", "verbs", "demonstratives", "possessives"].includes(
        category
      )
    ) {
      return selectedItems.length === 0;
    }
    return false;
  };

  // -------- Start vom Hauptscreen --------

  const startFromMain = () => {
    if (category === "verbs") {
      if (!selectedItems.length) return;
      setShowVerbSettings(true);
      return;
    }

    const newRound = generateRound({
      category,
      numQuestions,
      selectedItems
    });

    setRound(newRound);
  };

  // -------- Start der Verb-Runde --------

  const startVerbRound = () => {
    if (!selectedItems.length) return;

    const activeTenses = getActiveTenses();

    const newRound = generateRound({
      category: "verbs",
      numQuestions,
      selectedItems,
      verbSettings: {
        ...verbSettings,
        tenses: activeTenses
      }
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
            Wähle Zeit(en), Modus und Genus. Es werden nur Kombinationen
            angeboten, für die Formen vorhanden sind. Oben gewählte Verben:
          </p>
          <p className="hint selected-list">
            {selectedItems.join(" · ")}
          </p>

          {/* Zeitform */}
          <section className="section">
            <h2>Zeitform</h2>
            <div className="option-row">
              {TENSE_OPTIONS.map((t) => {
                const disabled = isTenseDisabled(t);
                const selected = verbSettings.tenses.includes(t);
                return (
                  <button
                    key={t}
                    className={
                      "pill-btn" +
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
          </section>

          {/* Modus */}
          <section className="section">
            <h2>Modus</h2>
            <div className="option-row">
              {MOOD_OPTIONS.map((m) => {
                const disabled = moodDisabled(m);
                const selected = verbSettings.moods.includes(m);
                return (
                  <button
                    key={m}
                    className={
                      "pill-btn" +
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
          </section>

          {/* Genus */}
          <section className="section">
            <h2>Genus (Diathese)</h2>
            <div className="option-row">
              {VOICE_OPTIONS.map((v) => {
                const disabled = voiceDisabled(v);
                const selected = verbSettings.voices.includes(v);
                return (
                  <button
                    key={v}
                    className={
                      "pill-btn" +
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
          </section>

          {/* Anzahl Aufgaben (nur Anzeige, änderbar am Startscreen) */}
          <section className="section">
            <h2>Anzahl Aufgaben</h2>
            <p className="hint">
              Aktuelle Auswahl: {numQuestions} Aufgaben
              (einstellbar auf dem Startbildschirm).
            </p>
          </section>

          <button className="primary-btn" onClick={startVerbRound}>
            SPIELEN
          </button>
        </main>

        <footer className="bottom-bar">
          <span>v0.8 Beta</span>
          <span>Verben</span>
        </footer>
      </div>
    );
  }

  // ================== Startscreen ==================

  if (!round) {
    return (
      <div className="app">
        <header className="top-bar">
          <div className="top-title">Lapicida Latinus</div>
        </header>

        <main className="screen">
          {/* Kategorien */}
          <section className="section">
            <div className="category-row">
              <button
                className={
                  "pill-btn category" +
                  (category === "nouns" ? " selected" : "")
                }
                onClick={() => {
                  setCategory("nouns");
                  setSelectedItems([]);
                  setShowVerbSettings(false);
                }}
              >
                Substantive
              </button>
              <button
                className={
                  "pill-btn category" +
                  (category === "adj_with_noun" ? " selected" : "")
                }
                onClick={() => {
                  setCategory("adj_with_noun");
                  setSelectedItems([]);
                  setShowVerbSettings(false);
                }}
              >
                Adjektive im Kontext
              </button>
              <button
                className={
                  "pill-btn category" +
                  (category === "verbs" ? " selected" : "")
                }
                onClick={() => {
                  setCategory("verbs");
                  setSelectedItems([]);
                  setShowVerbSettings(false);
                }}
              >
                Verben
              </button>
            </div>
            <div className="category-row">
              <button
                className={
                  "pill-btn category" +
                  (category === "demonstratives" ? " selected" : "")
                }
                onClick={() => {
                  setCategory("demonstratives");
                  setSelectedItems([]);
                  setShowVerbSettings(false);
                }}
              >
                Demonstrativpronomen
              </button>
              <button
                className={
                  "pill-btn category" +
                  (category === "possessives" ? " selected" : "")
                }
                onClick={() => {
                  setCategory("possessives");
                  setSelectedItems([]);
                  setShowVerbSettings(false);
                }}
              >
                Possessivpronomen
              </button>
            </div>
          </section>

          {/* Auswahl nach Kategorie */}

          {category === "nouns" && (
            <section className="section">
              <h1>Substantive wählen</h1>
              <p className="hint">
                Wähle ein oder mehrere Substantive. Die Formen werden
                gemischt abgefragt.
              </p>
              <div className="option-grid">
                {nounLemmas.map((lemma) => (
                  <button
                    key={lemma}
                    className={
                      "pill-btn small" +
                      (selectedItems.includes(lemma) ? " selected" : "")
                    }
                    onClick={() => toggleItem(lemma)}
                  >
                    {lemma}
                  </button>
                ))}
              </div>
            </section>
          )}

          {category === "adj_with_noun" && (
            <section className="section">
              <h1>Adjektive wählen</h1>
              <p className="hint">
                Du bestimmst die Form des Adjektivs im passenden
                Nomen-Kontext.
              </p>
              <div className="option-grid">
                {adjLemmas.map((lemma) => (
                  <button
                    key={lemma}
                    className={
                      "pill-btn small" +
                      (selectedItems.includes(lemma) ? " selected" : "")
                    }
                    onClick={() => toggleItem(lemma)}
                  >
                    {lemma}
                  </button>
                ))}
              </div>
            </section>
          )}

          {category === "verbs" && (
            <section className="section">
              <h1>Verben wählen</h1>
              <p className="hint">
                Wähle ein oder mehrere Verben. Im nächsten Schritt legst du
                Zeit / Modus / Genus fest.
              </p>
              <div className="option-grid">
                {verbLemmas.map((lemma) => (
                  <button
                    key={lemma}
                    className={
                      "pill-btn small" +
                      (selectedItems.includes(lemma) ? " selected" : "")
                    }
                    onClick={() => toggleItem(lemma)}
                  >
                    {lemma}
                  </button>
                ))}
              </div>
            </section>
          )}

          {category === "demonstratives" && (
            <section className="section">
              <h1>Demonstrativpronomen wählen</h1>
              <p className="hint">
                Wähle, welche Demonstrativpronomen abgefragt werden sollen.
              </p>
              <div className="option-row">
                {demoLemmas.map((l) => (
                  <button
                    key={l}
                    className={
                      "pill-btn small" +
                      (selectedItems.includes(l) ? " selected" : "")
                    }
                    onClick={() => toggleItem(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </section>
          )}

          {category === "possessives" && (
            <section className="section">
              <h1>Possessivpronomen wählen</h1>
              <p className="hint">
                Wähle, welche Possessivpronomen abgefragt werden sollen.
              </p>
              <div className="option-row">
                {possLemmas.map((l) => (
                  <button
                    key={l}
                    className={
                      "pill-btn small" +
                      (selectedItems.includes(l) ? " selected" : "")
                    }
                    onClick={() => toggleItem(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Anzahl Aufgaben */}
          <section className="section">
            <h2>Anzahl Aufgaben</h2>
            <div className="option-row">
              {[5, 10, 20].map((n) => (
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

          <button
            className="primary-btn"
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
          <span>v0.8 Beta</span>
          <span>{category}</span>
        </footer>
      </div>
    );
  }

  // ================== Quiz aktiv ==================

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-title">Lapicida Latinus</div>
        <button className="top-back-btn" onClick={reset}>
          Zurück
        </button>
      </header>
      <main className="screen">
        <Quiz round={round} onFinish={reset} />
      </main>
      <footer className="bottom-bar">
        <span>v0.8 Beta</span>
        <span>{round.category}</span>
      </footer>
    </div>
  );
}
