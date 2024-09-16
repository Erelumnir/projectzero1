import React, { useState, useEffect } from 'react';
import { Card } from '../data/classes/Card'; // Import the Card class
import styles from '../style/combat.module.scss'; // Import the combat-specific styles

type CombatProps = {
    battleID: number | null; // Optional battleID for preset configurations
    onReturnToHub: () => void; // Function to return to the main hub after battle ends
};

// State for tracking the game
type AttackedThisTurn = { [key: string]: boolean }; // To track which cards attacked

// Define a new type that extends Card with an instanceId
type CardWithInstance = Card & { instanceId: string };

export default function Combat({ battleID, onReturnToHub }: CombatProps) {
    const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
    const [enemyDeck, setEnemyDeck] = useState<CardWithInstance[]>([]);
    const [playerHand, setPlayerHand] = useState<CardWithInstance[]>([]);
    const [playerActiveCards, setPlayerActiveCards] = useState<CardWithInstance[]>([]);
    const [selectedPlayerCard, setSelectedPlayerCard] = useState<CardWithInstance | null>(null);
    const [playerEnergy, setPlayerEnergy] = useState<number>(3);
    const [playerDeckState, setPlayerDeckState] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [enemyActiveCards, setEnemyActiveCards] = useState<CardWithInstance[]>([]);
    const [defeatedEnemyCards, setDefeatedEnemyCards] = useState<CardWithInstance[]>([]);
    const [phase, setPhase] = useState<'player' | 'enemy'>('player');
    const [isGameOver, setIsGameOver] = useState<'win' | 'loss' | null>(null);
    const [attackedThisTurn, setAttackedThisTurn] = useState<AttackedThisTurn>({});
    const [enemyDeckLoaded, setEnemyDeckLoaded] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null); // State to display messages to the user

    // Load playerDeck from local storage
    useEffect(() => {
        const savedDeck = localStorage.getItem('playerDeck');
        if (savedDeck) {
            const deckData = JSON.parse(savedDeck);
            fetch('/api/cards')
                .then((response) => response.json())
                .then((allCards) => {
                    const playerDeckData = allCards.filter((card: Card) =>
                        deckData.some((deckCard: any) => deckCard.cardId === card.id)
                    );
                    setPlayerDeck(playerDeckData);
                    setPlayerDeckState(playerDeckData);
                });
        }
    }, []);

    // Generate enemy deck based on battleID or random configuration (Max 6 cards)
    useEffect(() => {
        const fetchEnemyDeck = async (battleID: number | null) => {
            try {
                const cardsResponse = await fetch('/api/cards');
                if (!cardsResponse.ok) {
                    throw new Error('Failed to fetch cards');
                }
                const allCards = await cardsResponse.json();

                let presetEnemyDeck: Card[] = [];

                if (battleID !== null) {
                    const battleConfigResponse = await fetch(`/api/battleConfig?battleID=${battleID}`);
                    if (!battleConfigResponse.ok) {
                        throw new Error(`Error fetching battle config: ${battleConfigResponse.statusText}`);
                    }

                    const battleConfig = await battleConfigResponse.json();
                    console.log('Loaded Battle Config:', battleConfig); // Log for debugging
                    setMessage('Loaded Battle Config:'+ battleConfig);

                    if (!battleConfig.enemyDeck || !Array.isArray(battleConfig.enemyDeck)) {
                        throw new Error('Invalid battle configuration: enemyDeck is missing or not an array');
                    }

                    const enemyCards = battleConfig.enemyDeck;
                    presetEnemyDeck = allCards.filter((card: Card) => enemyCards.includes(card.id));
                    presetEnemyDeck = presetEnemyDeck.slice(0, 6); // Limit to 6 cards
                } else {
                    const randomEnemyDeck = Array.from({ length: Math.floor(Math.random() * 6) + 1 }, () => {
                        const randomCard = allCards
                            .filter((card: Card) => card.id >= 100)
                            .sort(() => 0.5 - Math.random())[0];
                        return randomCard;
                    });

                    presetEnemyDeck = randomEnemyDeck;
                    setMessage("Random enemy deck generated!");
                }

                console.log('Final Enemy Deck:', presetEnemyDeck); // Debugging

                setEnemyDeck(addUniqueIdToCards(presetEnemyDeck));
                setEnemyActiveCards(addUniqueIdToCards(presetEnemyDeck));
                setEnemyDeckLoaded(true);

            } catch (error) {
                console.error('Failed to fetch battle config:', error);
                setMessage('Failed to fetch battle configuration.');
            }
        };

        fetchEnemyDeck(battleID);
    }, [battleID]);

    const addUniqueIdToCards = (deck: Card[]): CardWithInstance[] => {
        return deck.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-${index}`, // Unique instance ID for each card
        }));
    };

    const checkForLossCondition = () => {
        // Ensure that the loss condition only checks when both hand and active cards are set
        const hasPlayableCard = canPlayAnyCard();
        const noActiveCards = playerActiveCards.length === 0;

        if (!hasPlayableCard && noActiveCards && playerHand.length > 0) {
            setIsGameOver('loss');
            setMessage("You lost the battle."); // Inform user
        }
    };

    // The canPlayAnyCard function checks if any card in hand can be played
    const canPlayAnyCard = () => {
        if (playerHand.length === 0) return false; // No cards in hand
        return playerHand.some((card) => card.cost <= playerEnergy); // Check if any card is playable
    };

    useEffect(() => {
        if (phase === 'player' && playerEnergy >= 0 && playerHand.length > 0 && !isGameOver) {
            checkForLossCondition();
        }
    }, [phase, playerEnergy, playerHand, playerActiveCards]);

    // Draw initial hand from player deck
    useEffect(() => {
        if (playerDeck.length > 0) {
            const startingHand = addUniqueIdToCards(playerDeck.slice(0, 8));
            setPlayerHand(startingHand);
            setPlayerDeckState(playerDeck.slice(8)); // Update deck after drawing
        }
    }, [playerDeck]);

    // Function to play a card from the hand
    const playCard = (card: CardWithInstance) => {
        if (playerEnergy >= card.cost) {
            setPlayerEnergy((prevEnergy) => prevEnergy - card.cost); // Deduct card cost from energy
            setPlayerActiveCards([...playerActiveCards, card]); // Add card to active cards
            setPlayerHand(playerHand.filter((c) => c.instanceId !== card.instanceId)); // Remove card from hand
            setMessage(`Played ${card.name}.`); // Inform user
        } else {
            setMessage("Not enough energy to play this card!"); // Inform user
        }
    };

    // Attack logic (limit card to attack only once per turn)
    const attackEnemyCard = (enemyCard: CardWithInstance) => {
        if (selectedPlayerCard && !attackedThisTurn[selectedPlayerCard.instanceId]) {
            enemyCard.hp -= selectedPlayerCard.attack;
            setMessage(`${selectedPlayerCard.name} attacks ${enemyCard.name}.`); // Inform user
            if (enemyCard.hp <= 0) {
                setEnemyActiveCards(enemyActiveCards.filter((c) => c.instanceId !== enemyCard.instanceId)); // Remove defeated card without replacement
                setDefeatedEnemyCards([...defeatedEnemyCards, enemyCard]); // Add defeated enemy to collection
                addPlayerVersionOfCard(enemyCard); // Add player version of defeated card to hand
            }
            setAttackedThisTurn({
                ...attackedThisTurn,
                [selectedPlayerCard.instanceId]: true, // Mark the card as having attacked
            });
            setSelectedPlayerCard(null); // Reset selected card
        } else {
            setMessage("This card has already attacked this turn!"); // Inform user
        }
    };

    // Style logic to highlight which player cards can attack
    const getPlayerCardBorderStyle = (playerCard: CardWithInstance) => {
        return !attackedThisTurn[playerCard.instanceId] ? styles.canAttack : styles.cannotAttack;
    };

    // Reset attack states and enemy turn logic
    const endPlayerTurn = () => {
        setPhase('enemy');
        setPlayerEnergy((prevEnergy) => prevEnergy + 2); // Regenerate energy at the end of turn
        setAttackedThisTurn({}); // Reset attack state for all cards
        setMessage("End of player turn. Enemy phase starts!"); // Inform user
    };


    const enemyPhase = () => {
        const updatedPlayerCards = [...playerActiveCards];
        enemyActiveCards.forEach((enemyCard) => {
            if (updatedPlayerCards.length > 0) {
                const firstPlayerCard = updatedPlayerCards[0]; // Always attack the first card (leftmost)
                firstPlayerCard.hp -= enemyCard.attack;
                setMessage(`${enemyCard.name} attacks ${firstPlayerCard.name}.`); // Inform user
                if (firstPlayerCard.hp <= 0) {
                    updatedPlayerCards.shift(); // Remove the defeated card
                }
            }
        });
        setPlayerActiveCards(updatedPlayerCards);
        setPhase('player'); // Return to player phase after enemy attacks
    };

    // Trigger enemy phase after the player ends their turn
    useEffect(() => {
        if (phase === 'enemy') {
            enemyPhase();
        }
    }, [phase]);

    // Check for win state (if no more enemy cards) - only if enemy deck is loaded
    useEffect(() => {
        if (enemyActiveCards.length === 0 && enemyDeckLoaded && !isGameOver) {
            setIsGameOver('win');
            setMessage("You won the battle!"); // Inform user
        }
    }, [enemyActiveCards, enemyDeckLoaded, isGameOver]);

    // Add the player version of a defeated card (e.g., cardID 102 -> cardID 2)
    const addPlayerVersionOfCard = (enemyCard: CardWithInstance) => {
        const playerVersionID = enemyCard.id - 100; // Assuming player version is 100 less than enemy version
        fetch('/api/cards')
            .then((response) => response.json())
            .then((allCards) => {
                const playerCard = allCards.find((card: Card) => card.id === playerVersionID);
                if (playerCard) {
                    setPlayerHand([...playerHand, { ...playerCard, instanceId: `${playerCard.id}-${Math.random()}` }]); // Add player version to hand with unique instanceId
                    setMessage(`${playerCard.name} added to your hand!`); // Inform user
                }
            });
    };

    // End the game and return to the hub
    const endGame = () => {
        onReturnToHub();
    };

    return (
        <div className={styles.combatContainer}>
            {message && <div className={styles.messageBox}>{message}</div>} {/* Display message to user */}
            {isGameOver === 'win' && (
                <div className={styles.gameOverMessage}>
                    <h2>You Won!</h2>
                    <button onClick={endGame}>Return to Hub</button>
                </div>
            )}

            {isGameOver === 'loss' && (
                <div className={styles.gameOverMessage}>
                    <h2>You Lost!</h2>
                    <button onClick={endGame}>Return to Hub</button>
                </div>
            )}

            {!isGameOver && (
                <>
                    <div className={styles.topSection}>
                        <div className={styles.enemyDeck}>
                            {enemyActiveCards.map((card) => (
                                <div key={card.instanceId} className={styles.cardItem} onClick={() => attackEnemyCard(card)}>
                                    <img src={card.frontImage} alt={card.name} />
                                    <h4>{card.name}</h4>
                                    <p>HP: {card.hp}</p>
                                    <p>Attack: {card.attack}</p>
                                </div>
                            ))}
                        </div>
                        <div className={styles.discardPile}>Discard Pile: {discardPile.length}</div>
                        <div className={styles.playerDeck}>Deck: {playerDeckState.length}</div>
                    </div>

                    <div className={styles.middleSection}>
                        <h3>Player Active Cards</h3>
                        <div className={styles.playerActiveCards}>
                            {playerActiveCards.map((card) => (
                                <div
                                    key={card.instanceId}
                                    className={`${styles.cardItem} ${getPlayerCardBorderStyle(card)}`} // Apply border to player cards
                                    onClick={() => setSelectedPlayerCard(card)}
                                >
                                    <img src={card.frontImage} alt={card.name} />
                                    <h4>{card.name}</h4>
                                    <p>HP: {card.hp}</p>
                                    <p>Attack: {card.attack}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.bottomSection}>
                        <h3>Player Hand (Energy: {playerEnergy})</h3>
                        <div className={styles.playerHand}>
                            {playerHand.map((card) => (
                                <div key={card.instanceId} className={styles.cardItem}>
                                    <img src={card.frontImage} alt={card.name} />
                                    <h4>{card.name}</h4>
                                    <p>Cost: {card.cost}</p>
                                    <button onClick={() => playCard(card)}>Play</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {phase === 'player' && (
                        <button onClick={endPlayerTurn}>End Turn</button>
                    )}
                </>
            )}
        </div>
    );
}
