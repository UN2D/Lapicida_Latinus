import React, { useEffect, useState } from "react";





export default function QuestionVerb({ question, showHelp, onAnswer }) {
    const [helpStage, setHelpStage] = useState(0); // 0 = noch kein Fehlversuch gezeigt, 1 = Fehlversuch markiert
    const [firstWrong, setFirstWrong] = useState(null);
    const TENSETAB = {
        "praesens": "PRS", "präsens": "PRS", "praesent": "PRS",
        "imperfekt": "IMPF",
        "perfekt": "PERF",
        "plusquamperfekt": "PQP", "plusquamp.": "PQP", "plusquamperf.": "PQP", "plusquamperf": "PQP",
        "futur i": "FUT1", "futur1": "FUT1",
        "futur ii": "FUT2", "futur2": "FUT2"
    };
    const MOODTAB = { "indikativ": "IND", "konjunktiv": "KONJ", "imperativ": "IMP" };
    const VOICETAB = { "aktiv": "ACT", "passiv": "PASS" };
    const NUMTAB = { "sg": "SG", "singular": "SG", "pl": "PL", "plural": "PL" };

    // selections
    const [selPerson, setSelPerson] = useState(null);    // 1|2|3
    const [selNumber, setSelNumber] = useState(null);    // "Sg"|"Pl"
    const [selTense, setSelTense] = useState(null);    // string
    const [selMood, setSelMood] = useState(null);    // string
    const [selVoice, setSelVoice] = useState(null);    // "Aktiv"|"Passiv"

    // attempt state (aligned with nouns/adjectives wording)
    const helpOn = !!showHelp;
    const [firstChecked, setFirstChecked] = useState(false); // user pressed Prüfen at least once
    const [hintMode, setHintMode] = useState(false);         // only with help ON after wrong first try
    // Frozen feedback for help OFF (stores only what was selected when pressing Prüfen)
    const [frozen, setFrozen] = useState(null);
    // { person: {value, ok}, number:{...}, tense:{...}, mood:{...}, voice:{...} }

    // constants (always render all)
    const PERSONS = [1, 2, 3];
    const PERSON_LABELS = { "1": "1.", "2": "2.", "3": "3." };
    const NUMBERS = ["Sg", "Pl"];
    const TENSES = ["Präsens", "Imperfekt", "Perfekt", "Plusquamp.", "Futur I", "Futur II"];
    const MOODS = ["Indikativ", "Konjunktiv", "Imperativ"];
    const VOICES = ["Aktiv", "Passiv"];

    const allChosen =
        selPerson != null && selNumber != null &&
        selTense != null && selMood != null && selVoice != null;

    const [attemptStage, setAttemptStage] = useState(0);
    const canCheck = selPerson && selNumber && selTense && selMood && selVoice;

    // --- Normalisierung auf Codes ----------------------------------------------


    function codeTense(v) { if (v == null) return null; return TENSETAB[String(v).toLowerCase()] || String(v); }
    function codeMood(v) { if (v == null) return null; return MOODTAB[String(v).toLowerCase()] || String(v); }
    function codeVoice(v) { if (v == null) return null; return VOICETAB[String(v).toLowerCase()] || String(v); }
    function codeNum(v) { if (v == null) return null; return NUMTAB[String(v).toLowerCase()] || String(v); }
    function codePerson(v) { return v == null ? null : Number(v); }

    // Alle ausgewählten Werte als Codes
    function selCodes(sel) {
        return {
            person: codePerson(sel.selPerson),
            number: codeNum(sel.selNumber),
            tense: codeTense(sel.selTense),
            mood: codeMood(sel.selMood),
            voice: codeVoice(sel.selVoice),
        };
    }

    // Option (aus correctOptions) als Codes
    function optCodes(o) {
        return {
            person: codePerson(o.person),
            number: codeNum(o.number),
            tense: codeTense(o.tense),
            mood: codeMood(o.mood),
            voice: codeVoice(o.voice),
        };
    }

    const correct = question.correctOptions || [];
    const SOL = correct[0] || {}; // z.B. { person:'3', number:'Pl', tense:'Praes', mood:'Ind', voice:'Act' }
    const SOLC = optCodes(SOL); //

    // ---- helpers --------------------------------------------------------------

    function matchesAllOther(oRaw, exceptKeys) {
        const ex = new Set(exceptKeys);
        const o = optCodes(oRaw);
        const s = selCodes({ selPerson, selNumber, selTense, selMood, selVoice });

        if (!ex.has("person") && s.person != null && o.person !== s.person) return false;
        if (!ex.has("number") && s.number != null && o.number !== s.number) return false;
        if (!ex.has("tense") && s.tense != null && o.tense !== s.tense) return false;
        if (!ex.has("mood") && s.mood != null && o.mood !== s.mood) return false;
        if (!ex.has("voice") && s.voice != null && o.voice !== s.voice) return false;
        return true;
    }

    function isPersonCorrect(p) {
        const pp = codePerson(p);
        if (selNumber != null) {
            const nn = codeNum(selNumber);
            return correct.some(o => {
                const oc = optCodes(o);
                return oc.person === pp;
            });
        }
        return correct.some(o => optCodes(o).person === pp);
    }

    function isNumberCorrect(n) {
        const nn = codeNum(n);
        if (selPerson != null) {
            const pp = codePerson(selPerson);
            return correct.some(o => {
                const oc = optCodes(o);
                return oc.number === nn
            });
        }
        return correct.some(o => optCodes(o).number === nn);
    }

    const isTenseCorrect = (t) => correct.some(o => optCodes(o).tense === codeTense(t));
    const isMoodCorrect = (m) => correct.some(o => optCodes(o).mood === codeMood(m));
    const isVoiceCorrect = (v) => correct.some(o => optCodes(o).voice === codeVoice(v));

    function isDimCorrect(dim, rawVal) {
        if (!SOL) return false;
        // ausgewählten Wert in Code umsetzen
        let v;
        switch (dim) {
            case "person": v = codePerson(rawVal); break;
            case "number": v = codeNum(rawVal); break;
            case "tense": v = codeTense(rawVal); break;
            case "mood": v = codeMood(rawVal); break;
            case "voice": v = codeVoice(rawVal); break;
            default: v = rawVal;
        }
        return SOLC[dim] === v;
    }
    /*
        function isFullSelectionCorrect() {
            return (
                selPerson != null && isDimCorrect('person', selPerson) &&
                selNumber != null && isDimCorrect('number', selNumber) &&
                selTense != null && isDimCorrect('tense', selTense) &&
                selMood != null && isDimCorrect('mood', selMood) &&
                selVoice != null && isDimCorrect('voice', selVoice)
            );
        }
    */
    const isFullSelectionCorrect = () =>
        (question.correctOptions || []).some(o =>
            o.person != null && isDimCorrect('person', selPerson) &&
            o.number != null && isDimCorrect('number', selNumber) &&
            o.tense != null && isDimCorrect('tense', selTense) &&
            o.mood != null && isDimCorrect('mood', selMood) &&
            o.voice != null && isDimCorrect('voice', selVoice)
        );

    // auto-finish in hint mode when the combination becomes correct
    /*
    useEffect(() => {
        if (hintMode && allChosen && isFullSelectionCorrect()) {
            onAnswer?.({ ok: true });
        }
    }, [hintMode, selPerson, selNumber, selTense, selMood, selVoice]); // eslint-disable-line
*/
    // ---- button class logic (same pattern as nouns/adjectives) ----------------

    function frozenStatusFor(dim, value) {
        if (!frozen) return null;
        const f = frozen[dim];
        if (!f) return null;
        if (f.value !== value) return "neutral";
        return f.ok ? "correct" : "wrong";
    }

    function currentRightFor(dim, value) {
        switch (dim) {
            case "person": return isPersonCorrect(value);
            case "number": return isNumberCorrect(value);
            case "tense": return isTenseCorrect(value);
            case "mood": return isMoodCorrect(value);
            case "voice": return isVoiceCorrect(value);
            default: return false;
        }
    }

    function getBtnClass(dim, value) {
        const selected =
            (dim === "person" && selPerson === value) ||
            (dim === "number" && selNumber === value) ||
            (dim === "tense" && selTense === value) ||
            (dim === "mood" && selMood === value) ||
            (dim === "voice" && selVoice === value);

        let cls = "choice-btn";
        if (selected) cls += " selected";

        // before first Prüfen OR not selected → neutral (blue only)
        if (!firstChecked || !selected) return cls;

        // after first Prüfen:
        if (helpOn) {
            if (hintMode) {
                const ok = currentRightFor(dim, value);
                cls += ok ? " correct" : " wrong";
            }
        } else {
            const st = frozenStatusFor(dim, value);
            if (st === "correct") cls += " correct";
            else if (st === "wrong") cls += " wrong";
        }
        return cls;
    }
    const currentSel = () => ({
        person: selPerson,
        number: selNumber,
        tense: selTense,
        mood: selMood,
        voice: selVoice,
    });

    // komplette Auswahl prüfen
    function isFullyCorrect() {
        if (correct.length === 0) return false;
        const u = currentSel();
        return correct.some(
            (o) =>
                o.person === u.person &&
                o.number === u.number &&
                o.tense === u.tense &&
                o.mood === u.mood &&
                o.voice === u.voice
        );
    }
    // ---- events ---------------------------------------------------------------

    const onPick = (setter, value) => {
        setter(prev => (prev === value ? null : value));
    };

    function dimValueIsPossible(dim, val) {
        const tmp = {
            person: selPerson,
            number: selNumber,
            tense: selTense,
            mood: selMood,
            voice: selVoice,
        };

        tmp[dim] = val;
        // possible if any correct option matches all currently set values in tmp
        return correct.some(o =>
            (tmp.person == null || o.person === tmp.person) &&
            (tmp.number == null || o.number === tmp.number) &&
            (tmp.tense == null || o.tense === tmp.tense) &&
            (tmp.mood == null || o.mood === tmp.mood) &&
            (tmp.voice == null || o.voice === tmp.voice)
        );
    }

    /* function handleCheck() {
         // Vollständige Auswahl erforderlich
         if (!allChosen || !canCheck) return;
         if (
             selPerson == null ||
             selNumber == null ||
             !selTense ||
             !selMood ||
             !selVoice
         ) return;
 
         const fullOk = isFullSelectionCorrect();
 
         const ok = isFullyCorrect();
         const user = currentSel();
 
         // === ERSTER Klick auf "Prüfen" ===
         if (!firstChecked) {
             setFirstChecked(true); // <- wichtig: Erstversuch markieren
 
             if (fullOk) {
                 // sofort richtig abschließen
                 onAnswer?.({ ok: true });
                 return;
             }
 
             if (helpOn) {
                 // Hilfe AN: in den Hinweismodus wechseln (Live-Feedback),
                 // aber noch KEIN Ergebnis-Screen.
                 setHintMode(true);
                 setFrozen(null);
             } else {
                 // Hilfe AUS: Momentaufnahme einfrieren (keine Live-Farben),
                 // noch KEIN Ergebnis-Screen.
                 setHintMode(false);
                 setFrozen({
                     person: { value: selPerson, ok: isDimCorrect("person", selPerson) },
                     number: { value: selNumber, ok: isDimCorrect("number", selNumber) },
                     tense: { value: selTense, ok: isDimCorrect("tense", selTense) },
                     mood: { value: selMood, ok: isDimCorrect("mood", selMood) },
                     voice: { value: selVoice, ok: isDimCorrect("voice", selVoice) },
                 });
             }
             return;
         }
 
         // === ZWEITER Klick auf "Prüfen" (oder weitere) ===
         if (fullOk) {
             // korrekt -> Abschluss
             onAnswer?.({ ok: true });
             return;
         }
 
         // weiterhin falsch -> Ergebnis FALSCH anzeigen
         // Hilfe AN ODER AUS: jetzt final auswerten
         onAnswer?.({ ok: false });
     }
 
 */
    function handleCheck() {
        // vollständig ausgewählt?
        if (
            selPerson == null ||
            selNumber == null ||
            !selTense ||
            !selMood ||
            !selVoice
        ) return;

        const ok = isFullyCorrect();
        const user = currentSel();

        if (showHelp) {
            // HILFE AN:
            if (helpStage === 0 && !ok) {
                // 1. Fehlversuch → färben, aber NICHT abschließen
                setHelpStage(1);
                setFirstWrong(user);
                return;
            }
            // zweiter Klick ODER gleich richtig: jetzt final bewerten (richtig ODER falsch!)
            onAnswer(ok, { userAnswer: user, attempts: helpStage === 0 ? 1 : 2 });
            // reset lokale Hilfe-States für nächste Frage erst in Quiz nach "Weiter"
            return;
        } else {
            // HILFE AUS:
            if (helpStage === 0) {
                // einmal Farben zeigen, aber NICHT finalisieren
                setHelpStage(1);
                setFirstWrong(user);
                return;
            }
            // zweiter Klick finalisiert (richtig ODER falsch)
            onAnswer(ok, { userAnswer: user, attempts: 2 });
        }
    }


    //const canCheck = allChosen;

    // ---- render ---------------------------------------------------------------

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
                            {p}. Person
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
                            {n === "Sg" ? "Singular" : "Plural"}
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
