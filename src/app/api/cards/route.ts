import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'cards.json');

// Helper function to read the cards from the JSON file
const readCardsFromFile = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading cards from file:', err);
        return [];
    }
};

// Helper function to write the cards to the JSON file
const writeCardsToFile = (cards: any) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(cards, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing cards to file:', err);
    }
};

// Validation function to check if the card has all required fields
const validateCardData = (card: any) => {
    const requiredFields = ['name', 'description', 'cost', 'attack', 'hp', 'frontImage'];
    for (const field of requiredFields) {
        if (!card[field]) {
            return `Missing required field: ${field}`;
        }
    }

    // Check if the numeric values are valid
    if (isNaN(card.cost) || card.cost < 0) {
        return 'Invalid value for cost';
    }
    if (isNaN(card.attack) || card.attack < 0) {
        return 'Invalid value for attack';
    }
    if (isNaN(card.hp) || card.hp < 0) {
        return 'Invalid value for hp';
    }

    return null;
};

// GET: Retrieve all cards
export async function GET() {
    try {
        const cards = readCardsFromFile();
        return NextResponse.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        return NextResponse.json({ error: 'Unable to fetch cards.' }, { status: 500 });
    }
}

// POST: Add a new card
export async function POST(request: Request) {
    try {
        const newCard = await request.json();

        // Validate the card data
        const validationError = validateCardData(newCard);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        // Read existing cards
        const cards = readCardsFromFile();

        // Check if the name already exists
        if (cards.some((card: any) => card.name === newCard.name)) {
            return NextResponse.json({ error: 'Card with this name already exists.' }, { status: 400 });
        }

        // Add a new ID and push the new card
        newCard.id = cards.length ? cards[cards.length - 1].id + 1 : 1;
        cards.push(newCard);

        // Write the updated cards array to the file
        writeCardsToFile(cards);

        return NextResponse.json(cards);
    } catch (error) {
        console.error('Error adding card:', error);
        return NextResponse.json({ error: 'Unable to add card.' }, { status: 500 });
    }
}
