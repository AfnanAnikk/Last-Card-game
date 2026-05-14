import { Card, Color, RoomSettings } from './types';
import { v4 as uuidv4 } from 'uuid';

export const COLORS: Color[] = ['green', 'red', 'blue', 'yellow'];
export const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function generateDeck(settings: RoomSettings): Card[] {
  const deck: Card[] = [];

  // Colors: Numbers, Action Cards
  COLORS.forEach(color => {
    // Numbers 0-9
    NUMBERS.forEach(num => {
      deck.push({ id: uuidv4(), color, type: 'number', value: num, imagePath: `card${num}${color}.png` });
      if (num !== '0') {
        deck.push({ id: uuidv4(), color, type: 'number', value: num, imagePath: `card${num}${color}.png` });
      }
    });

    // Action cards (2 of each per color)
    for (let i = 0; i < 2; i++) {
      deck.push({ id: uuidv4(), color, type: 'skip', value: 'skip', imagePath: `${color.charAt(0)}skip.png` });
      deck.push({ id: uuidv4(), color, type: 'reverse', value: 'reverse', imagePath: `${color.charAt(0)}rev.png` });
      deck.push({ id: uuidv4(), color, type: 'plus2', value: 'plus2', imagePath: `${color.charAt(0)}plus2.png` });
      
      // Discard All cards
      if (settings.playWithStack) {
        deck.push({ id: uuidv4(), color, type: 'discardAll', value: 'discardAll', imagePath: `${color.charAt(0)}stack.png` });
      }
    }
  });

  // Black / Special Cards
  // 4 Rainbows, 4 +4s
  for (let i = 0; i < 4; i++) {
    deck.push({ id: uuidv4(), color: 'black', type: 'rainbow', value: 'rainbow', imagePath: 'rainbow.png' });
    deck.push({ id: uuidv4(), color: 'black', type: 'plus4', value: 'plus4', imagePath: 'plus4.png' });
  }

  // Optional Extreme Draw cards
  if (settings.playWithPlus6Plus10) {
    for (let i = 0; i < 2; i++) {
      deck.push({ id: uuidv4(), color: 'black', type: 'plus6', value: 'plus6', imagePath: 'plus6.png' });
    }
    for (let i = 0; i < 1; i++) {
      deck.push({ id: uuidv4(), color: 'black', type: 'plus10', value: 'plus10', imagePath: 'plus10.png' });
    }
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}
