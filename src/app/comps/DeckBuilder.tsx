'use client';

import { useEffect, useState } from 'react';
import { Card } from '../data/classes/Card';
import styles from '../style/deckbuilder.module.scss';

type PlayerCard = {
    cardId: number;
    quantityOwned: number;
};

type DeckBuilderProps = {
    onClose: () => void;
};

export default function DeckBuilder({ onClose }: DeckBuilderProps) {
    const [availableCards, setAvailableCards] = useState<Card[]>([]); // Store full card data
    const [playerCollection, setPlayerCollection] = useState<PlayerCard[]>([]); // Store player's card references
    const [activeDeck, setActiveDeck] = useState<{ card: Card; count: number }[]>([]);
    const [message, setMessage] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false); // Track if data is loaded

    // Fetch all cards in the game (as a reference)
    useEffect(() => {
        const fetchAllCards = async () => {
            try {
                const response = await fetch('/api/cards');
                const cards = await response.json();

                // Instantiate each card explicitly using the Card class constructor
                const cardInstances = cards.map(
                    (cardData: any) =>
                        new Card(
                            cardData.id,
                            cardData.name,
                            cardData.description,
                            cardData.cost,
                            cardData.attack,
                            cardData.hp,
                            cardData.armor,
                            cardData.frontImage,
                            cardData.backImage || null
                        )
                );

                setAvailableCards(cardInstances);
            } catch (error) {
                console.error('Error fetching cards:', error);
            }
        };

        fetchAllCards();
    }, []); // Only fetch the cards once when the component mounts

    // Fetch the player's collection
    useEffect(() => {
        const fetchPlayerCollection = async () => {
            try {
                const response = await fetch('/api/playerCollection');
                const collection = await response.json();
                setPlayerCollection(collection);
            } catch (error) {
                console.error('Error fetching player collection:', error);
            }
        };

        fetchPlayerCollection();
    }, []); // Only fetch the player's collection once

    // Fetch the player's deck from the server and update playerCollection accordingly
    useEffect(() => {
        const fetchPlayerDeck = async () => {
            if (availableCards.length === 0) return; // Wait until availableCards are loaded

            try {
                const response = await fetch('/api/playerDeck');
                const deckData = await response.json();

                const loadedDeck = deckData
                    .map((entry: { cardId: number; count: number }) => {
                        const card = availableCards.find((card) => card.id === entry.cardId);
                        return card ? { card, count: entry.count } : null;
                    })
                    .filter(Boolean); // Remove nulls for cards that might not exist anymore

                setActiveDeck(loadedDeck as { card: Card; count: number }[]);

                // Update playerCollection to reflect the cards already in the deck
                const updatedPlayerCollection = playerCollection.map((item) => {
                    const deckEntry = deckData.find((deckCard: any) => deckCard.cardId === item.cardId);
                    return deckEntry
                        ? { ...item, quantityOwned: Math.max(0, item.quantityOwned - deckEntry.count) }
                        : item;
                });

                setPlayerCollection(updatedPlayerCollection);

                setDataLoaded(true); // Mark data as fully loaded to avoid repeat requests
            } catch (error) {
                console.error('Error fetching player deck:', error);
            }
        };

        if (availableCards.length > 0 && !dataLoaded) {
            fetchPlayerDeck();
        }
    }, [availableCards, dataLoaded, playerCollection]); // Ensure playerCollection is updated after fetching deck

    const getPlayerOwnedCards = () => {
        return playerCollection
            .filter((ownedCard) => ownedCard.quantityOwned > 0) // Only include cards with quantityOwned > 0
            .map((ownedCard) => {
                const fullCard = availableCards.find((card) => card.id === ownedCard.cardId);
                return { card: fullCard!, quantityAvailable: ownedCard.quantityOwned };
            });
    };


    const addCardToDeck = (card: Card) => {
        const deckEntry = activeDeck.find((entry) => entry.card.id === card.id);
        const playerCard = playerCollection.find((item) => item.cardId === card.id);

        if (playerCard && playerCard.quantityOwned > (deckEntry?.count || 0)) {
            if (deckEntry) {
                setActiveDeck(
                    activeDeck.map((entry) =>
                        entry.card.id === card.id ? { ...entry, count: entry.count + 1 } : entry
                    )
                );
            } else {
                setActiveDeck([...activeDeck, { card, count: 1 }]);
            }

            setPlayerCollection(
                playerCollection.map((item) =>
                    item.cardId === card.id ? { ...item, quantityOwned: item.quantityOwned - 1 } : item
                )
            );
        } else {
            setMessage(`You don't have enough of this card.`);
        }
    };

    const removeCardFromDeck = (cardId: number) => {
        const deckEntry = activeDeck.find((entry) => entry.card.id === cardId);

        if (deckEntry) {
            if (deckEntry.count > 1) {
                setActiveDeck(
                    activeDeck.map((entry) =>
                        entry.card.id === cardId ? { ...entry, count: entry.count - 1 } : entry
                    )
                );
            } else {
                setActiveDeck(activeDeck.filter((entry) => entry.card.id !== cardId));
            }

            // Increase the quantity back in the playerCollection
            setPlayerCollection(
                playerCollection.map((item) =>
                    item.cardId === cardId ? { ...item, quantityOwned: item.quantityOwned + 1 } : item
                )
            );
        }
    };

    const saveDeck = async () => {
        const deckToSave = activeDeck.map((entry) => ({
            cardId: entry.card.id,
            count: entry.count,
        }));

        try {
            const response = await fetch('/api/playerDeck', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(deckToSave),
            });

            if (response.ok) {
                setMessage('Deck saved successfully!');
                onClose(); // Close the deck builder after saving
            } else {
                setMessage('Error saving the deck.');
            }
        } catch (error) {
            console.error('Error saving deck:', error);
        }
    };

    const ownedCards = getPlayerOwnedCards(); // Get the player's owned cards

    return (
        <div className={styles.deckbuilderContainer}>
            <h2>Deck Builder</h2>
            <div className={styles.availableCards}>
                <h3>Available Cards</h3>
                <div className={styles.cardsList}>
                    {ownedCards.map(({ card, quantityAvailable }) => (
                        card ? ( // Check if card is defined
                            <div key={card.id} className={styles.cardItem}>
                                <h4>{card.name}</h4>
                                <p>{card.description}</p>
                                <p>Available: {quantityAvailable}</p> {/* Show available amount */}
                                <img src={card.frontImage} alt={card.name} className={styles.cardImage} />
                                <button onClick={() => addCardToDeck(card)}>Add to Deck</button>
                            </div>
                        ) : null // If card is undefined, skip rendering
                    ))}
                </div>
            </div>

            <div className={styles.activeDeck}>
                <h3>Active Deck ({activeDeck.reduce((sum, entry) => sum + entry.count, 0)} cards)</h3>
                <div className={styles.deckList}>
                    {activeDeck.map((entry) => (
                        <div key={entry.card.id} className={styles.deckCardItem}>
                            <h4>{entry.card.name}</h4>
                            <p>Quantity: {entry.count}</p>
                            <img src={entry.card.frontImage} alt={entry.card.name} className={styles.cardImage} />
                            <button onClick={() => removeCardFromDeck(entry.card.id)}>Remove from Deck</button>
                        </div>
                    ))}
                </div>
            </div>

            {message && <p className={styles.message}>{message}</p>}

            <button onClick={saveDeck}>Save Deck</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
}
