'use client'

import { useState } from 'react';
import styles from "./style/main.module.scss"
import DeckBuilder from './comps/DeckBuilder';
import Combat from './comps/Combat';

export default function Home() {
  const [isDeckBuilderOpen, setDeckBuilderOpen] = useState(false);
  const [startBattle, setStartBattle] = useState<boolean>(false);
  const [battleID, setBattleID] = useState<number | null>(1); // Start with the first battle ID

  const maxBattleID = 4; // Define your max limit for predefined battles (e.g., battleID 1, 2, 3)

  const handleOpenDeckBuilder = () => {
    setDeckBuilderOpen(true);
  };

  const handleCloseDeckBuilder = () => {
    setDeckBuilderOpen(false);
  };

  // Start a new battle and cycle through battle IDs
  const startNewBattle = () => {
    if (battleID === null) {
      setBattleID(1); // Reset to the first battle ID if it's currently null
    } else if (battleID < maxBattleID) {
      setBattleID(battleID + 1); // Increment battle ID if under the max limit
    } else {
      setBattleID(null); // Switch to random generation after max limit
    }
    setStartBattle(true); // Start the combat component
  };

  // Function to return to the main hub after a battle ends
  const handleReturnToHub = () => {
    setStartBattle(false); // Reset the battle state to show the hub
  };

  return (
    <main className={styles.main}>
      {startBattle ? (
        <Combat battleID={battleID} onReturnToHub={handleReturnToHub} />
      ) : (
        <div>
          <button onClick={handleOpenDeckBuilder}>Open Deck Builder</button>
          <button onClick={startNewBattle}>
            {battleID !== null ? `Start Battle ${battleID}` : 'Start Random Battle'}
          </button>

          {isDeckBuilderOpen && (
            <DeckBuilder onClose={handleCloseDeckBuilder} />
          )}
          <br />
        </div>
      )}
    </main>
  );
}
