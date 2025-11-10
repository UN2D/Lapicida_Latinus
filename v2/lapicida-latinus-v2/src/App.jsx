import { useState } from "react";
import { StartScreen } from "./components/start/StartScreen";
import { Quiz } from "./components/quiz/Quiz";
import { buildRound } from "./core/roundFactory";

export default function App() {
  const [roundConfig, setRoundConfig] = useState(null);
  const [round, setRound] = useState(null);

  const handleStart = (config) => {
    const newRound = buildRound(config);
    setRoundConfig(config);
    setRound(newRound);
  };

  const handleFinish = () => {
    setRound(null);
    setRoundConfig(null);
  };

  // Kein aktives Quiz → Startscreen
  if (!round) {
    return (
      <div className="app">
        <StartScreen onStart={handleStart} />
      </div>
    );
  }

  // Aktives Quiz
  return (
    <div className="app">
      <Quiz round={round} onFinish={handleFinish} />
    </div>
  );
}
