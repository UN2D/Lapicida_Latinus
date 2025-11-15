// src/components/QuestionVerb.jsx
import React, { useState } from "react";

/**
 * Verb-Frage (Person / Numerus / Zeitform / Modus / Genus)
 * Styling-Klassen sind identisch zu Nomen/Adjektiv:
 * - question-card, question-lemma, question-form-box, question-form
 * - choice-group, choice-label, choice-row, choice-btn (+ selected|correct|wrong)
 * - primary-btn (+ disabled)
 *
 * Props:
 *  - question: { prompt, lemma, lemmaDe, correctOptions:[{person,number,tense,mood,voice}] }
 *  - showHelp: boolean (Hilfemodus)
 *  - onAnswer: function(ok:boolean, meta?:{ userAnswer, attempts })
 */
export default function QuestionVerb({ question, showHelp, onAnswer }) {
    // ----------------------------- Auswahl-State --------------------------------
    const [selPerson, setSelPerson] = useState(null);  // 1 | 2 | 3
    const [selNumber, setSelNumber] = useState(null);  // "Sg" | "Pl"
    const [selTense, setSelTense] = useState(null);  // "Präsens" | ...
    const [selMood, setSelMood] = useState(null);  // "Indikativ" | ...
    const [selVoice, setSelVoice] = useState(null);  // "Aktiv" | "Passiv"

    // ----------------------------- Prüf-Logik-Flags -----------------------------
    const helpOn = !!showHelp;

    // Wurde bereits mind. einmal "Prüfen" gedrückt?
    const [firstChecked, setFirstChecked] = useState(false);

    // Hilfe-AN: nach erstem Fehlversuch → Live-Check
    const [hintMode, setHintMode] = useState(false);

    // Hilfe-AUS: nach erstem Fehlversuch → eingefrorene Bewertung der zu diesem
    // Zeitpunkt gewählten Optionen (spätere Änderungen zeigen wieder neutral)
    // Struktur: { person:{value,ok}, number:{...}, tense:{...}, mood:{...}, voice:{...} }
    const [frozen, setFrozen] = useState(null);

    // ----------------------------- Konstanten/Labels ----------------------------
    const PERSONS = [1, 2, 3];
    const PERSON_LABEL = { 1: "1. Person", 2: "2. Person", 3: "3. Person" };

    const NUMBERS = ["Sg", "Pl"];
    const NUMBER_LABEL = { Sg: "Singular", Pl: "Plural" };

    const TENSES = ["Präsens", "Perfekt", "Imperfekt", "Plusquamp.", "Futur I", "Futur II"];
    const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
    const VOICES = ["Aktiv", "Passiv"];

    // ----------------------------- Normalisierung -------------------------------
    // Codes wie in den Daten/Generatoren
    const TENSETAB = {
        "praesens": "PRS", "präsens": "PRS", "praesent": "PRS",
        "imperfekt": "IMPF",
        "perfekt": "PERF",
        "plusquamperfekt": "PQP", "plusquamp.": "PQP", "plusquamperf.": "PQP",
        "futur i": "FUT1", "futur1": "FUT1",
        "futur ii": "FUT2", "futur2": "FUT2"
    };
    const MOODTAB = { "indikativ": "IND", "konjunktiv": "KONJ", "imperativ": "IMP" };
    const VOICETAB = { "aktiv": "ACT", "passiv": "PASS" };
    const NUMTAB = { "sg": "SG", "singular": "SG", "pl": "PL", "plural": "PL" };

    const codeTense = v => v == null ? null : (TENSETAB[String(v).toLowerCase()] || String(v));
    const codeMood = v => v == null ? null : (MOODTAB[String(v).toLowerCase()] || String(v));
    const codeVoice = v => v == null ? null : (VOICETAB[String(v).toLowerCase()] || String(v));
    const codeNumber = v => v == null ? null : (NUMTAB[String(v).toLowerCase()] || String(v));
    const codePerson = v => v == null ? null : Number(v);

    // Benutzer-Auswahl in Codes
    const currentSel = () => ({
        person: codePerson(selPerson),
        number: codeNumber(selNumber),
        tense: codeTense(selTense),
        mood: codeMood(selMood),
        voice: codeVoice(selVoice),
    });

    // Korrekte Optionen aus Frage (immer als Codes vergleichen)
    const correct = question?.correctOptions || [];
    const optCodes = o => ({
        person: codePerson(o.person),
        number: codeNumber(o.number),
        tense: codeTense(o.tense),
        mood: codeMood(o.mood),
        voice: codeVoice(o.voice),
    });

    // ----------------------------- Prüffunktionen -------------------------------
    // 1) Feldweise (unabhängig): „Ist diese konkrete Option irgendwo korrekt?“
    const isPersonCorrect = (p) => correct.some(o => optCodes(o).person === codePerson(p));
    const isNumberCorrect = (n) => correct.some(o => optCodes(o).number === codeNumber(n));
    const isTenseCorrect = (t) => correct.some(o => optCodes(o).tense === codeTense(t));
    const isMoodCorrect = (m) => correct.some(o => optCodes(o).mood === codeMood(m));
    const isVoiceCorrect = (v) => correct.some(o => optCodes(o).voice === codeVoice(v));

    // 2) Vollständige Übereinstimmung? (für Ergebnis)
    const isFullyCorrect = () => {
        const u = currentSel();
        if (Object.values(u).some(v => v == null)) return false; // unvollständig
        return correct.some(o => {
            const c = optCodes(o);
            return c.person === u.person &&
                c.number === u.number &&
                c.tense === u.tense &&
                c.mood === u.mood &&
                c.voice === u.voice;
        });
    };

    // ----------------------------- Button-Farben --------------------------------
    function frozenStatusFor(dim, value) {
        // Nur für Hilfe AUS nach erstem Fehlversuch
        if (!frozen) return null;
        const f = frozen[dim];
        if (!f) return null;
        if (f.value !== value) return "neutral";
        return f.ok ? "correct" : "wrong";
    }

    function getBtnClass(dim, value) {
        const selected =
            (dim === "person" && selPerson === value) ||
            (dim === "number" && selNumber === value) ||
            (dim === "tense" && selTense === value) ||
            (dim === "mood" && selMood === value) ||
            (dim === "voice" && selVoice === value);

        // Grundstil
        let cls = "choice-btn";
        if (selected) cls += " selected";

        // Vor dem ersten Prüfen: immer neutral
        if (!firstChecked) return cls;

        // Nach 1. Prüfen – Hilfe AN: Live-Check nur für die GEWÄHLTE Option
        if (helpOn && hintMode && selected) {
            const ok =
                (dim === "person" ? isPersonCorrect(value) :
                    dim === "number" ? isNumberCorrect(value) :
                        dim === "tense" ? isTenseCorrect(value) :
                            dim === "mood" ? isMoodCorrect(value) :
                                dim === "voice" ? isVoiceCorrect(value) : false);
            cls += ok ? " correct" : " wrong";
            return cls;
        }

        // Nach 1. Prüfen – Hilfe AUS: eingefrorene Bewertung nur für die damalige Auswahl
        if (!helpOn) {
            const st = frozenStatusFor(dim, value);
            if (st === "correct") cls += " correct";
            else if (st === "wrong") cls += " wrong";
        }

        return cls;
    }

    // ----------------------------- Events --------------------------------------
    const onPick = (setter, value) => {
        setter(prev => (prev === value ? null : value));
    };

    const allChosen =
        selPerson != null && selNumber != null && selTense != null && selMood != null && selVoice != null;

    function handleCheck() {
        if (!allChosen) return; // erst wenn alles gewählt ist

        const ok = isFullyCorrect();
        const user = {
            person: selPerson, number: selNumber, tense: selTense, mood: selMood, voice: selVoice,
        };

        // ERSTER Prüfen-Klick
        if (!firstChecked) {
            setFirstChecked(true);

            if (ok) {
                // direkt richtig → Ergebnis
                onAnswer?.(true, { userAnswer: user, attempts: 1 });
                return;
            }

            // nicht vollständig richtig
            if (helpOn) {
                // Hilfe AN: Live-Check einschalten, Seite bleibt
                setHintMode(true);
                setFrozen(null);
            } else {
                // Hilfe AUS: Bewertung der JETZT gewählten Optionen einfrieren
                setHintMode(false);
                setFrozen({
                    person: { value: selPerson, ok: isPersonCorrect(selPerson) },
                    number: { value: selNumber, ok: isNumberCorrect(selNumber) },
                    tense: { value: selTense, ok: isTenseCorrect(selTense) },
                    mood: { value: selMood, ok: isMoodCorrect(selMood) },
                    voice: { value: selVoice, ok: isVoiceCorrect(selVoice) },
                });
            }
            return; // bleibt auf der Frage
        }

        // ZWEITER (oder weiterer) Prüfen-Klick → immer zur Ergebnisseite
        onAnswer?.(ok, { userAnswer: user, attempts: 2 });
    }

    const canCheck = allChosen;

    // ----------------------------- Render --------------------------------------
    return (
        <div className="question-card">
            {question?.lemma && (
                <div className="question-lemma">
                    {question.lemma}{question.lemmaDe ? ` – ${question.lemmaDe}` : ""}
                </div>
            )}

            <div className="question-form-box">
                <div className="question-form">{question?.prompt}</div>
            </div>

            {/* Person */}
            <div className="choice-group">
                <div className="choice-label">Person</div>
                <div className="choice-row">
                    {PERSONS.map((p) => (
                        <button
                            key={p}
                            className={getBtnClass("person", p)}
                            onClick={() => onPick(setSelPerson, p)}
                        >
                            {PERSON_LABEL[p]}
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
                            onClick={() => onPick(setSelNumber, n)}
                        >
                            {NUMBER_LABEL[n]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zeitform */}
            <div className="choice-group">
                <div className="choice-label">Zeitform</div>
                <div className="choice-row">
                    {TENSES.map((t) => (
                        <button
                            key={t}
                            className={getBtnClass("tense", t)}
                            onClick={() => onPick(setSelTense, t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modus */}
            <div className="choice-group">
                <div className="choice-label">Modus</div>
                <div className="choice-row">
                    {MOODS.map((m) => (
                        <button
                            key={m}
                            className={getBtnClass("mood", m)}
                            onClick={() => onPick(setSelMood, m)}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus (Diathese) */}
            <div className="choice-group">
                <div className="choice-label">Genus (Diathese)</div>
                <div className="choice-row">
                    {VOICES.map((v) => (
                        <button
                            key={v}
                            className={getBtnClass("voice", v)}
                            onClick={() => onPick(setSelVoice, v)}
                        >
                            {v}
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
