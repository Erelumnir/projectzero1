import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Function to load battleConfig.json file
function getBattleConfig() {
    const filePath = path.join(process.cwd(), 'battleConfig.json');  // Path to the JSON file
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
}

// GET method for fetching battle configurations by ID or returning a random battle if no ID is passed
export async function GET(request: Request) {
    const url = new URL(request.url);
    const battleID = url.searchParams.get('battleID');  // Extract the battleID from query params

    const battleConfig = getBattleConfig();

    if (battleID) {
        // Find the battle by ID
        const battle = battleConfig.find((b: any) => b.battleID === parseInt(battleID));
        if (battle) {
            return NextResponse.json(battle);
        } else {
            return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }
    } else {
        // Return a random battle if no battleID is specified
        const randomBattle = battleConfig[Math.floor(Math.random() * battleConfig.length)];
        return NextResponse.json(randomBattle);
    }
}
