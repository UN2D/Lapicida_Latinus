// src/components/QuestionVerb.jsx
// ----------------------------------------------------
// Verben: Auswahl + Fehlversuch-Logik (wie Subst./Adj.)
// ----------------------------------------------------
import React, { useState } from "react";

const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];
const TENSES = ["Praesens", "Perfekt", "Imperfekt", "Plusquamperfekt", "Futur I", "Futur II"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];

const PERSON_LABELS = { "1": "1. Person", "2": "2. Person", "3": "3. Person" };
const NUMBER_LABELS = { "Sg": "Singular", "Pl": "Plural" };

export function QuestionVerb({ question, onAnswer, showHelp }) {
    const correct = question?.correctOptions || [];

    const [selPerson, setSelPerson] = useState(null);
    const [selNumber, setSelNumber] = useState(null);
    const [selTense, setSelTense] = useState(null);
    const [selMood, setSelMood] = useState(null);
    const [selVoice, setSelVoice] = useState(null);

    // 0: noch kein Fehlversuch; 1: Fehlversuch gezeigt (Hilfe AUS: freeze-Farben, Hilfe AN: Live-Update); 2: final geprüft
    const [stage, setStage] = useState(0);
    const [snapshot, setSnapshot] = useState(null); // speichert die beim Fehlversuch gewählte Kombi (für Hilfe AUS)

    const canCheck = selPerson && selNumber && selTense && selMood && selVoice;

    const matchesAll = (o, p, n, t, m, v) =>
        o.person === p && o.number === n && o.tense === t && o.mood === m && o.voice === v;

    // Dimension-Checks (individuell; bei teils gewählten Dimensionen wird nur das geprüft, was feststeht)
    const isPersonCorrect = (p) => {
        const N = selNumber, T = selTense, M = selMood, V = selVoice;
        return correct.some(o =>
            o.person === p &&
            (N ? o.number === N : true) &&
            (T ? o.tense === T : true) &&
            (M ? o.mood === M : true) &&
            (V ? o.voice === V : true)
        );
    };
    const isNumberCorrect = (n) => {
        const P = selPerson, T = selTense, M = selMood, V = selVoice;
        return correct.some(o =>
            o.number === n &&
            (P ? o.person === P : true) &&
            (T ? o.tense === T : true) &&
            (M ? o.mood === M : true) &&
            (V ? o.voice === V : true)
        );
    };
    const isTenseCorrect = (t) => {
        const P = selPerson, N = selNumber, M = selMood, V = selVoice;
        return correct.some(o =>
            o.tense === t &&
            (P ? o.person === P : true) &&
            (N ? o.number === N : true) &&
            (M ? o.mood === M : true) &&
            (V ? o.voice === V : true)
        );
    };
    const isMoodCorrect = (m) => {
        const P = selPerson, N = selNumber, T = selTense, V = selVoice;
        return correct.some(o =>
            o.mood === m &&
            (P ? o.person === P : true) &&
            (N ? o.number === N : true) &&
            (T ? o.tense === T : true) &&
            (V ? o.voice === V : true)
        );
    };
    const isVoiceCorrect = (v) => {
        const P = selPerson, N = selNumber, T = selTense, M = selMood;
        return correct.some(o =>
            o.voice === v &&
            (P ? o.person === P : true) &&
            (N ? o.number === N : true) &&
            (T ? o.tense === T : true) &&
            (M ? o.mood === M : true)
        );
    };

    const currentOk = () => {
        if (!(selPerson && selNumber && selTense && selMood && selVoice)) return false;
        return correct.some(o => matchesAll(o, selPerson, selNumber, selTense, selMood, selVoice));
    };

    const handleCheck = () => {
        if (!canCheck) return;

        // Noch kein Fehlversuch
        if (stage === 0) {
            const ok = currentOk();
            if (ok) {
                // sofort korrekt auswerten
                onAnswer(true, { userAnswer: { person: selPerson, number: selNumber, tense: selTense, mood: selMood, voice: selVoice }, attempts: 1 });
                setStage(2);
                return;
            }
            // Falsch: Fehlversuch zeigen
            setStage(1);
            setSnapshot({ person: selPerson, number: selNumber, tense: selTense, mood: selMood, voice: selVoice });
            // Hilfe AN: kein sofortiges onAnswer => Live-Korrektur möglich
            // Hilfe AUS: Farben der Schnappschuss-Auswahl werden eingefroren (per getBtnClass)
            return;
        }

        // Zweiter Klick (final)
        if (stage === 1) {
            const ok = currentOk();
            onAnswer(ok, { userAnswer: { person: selPerson, number: selNumber, tense: selTense, mood: selMood, voice: selVoice }, attempts: 2 });
            setStage(2);
        }
    };

    // Klassenlogik (wie bei Nomen/Adj.)
    function getBtnClass(dim, value) {
        const cls = ["choice-btn"];
        const isSel =
            (dim === "person" && selPerson === value) ||
            (dim === "number" && selNumber === value) ||
            (dim === "tense" && selTense === value) ||
            (dim === "mood" && selMood === value) ||
            (dim === "voice" && selVoice === value);

        if (isSel) cls.push("selected");

        if (stage === 1) {
            if (showHelp) {
                // Live-Update: farbige Bewertung der AKTUELLEN Auswahl
                let ok = false;
                if (dim === "person") ok = isPersonCorrect(value);
                if (dim === "number") ok = isNumberCorrect(value);
                if (dim === "tense") ok = isTenseCorrect(value);
                if (dim === "mood") ok = isMoodCorrect(value);
                if (dim === "voice") ok = isVoiceCorrect(value);

                if (isSel) cls.push(ok ? "correct" : "wrong");
            } else {
                // Hilfe AUS: einfrieren – nur die beim Fehlversuch GEWÄHLTEN Buttons farbig lassen
                if (snapshot) {
                    const snapMatches =
                        (dim === "person" && snapshot.person === value) ||
                        (dim === "number" && snapshot.number === value) ||
                        (dim === "tense" && snapshot.tense === value) ||
                        (dim === "mood" && snapshot.mood === value) ||
                        (dim === "voice" && snapshot.voice === value);

                    if (snapMatches) {
                        // war dieser Schnappschuss-Wert in seiner Dimension korrekt?
                        let ok = false;
                        if (dim === "person") ok = correct.some(o => o.person === value);
                        if (dim === "number") ok = correct.some(o => o.number === value);
                        if (dim === "tense") ok = correct.some(o => o.tense === value);
                        if (dim === "mood") ok = correct.some(o => o.mood === value);
                        if (dim === "voice") ok = correct.some(o => o.voice === value);

                        cls.push(ok ? "correct" : "wrong");
                    }
                }
            }
        }
        return cls.join(" ");
    }

    const lemmaLine =
        question?.lemma && question?.lemmaDe
            ? `${question.lemma} – ${question.lemmaDe}`
            : question?.lemma || "";

    return (
        <div className="question-card">
            {lemmaLine && <div className="question-lemma">{lemmaLine}</div>}

            <div className="question-form-box">
                <div className="question-form">{question?.prompt}</div>
            </div>

            {/* Person */}
            <div className="choice-group">
                <div className="choice-label">Person</div>
                <div className="choice-row">
                    {PERSONS.map(p => (
                        <button key={p} className={getBtnClass("person", p)} onClick={() => setSelPerson(p)}>
                            {PERSON_LABELS[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Numerus */}
            <div className="choice-group">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {NUMBERS.map(n => (
                        <button key={n} className={getBtnClass("number", n)} onClick={() => setSelNumber(n)}>
                            {NUMBER_LABELS[n]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zeitform */}
            <div className="choice-group">
                <div className="choice-label">Zeitform</div>
                <div className="choice-row">
                    {TENSES.map(t => (
                        <button key={t} className={getBtnClass("tense", t)} onClick={() => setSelTense(t)}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modus */}
            <div className="choice-group">
                <div className="choice-label">Modus</div>
                <div className="choice-row">
                    {MOODS.map(m => (
                        <button key={m} className={getBtnClass("mood", m)} onClick={() => setSelMood(m)}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genus (Diathese) */}
            <div className="choice-group">
                <div className="choice-label">Genus</div>
                <div className="choice-row">
                    {VOICES.map(v => (
                        <button key={v} className={getBtnClass("voice", v)} onClick={() => setSelVoice(v)}>
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <button className={"primary-btn" + (!canCheck ? " disabled" : "")} disabled={!canCheck} onClick={handleCheck}>
                Prüfen
            </button>
        </div>
    );
} export default QuestionVerb;
