// src/App.jsx

import { useState } from "react";
import { buildRound } from "./core/roundFactory";
import { StartScreen } from "./components/StartScreen";
import { Quiz } from "./components/Quiz";

/**
 * App:
 * - zeigt entweder StartScreen oder Quiz
 * - hält die aktuelle Runde
 */

export default function App() {
  const [round, setRound] = useState(null);

  const handleStart = (config) => {
    const newRound = buildRound(config);
    if (!newRound || !newRound.questions || newRound.questions.length === 0) {
      // Falls keine Fragen erzeugt wurden -> nicht in Quiz springen
      console.warn("Keine Fragen für diese Auswahl gefunden.", newRound);
      setRound(null);
      return;
    }
    setRound(newRound);
  };

  const handleExit = () => {
    setRound(null);
  };

  if (!round) {
    return <StartScreen onStart={handleStart} />;
  }

  return <Quiz round={round} onExit={handleExit} />;
}
