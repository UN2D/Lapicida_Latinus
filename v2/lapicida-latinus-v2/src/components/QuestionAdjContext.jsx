// src/components/QuestionAdjContext.jsx
import React, { useState, useMemo } from "react";

/**
 * Adjektive im Kontext – Auswahl Kasus / Numerus / Genus
 * Logik (vereinbart):
 * - Es gibt immer genau 1 Fehlversuch.
 * - Hilfe AN: Nach 1. Fehlversuch Live-Update. Bewertung per Priorität K > N > G:
 *   Wir filtern die korrekten Optionen schrittweise (Case -> Number -> Gender).
 *   Ein ausgewählter Button ist grün, wenn er zu einem noch möglichen Treffer passt,
 *   sonst rot. Unausgewählte bleiben neutral.
 * - Hilfe AUS: Nach 1. Fehlversuch EINMAL farblich bewerten (die damalige Auswahl).
 *   Danach bleiben spätere Änderungen neutral (kein Live-Update).
 */

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
const NUMBER_LABELS = { Sg: "Singular", Pl: "Plural" };
const GENDER_LABELS = { m: "maskulin", f: "feminin", n: "neutrum" };

export function QuestionAdjContext({ question, onAnswer, showHelp }) {
    const correctOptions = question?.correctOptions || [];

    // aktuelle Auswahl
    const [selCase, setSelCase] = useState(null);
    const [selNum, setSelNum] = useState(null);
    const [selGen, setSelGen] = useState(null);

    // 0 = noch kein Fehlversuch ausgewertet
    // 1 = Fehlversuch bereits passiert
    const [failStage, setFailStage] = useState(0);

    // Nur für Hilfe AUS: eingefrorenes Feedback der ERSTEN falschen Auswahl
    // { case: "correct"|"wrong", number: "...", gender: "..." }
    const [frozenFeedback, setFrozenFeedback] = useState(null);

    const canCheck = !!selCase && !!selNum && !!selGen;

    // ---- Hilfsfunktionen ----------------------------------------------------

    // Gefilterte gültige Optionen nach Priorität
    const filteredAfterCase = useMemo(() => {
        if (!selCase) return correctOptions;
        return correctOptions.filter((o) => o.case === selCase);
    }, [correctOptions, selCase]);

    const filteredAfterNumber = useMemo(() => {
        if (!selNum) return filteredAfterCase;
        return filteredAfterCase.filter((o) => o.number === selNum);
    }, [filteredAfterCase, selNum]);

    // Prüft, ob die komplette Auswahl (K,N,G) zu einer korrekten Option passt
    const isSelectionCorrect = useMemo(() => {
        if (!selCase || !selNum || !selGen) return false;
        return correctOptions.some(
            (o) => o.case === selCase && o.number === selNum && o.gender === selGen
        );
    }, [correctOptions, selCase, selNum, selGen]);

    // Live-Bewertung (nur Hilfe AN ODER vor dem ersten Fehlversuch irrelevant)
    // Gibt für die ausgewählte Option pro Dimension "correct"/"wrong"/null
    const liveEval = useMemo(() => {
        if (!showHelp) return null; // live nur, wenn Hilfe AN
        const res = { case: null, number: null, gender: null };

        // Case: grün, wenn es irgendeine Option mit diesem Case gibt
        if (selCase) {
            const ok = correctOptions.some((o) => o.case === selCase);
            res.case = ok ? "correct" : "wrong";
        }

        // Number: bewerte gegen die nach Case gefilterten
        if (selNum) {
            const ok =
                filteredAfterCase.length > 0 &&
                filteredAfterCase.some((o) => o.number === selNum);
            res.number = ok ? "correct" : "wrong";
        }

        // Gender: bewerte gegen die nach Case+Number gefilterten
        if (selGen) {
            const ok =
                filteredAfterNumber.length > 0 &&
                filteredAfterNumber.some((o) => o.gender === selGen);
            res.gender = ok ? "correct" : "wrong";
        }
        return res;
    }, [showHelp, correctOptions, selCase, selNum, selGen, filteredAfterCase, filteredAfterNumber]);

    // Einmalige Bewertung (nur wenn Hilfe AUS und Fehlversuch passiert)
    const oneShotEval = useMemo(() => {
        if (showHelp) return null;
        return frozenFeedback; // kann null sein
    }, [showHelp, frozenFeedback]);

    // CSS-Klassen für Buttons
    function getBtnClass(dimension, value) {
        const classes = ["choice-btn"];

        const isSelected =
            (dimension === "case" && selCase === value) ||
            (dimension === "number" && selNum === value) ||
            (dimension === "gender" && selGen === value);

        if (isSelected) classes.push("selected");

        // Nach dem Fehlversuch:
        if (failStage === 1) {
            if (showHelp && liveEval) {
                // Hilfe AN → Live-Update
                const tag = dimension === "case" ? "case" :
                    dimension === "number" ? "number" : "gender";
                if (isSelected && liveEval[tag]) classes.push(liveEval[tag]); // correct|wrong
            } else if (!showHelp && oneShotEval) {
                // Hilfe AUS → eingefrorenes Feedback nur für die damals ausgewählte Option
                const tag = dimension === "case" ? "case" :
                    dimension === "number" ? "number" : "gender";
                if (isSelected && oneShotEval[tag]) classes.push(oneShotEval[tag]);
            }
        }

        return classes.join(" ");
    }

    // ---- Interaktionen ------------------------------------------------------

    function handleCheck() {
        if (!canCheck) return;

        const ok = isSelectionCorrect;

        // Hilfe AUS: nach erstem Fehlversuch frieren wir das Feedback ein
        if (!showHelp && failStage === 0 && !ok) {
            setFailStage(1);
            // erzeuge gefrorenes Feedback für GENAU diese (falsche) Auswahl
            const fb = {
                case: correctOptions.some((o) => o.case === selCase) ? "correct" : "wrong",
                number:
                    filteredAfterCase.length > 0 &&
                        filteredAfterCase.some((o) => o.number === selNum)
                        ? "correct"
                        : "wrong",
                gender:
                    filteredAfterNumber.length > 0 &&
                        filteredAfterNumber.some((o) => o.gender === selGen)
                        ? "correct"
                        : "wrong",
            };
            setFrozenFeedback(fb);
            // Kein Ergebnis-Screen, erst zweiter Klick entscheidet
            return;
        }

        // Hilfe AN: erster falscher Klick startet nur den Hinweis-Modus (live)
        if (showHelp && failStage === 0 && !ok) {
            setFailStage(1);
            return; // kein Ergebnis-Screen, Live-Update aktiv
        }

        // sonst (korrekt ODER zweiter Klick) → endgültiges Ergebnis an Quiz melden
        onAnswer(ok, {
            userAnswer: { case: selCase, number: selNum, gender: selGen },
            attempts: failStage === 0 ? 1 : 2,
        });
    }

    return (
        <div className="question-card">
            {question?.lemma && (
                <div className="question-lemma">
                    {question.lemma}
                    {question.lemmaDe ? ` – ${question.lemmaDe}` : ""}
                </div>
            )}

            <div className="question-form-box">
                <div className="question-form">{question?.prompt}</div>
            </div>

            {/* Kasus */}
            <div className="choice-group">
                <div className="choice-label">Kasus</div>
                <div className="choice-row">
                    {CASES.map((c) => (
                        <button
                            key={c}
                            className={getBtnClass("case", c)}
                            onClick={() => setSelCase(c)}
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
                            onClick={() => setSelNum(n)}
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
                            onClick={() => setSelGen(g)}
                        >
                            {GENDER_LABELS[g]}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={"primary-btn" + (!canCheck ? " disabled" : "")}
                disabled={!canCheck}
                onClick={handleCheck}
            >
                Prüfen
            </button>
        </div>
    );
}
