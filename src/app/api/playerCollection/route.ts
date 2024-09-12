import { NextResponse } from 'next/server';

// Example of the player's card collection (stored server-side)
let playerCollection = [
    { cardId: 1, quantityOwned: 1 },
];

// GET: Return the player's collection
export async function GET() {
    return NextResponse.json(playerCollection);
}

// POST: Update the player's collection (add or modify card quantities)
export async function POST(request: Request) {
    const newCardData = await request.json(); // Expecting an object like { cardId: number, quantityOwned: number }
    const { cardId, quantityOwned } = newCardData;

    // Check if the card already exists in the player's collection
    const existingCard = playerCollection.find((card) => card.cardId === cardId);

    if (existingCard) {
        // If the card already exists, update the quantity
        existingCard.quantityOwned += quantityOwned;
    } else {
        // If the card doesn't exist, add a new entry
        playerCollection.push({ cardId, quantityOwned });
    }

    return NextResponse.json(playerCollection); // Return the updated collection
}
