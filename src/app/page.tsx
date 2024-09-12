// /admin for card management
'use client'

import { useState } from 'react';
import styles from "./style/main.module.scss"
import DeckBuilder from './comps/DeckBuilder';

export default function Home() {
  const [isDeckBuilderOpen, setDeckBuilderOpen] = useState(false);

  const handleOpenDeckBuilder = () => {
    setDeckBuilderOpen(true);
  };

  const handleCloseDeckBuilder = () => {
    setDeckBuilderOpen(false);
  };

  return (
    <main className={styles.main}>
      <button onClick={handleOpenDeckBuilder}>Open Deck Builder</button>

      {isDeckBuilderOpen && (
        <DeckBuilder onClose={handleCloseDeckBuilder} />
      )}
      <br/>
    </main>
  );
}
