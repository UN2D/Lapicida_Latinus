// src/components/StartScreen.jsx

import { useMemo, useState } from "react";
import nounsAdjectives from "../data/nounsAdjectives.json";

/**
 * StartScreen:
 * - wählt Kategorie (aktuell nur Substantive aktiv)
 * - wählt ein oder mehrere Lemmata
 * - wählt Anzahl Aufgaben
 * - optional: Hilfetexte an/aus
 *
 * Ruft onStart(config) auf.
 */

export function StartScreen({ onStart }) {
    const [category, setCategory] = useState("nouns");
    const [selectedNounLemmas, setSelectedNounLemmas] = useState([]);
    const [numQuestions, setNumQuestions] = useState(5);
    const [includeHelp, setIncludeHelp] = useState(true);

    const nounLemmas = useMemo(
        () =>
            Array.from(
                new Set(
                    nounsAdjectives
                        .filter((e) => e.pos === "noun" && e.lemma)
                        .map((e) => e.lemma)
                )
            ).sort(),
        []
    );

    const toggleNounLemma = (lemma) => {
        setSelectedNounLemmas((prev) =>
            prev.includes(lemma)
                ? prev.filter((l) => l !== lemma)
                : [...prev, lemma]
        );
    };

    const canStart = () => {
        if (category === "nouns") {
            return selectedNounLemmas.length > 0;
        }
        return false;
    };

    const handleStart = () => {
        if (!canStart()) return;

        if (category === "nouns") {
            onStart({
                category: "nouns",
                lemmas: selectedNounLemmas,
                numQuestions,
                includeHelp
            });
        }
    };

    return (
        <div className="screen">
            <header className="top-bar">
                <div className="app-title">Lapicida Latinus</div>
                <div className="top-bar-center">v2.0 alpha</div>
                <div className="top-bar-right" />
            </header>

            <main className="content">
                <h1 className="headline">Training starten</h1>

                {/* Kategorieauswahl – andere Kategorien vorerst disabled */}
                <div className="section">
                    <div className="section-title">Kategorie</div>
                    <div className="option-row wrap">
                        <button
                            className={
                                "option-btn" +
                                (category === "nouns" ? " selected" : "")
                            }
                            onClick={() => setCategory("nouns")}
                        >
                            Substantive
                        </button>

                        <button className="option-btn disabled">
                            Adjektive im Kontext
                        </button>
                        <button className="option-btn disabled">
                            Verben
                        </button>
                        <button className="option-btn disabled">
                            Demonstrativpronomen
                        </button>
                        <button className="option-btn disabled">
                            Possessivpronomen
                        </button>
                    </div>
                </div>

                {/* Lemmata für Substantive */}
                {category === "nouns" && (
                    <div className="section">
                        <div className="section-title">
                            Substantive wählen
                        </div>
                        <p className="hint">
                            Du kannst ein oder mehrere Lemmata auswählen.
                            Die Runde mischt passende Formen dieser Wörter.
                        </p>
                        <div className="option-grid">
                            {nounLemmas.map((lemma) => (
                                <button
                                    key={lemma}
                                    className={
                                        "option-btn small" +
                                        (selectedNounLemmas.includes(lemma)
                                            ? " selected"
                                            : "")
                                    }
                                    onClick={() => toggleNounLemma(lemma)}
                                >
                                    {lemma}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Anzahl Aufgaben */}
                <div className="section">
                    <div className="section-title">Anzahl Aufgaben</div>
                    <div className="option-row">
                        {[5, 10, 20].map((n) => (
                            <button
                                key={n}
                                className={
                                    "option-btn" +
                                    (numQuestions === n ? " selected" : "")
                                }
                                onClick={() => setNumQuestions(n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hilfetexte */}
                <div className="section">
                    <div className="section-title">Hilfetexte</div>
                    <div className="option-row">
                        <button
                            className={
                                "option-btn" + (includeHelp ? " selected" : "")
                            }
                            onClick={() => setIncludeHelp(true)}
                        >
                            An
                        </button>
                        <button
                            className={
                                "option-btn" + (!includeHelp ? " selected" : "")
                            }
                            onClick={() => setIncludeHelp(false)}
                        >
                            Aus
                        </button>
                    </div>
                </div>

                <button
                    className={
                        "primary-btn large" +
                        (!canStart() ? " disabled" : "")
                    }
                    onClick={handleStart}
                    disabled={!canStart()}
                >
                    SPIELEN
                </button>

                {!canStart() && (
                    <p className="hint">
                        Bitte mindestens ein Substantiv auswählen.
                    </p>
                )}
            </main>
        </div>
    );
}
