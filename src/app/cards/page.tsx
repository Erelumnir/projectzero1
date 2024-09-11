'use client';

import { useEffect, useState } from 'react';
import styles from '../style/cards.module.scss';
import Link from 'next/link';

export default function CardsPage() {
    const [cards, setCards] = useState([]);
    const [error, setError] = useState('');

    const fetchCards = async () => {
        setError('');
        try {
            const response = await fetch('/api/cards');

            if (!response.ok) {
                throw new Error('Failed to fetch cards. Please try again later.');
            }

            const data = await response.json();
            setCards(data);
        } catch (error) {
            // Handle error properly when it's of type unknown
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unknown error occurred.');
            }
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    return (
        <div className={styles.cardsContainer}>
            <h1 className={styles.cardsTitle}>All Cards</h1>
            <div className={styles.cardsGrid}>
                {cards.length > 0 ? (
                    cards.map((card: any) => (
                        <div className={styles.cardItem} key={card.id}>
                            <div className={styles.cardInfo}>
                                <h3>{card.name}</h3>
                                <p>{card.description}</p>
                                <p>Cost: {card.cost}</p>
                                <p>Attack: {card.attack}</p>
                                <p>HP: {card.hp} ({card.armor}) </p>
                            </div>
                            <img
                                src={card.frontImage}
                                alt={`${card.name} front`}
                                className={styles.cardImage}
                            />
                            {card.backImage && (
                                <img
                                    src={card.backImage}
                                    alt={`${card.name} back`}
                                    className={styles.cardImage}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <p>No cards found.</p>
                )}
            </div>
            <Link href="/admin">Add Cards</Link>
        </div>
    );
}
