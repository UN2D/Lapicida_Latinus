// src/components/QuestionNoun.jsx
import { useState } from "react";

const CASES = ["Nom", "Gen", "Dat", "Akk", "Abl"];
const NUMBERS = ["Sg", "Pl"];
const GENDERS = ["m", "f", "n"];

const CASE_LABELS = {
    Nom: "Nominativ",
    Gen: "Genitiv",
    Dat: "Dativ",
    Akk: "Akkusativ",
    Abl: "Ablativ",
};

const NUMBER_LABELS = {
    Sg: "Singular",
    Pl: "Plural",
};

const GENDER_LABELS = {
    m: "maskulin",
    f: "feminin",
    n: "neutrum",
};

export function QuestionNoun({ question, onAnswer, showHelp }) {
    const correctOptions = question.correctOptions || [];

    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);

    // Wurde bereits einmal "Prüfen" gedrückt?
    const [hintActive, setHintActive] = useState(false);
    // Auswahl beim ersten Prüfen (nur für Hilfe AUS relevant)
    const [hintSelection, setHintSelection] = useState(null);
    // Ist die Frage final gewertet? (danach keine Interaktion mehr)
    const [finalized, setFinalized] = useState(false);

    const canCheck =
        !!selectedCase && !!selectedNumber && !!selectedGender;

    // Prüft, ob eine vollständige Auswahl exakt zu einer korrekten Option passt
    const isFullCorrect = (sel) =>
        !!correctOptions.find(
            (opt) =>
                opt.case === sel.case &&
                opt.number === sel.number &&
                opt.gender === sel.gender
        );

    // ---- Dimensionen-Bewertung nach deiner Priorität ----
    // Gibt "correct" | "wrong" | "neutral" zurück

    const evalCase = (selCase) => {
        if (!selCase) return "neutral";
        const has = correctOptions.some((opt) => opt.case === selCase);
        return has ? "correct" : "wrong";
    };

    const evalNumber = (selCase, selNumber) => {
        if (!selNumber) return "neutral";
        if (!selCase) return "neutral";

        const optionsWithCase = correctOptions.filter(
            (opt) => opt.case === selCase
        );
        if (optionsWithCase.length === 0) {
            // Kasus ist offenbar falsch → Numerus hier nicht bestrafen
            return "neutral";
        }
        const has = optionsWithCase.some(
            (opt) => opt.number === selNumber
        );
        return has ? "correct" : "wrong";
    };

    const evalGender = (selGender) => {
        if (!selGender) return "neutral";
        const has = correctOptions.some(
            (opt) => opt.gender === selGender
        );
        return has ? "correct" : "wrong";
    };

    // Liefert den Status ("correct"/"wrong"/"neutral") für eine Dimension,
    // abhängig vom Modus und davon, ob wir im Hinweis-Modus sind.
    const getDimensionStatus = (dimension, value) => {
        // Noch kein Prüfen -> keine Farben
        if (!hintActive) return "neutral";

        // Hilfe AN: immer aktuelle Auswahl live auswerten
        if (showHelp) {
            const sel = {
                case: selectedCase,
                number: selectedNumber,
                gender: selectedGender,
            };

            if (
                !sel.case ||
                !sel.number ||
                !sel.gender
            ) {
                // unvollständig -> nur markieren, wenn dieser Button gerade Teil der Auswahl ist
                if (
                    (dimension === "case" && value === sel.case) ||
                    (dimension === "number" && value === sel.number) ||
                    (dimension === "gender" && value === sel.gender)
                ) {
                    // aber ohne vollständige Auswahl keine "richtig/falsch"-Aussage
                    return "neutral";
                }
                return "neutral";
            }

            // Vollständige aktuelle Auswahl vorhanden:
            if (dimension === "case" && value === sel.case) {
                return evalCase(sel.case);
            }
            if (dimension === "number" && value === sel.number) {
                return evalNumber(sel.case, sel.number);
            }
            if (dimension === "gender" && value === sel.gender) {
                return evalGender(sel.gender);
            }
            return "neutral";
        }

        // Hilfe AUS: wir zeigen Feedback nur für die ERSTE geprüfte Auswahl.
        // Danach werden geänderte Buttons neutral.
        if (!hintSelection) return "neutral";

        const sel = hintSelection;

        if (dimension === "case") {
            if (value !== sel.case) return "neutral";
            return evalCase(sel.case);
        }
        if (dimension === "number") {
            if (value !== sel.number) return "neutral";
            return evalNumber(sel.case, sel.number);
        }
        if (dimension === "gender") {
            if (value !== sel.gender) return "neutral";
            return evalGender(sel.gender);
        }
        return "neutral";
    };

    const handleCheck = () => {
        if (!canCheck || finalized) return;

        const currentSel = {
            case: selectedCase,
            number: selectedNumber,
            gender: selectedGender,
        };

        const fullCorrect = isFullCorrect(currentSel);

        // Erster Klick auf "Prüfen"
        if (!hintActive) {
            setHintActive(true);
            setHintSelection(currentSel);

            if (fullCorrect) {
                // Direkt richtig -> fertig
                setFinalized(true);
                onAnswer(true, {
                    userAnswer: currentSel,
                    attempts: 1,
                });
            }
            // Wenn falsch:
            // Hilfe AN: Hinweismodus aktiv, Live-Farben über getDimensionStatus (aktuelle Auswahl)
            // Hilfe AUS: einmalige Farben basierend auf hintSelection,
            //            User darf umwählen, neue Buttons werden neutral.
            return;
        }

        // Zweiter Klick auf "Prüfen" -> finale Wertung mit aktueller Auswahl
        const finalCorrect = isFullCorrect(currentSel);
        setFinalized(true);
        onAnswer(finalCorrect, {
            userAnswer: currentSel,
            attempts: 2,
        });
    };

    const getBtnClass = (dimension, value) => {
        const classes = ["choice-btn"];

        const isSelected =
            (dimension === "case" && selectedCase === value) ||
            (dimension === "number" && selectedNumber === value) ||
            (dimension === "gender" && selectedGender === value);

        if (isSelected) {
            classes.push("selected");
        }

        // Nach dem ersten Prüfen -> ggf. korrekt/falsch einfärben
        if (hintActive) {
            const status = getDimensionStatus(dimension, value);

            if (isSelected && status === "correct") {
                classes.push("correct");
            }
            if (isSelected && status === "wrong") {
                classes.push("wrong");
            }
        }

        // Nach finaler Wertung -> Buttons nicht mehr bedienbar (Styling optional)
        if (finalized) {
            classes.push("locked");
        }

        return classes.join(" ");
    };

    const lemmaLine =
        question.lemma && question.lemmaDe
            ? `${question.lemma} – ${question.lemmaDe}`
            : question.lemma || "";

    return (
        <div className="question-card">
            {lemmaLine && (
                <div className="question-lemma">
                    {lemmaLine}
                </div>
            )}

            <div className="question-form-box">
                <div className="question-form">
                    {question.prompt}
                </div>
            </div>

            {/* Kasus */}
            <div className="choice-group">
                <div className="choice-label">Kasus</div>
                <div className="choice-row">
                    {CASES.map((c) => (
                        <button
                            key={c}
                            className={getBtnClass("case", c)}
                            onClick={() =>
                                !finalized && setSelectedCase(c)
                            }
                        >
                            {CASE_LABELS[c]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Numerus */}
            <div className="choice-group">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {NUMBERS.map((n) => (
                        <button
                            key={n}
                            className={getBtnClass("number", n)}
                            onClick={() =>
                                !finalized && setSelectedNumber(n)
                            }
                        >
                            {NUMBER_LABELS[n]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus */}
            <div className="choice-group">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {GENDERS.map((g) => (
                        <button
                            key={g}
                            className={getBtnClass("gender", g)}
                            onClick={() =>
                                !finalized && setSelectedGender(g)
                            }
                        >
                            {GENDER_LABELS[g]}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={
                    "primary-btn" +
                    (!canCheck || finalized ? " disabled" : "")
                }
                disabled={!canCheck || finalized}
                onClick={handleCheck}
            >
                Prüfen
            </button>
        </div>
    );
}
