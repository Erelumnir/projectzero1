import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'playerDeck.json');

// Helper function to read the player's deck from the JSON file
const readDeckFromFile = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(err);
        return [];
    }
};

// Helper function to write the player's deck to the JSON file
const writeDeckToFile = (deck: any) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(deck, null, 2), 'utf8');
    } catch (err) {
        console.error(err);
    }
};

// GET: Retrieve the player's deck
export async function GET() {
    const deck = readDeckFromFile();
    return NextResponse.json(deck);
}

// POST: Save the player's deck
export async function POST(request: Request) {
    const newDeck = await request.json();
    writeDeckToFile(newDeck);
    return NextResponse.json(newDeck);
}
