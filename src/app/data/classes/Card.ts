// Card.ts
export class Card {
    id: number;
    name: string;
    description: string;
    cost: number;
    attack: number;
    hp: number;
    armor: number;
    frontImage: string;
    backImage?: string | null; 

    constructor(
        id: number,
        name: string,
        description: string,
        cost: number,
        attack: number,
        hp: number,
        armor: number,
        frontImage: string,
        backImage: string | null = null
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.cost = cost;
        this.attack = attack;
        this.hp = hp;
        this.armor = armor;
        this.frontImage = frontImage;
        this.backImage = backImage;
    }
}
