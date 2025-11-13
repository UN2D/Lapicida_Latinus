// src/components/QuestionVerb.jsx
import { useMemo, useState } from "react";

const TENSES = ["Praesens", "Perfekt"];
const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
const VOICES = ["Aktiv", "Passiv"];
const PERSONS = ["1", "2", "3"];
const NUMBERS = ["Sg", "Pl"];

export default function QuestionVerb({ question, onAnswer, showHelp }) {
    const correctOptions = question.correctOptions || [];

    const [sel, setSel] = useState({ tense: null, mood: null, voice: null, person: null, number: null });
    const [stage, setStage] = useState(0);       // 0: noch kein Fehlversuch, 1: Hinweismodus
    const [firstWrong, setFirstWrong] = useState(null);

    const canCheck = !!sel.tense && !!sel.mood && !!sel.voice && !!sel.person && !!sel.number;

    const isGloballyCorrect = useMemo(() =>
        correctOptions.some(o =>
            o.tense === sel.tense && o.mood === sel.mood && o.voice === sel.voice &&
            o.person === sel.person && o.number === sel.number
        ), [correctOptions, sel]
    );

    function dimOK(dim, val) {
        const probe = { ...sel, [dim]: val };
        return correctOptions.some(o =>
            (!probe.tense || o.tense === probe.tense) &&
            (!probe.mood || o.mood === probe.mood) &&
            (!probe.voice || o.voice === probe.voice) &&
            (!probe.person || o.person === probe.person) &&
            (!probe.number || o.number === probe.number)
        );
    }

    function onPick(dim, val) {
        setSel(s => ({ ...s, [dim]: val }));
    }

    function handleCheck() {
        if (!canCheck) return;
        const ok = isGloballyCorrect;

        if (!showHelp) {
            if (stage === 0 && !ok) {
                setStage(1);
                setFirstWrong({ ...sel });
                return;
            }
            onAnswer(ok, { userAnswer: { ...sel }, attempts: stage === 0 ? 1 : 2 });
            return;
        }

        if (showHelp && stage === 0 && !ok) {
            setStage(1);
            setFirstWrong({ ...sel });
            return;
        }
        onAnswer(ok, { userAnswer: { ...sel }, attempts: stage === 0 ? 1 : 2 });
    }

    function btnClass(dim, val) {
        const classes = ["choice-btn"];
        const selected = sel[dim] === val;
        if (selected) classes.push("selected");

        if (stage === 1) {
            if (showHelp) {
                if (selected) classes.push(dimOK(dim, val) ? "correct" : "wrong");
            } else {
                if (firstWrong && selected && firstWrong[dim] === val) {
                    const okDim = dimOK(dim, val);
                    classes.push(okDim ? "correct" : "wrong");
                }
            }
        }
        return classes.join(" ");
    }

    function disabledPerson(p) {
        if (sel.mood !== "Imperativ") return false;
        return !(p === "2"); // nur 2. Person
    }

    return (
        <div className="question-card">
            <div className="question-lemma">
                {(question.lemmaShown || question.lemma) + " – " + (question.lemmaDe || "")}
            </div>

            <div className="question-form-box">
                <div className="question-form">{question.prompt}</div>
            </div>

            <div className="choice-group">
                <div className="choice-label">Zeit</div>
                <div className="choice-row">
                    {TENSES.map(t => (
                        <button key={t} className={btnClass("tense", t)} onClick={() => onPick("tense", t)}>
                            {t === "Praesens" ? "Präsens" : "Perfekt"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="choice-group">
                <div className="choice-label">Modus</div>
                <div className="choice-row">
                    {MOODS.map(m => (
                        <button key={m} className={btnClass("mood", m)} onClick={() => onPick("mood", m)}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="choice-group">
                <div className="choice-label">Diathese</div>
                <div className="choice-row">
                    {VOICES.map(v => (
                        <button
                            key={v}
                            className={btnClass("voice", v)}
                            disabled={sel.mood === "Imperativ" && v !== "Aktiv"}
                            onClick={() => onPick("voice", v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="choice-group">
                <div className="choice-label">Person</div>
                <div className="choice-row">
                    {PERSONS.map(p => (
                        <button
                            key={p}
                            className={btnClass("person", p)}
                            disabled={disabledPerson(p)}
                            onClick={() => onPick("person", p)}
                        >
                            {p}.
                        </button>
                    ))}
                </div>
            </div>

            <div className="choice-group">
                <div className="choice-label">Numerus</div>
                <div className="choice-row">
                    {NUMBERS.map(n => (
                        <button key={n} className={btnClass("number", n)} onClick={() => onPick("number", n)}>
                            {n === "Sg" ? "Singular" : "Plural"}
                        </button>
                    ))}
                </div>
            </div>

            <button className={"primary-btn" + (!canCheck ? " disabled" : "")}
                disabled={!canCheck}
                onClick={handleCheck}>
                Prüfen
            </button>

            {question.sample && (
                <div className="helper-note"><em>Beispiel:</em> {question.sample}</div>
            )}
        </div>
    );
}
