'use client';

import { useState } from 'react';
import styles from '../style/admin.module.scss';
import Link from 'next/link';

export default function AdminPage() {
    const [newCard, setNewCard] = useState({
        id: '',
        name: '',
        description: '',
        cost: '',
        attack: '',
        hp: '',
        armor: '',
        frontImage: '',
        backImage: '',
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Validate form inputs before sending the API request
    const validateInputs = () => {
        const { name, description, cost, attack, hp, frontImage } = newCard;

        if (!name || !description || !cost || !attack || !hp || !frontImage) {
            return 'All fields except Back Image are required';
        }

        if (isNaN(Number(cost)) || Number(cost) < 0) {
            return 'Cost must be a non-negative number';
        }
        if (isNaN(Number(attack)) || Number(attack) < 0) {
            return 'Attack must be a non-negative number';
        }
        if (isNaN(Number(hp)) || Number(hp) < 0) {
            return 'HP must be a non-negative number';
        }

        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCard({ ...newCard, [name]: value });
    };

    const addCard = async () => {
        // Reset message and error states
        setMessage('');
        setError('');

        // Validate the inputs
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCard),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Card added successfully!');
                setNewCard({
                    id: '',
                    name: '',
                    description: '',
                    cost: '',
                    attack: '',
                    hp: '',
                    armor: '',
                    frontImage: '',
                    backImage: '',
                });
            } else if (data.error) {
                setError(data.error);
            } else {
                setError('Failed to add card. Please try again.');
            }
        } catch (error) {
            console.error('Error adding card:', error);
            setMessage('Error occurred while adding card.');
        }
    };

    return (
        <div className={styles.adminContainer}>
            <h1 className={styles.adminTitle}>Add New Card</h1>
            <form
                className={styles.cardForm}
                onSubmit={(e) => {
                    e.preventDefault();
                    addCard();
                }}
            >
                <input
                    className={styles.adminInput}
                    type="text"
                    name="id"
                    placeholder="id"
                    value={newCard.id}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={newCard.name}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={newCard.description}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="number"
                    name="cost"
                    placeholder="Cost"
                    value={newCard.cost}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="number"
                    name="attack"
                    placeholder="Attack"
                    value={newCard.attack}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="number"
                    name="hp"
                    placeholder="HP"
                    value={newCard.hp}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="number"
                    name="armor"
                    placeholder="Armor"
                    value={newCard.armor}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="text"
                    name="frontImage"
                    placeholder="Front Image URL"
                    value={newCard.frontImage}
                    onChange={handleChange}
                    required
                />
                <input
                    className={styles.adminInput}
                    type="text"
                    name="backImage"
                    placeholder="Back Image URL (optional)"
                    value={newCard.backImage}
                    onChange={handleChange}
                />
                <button className={styles.adminButton} type="submit">Add Card</button>
            </form>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <Link href="/cards">View Card Database</Link>
        </div>
    );
}
