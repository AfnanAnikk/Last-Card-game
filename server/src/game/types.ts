export type Color = 'green' | 'red' | 'blue' | 'yellow' | 'black';
export type CardType = 'number' | 'reverse' | 'skip' | 'plus2' | 'plus4' | 'plus6' | 'plus10' | 'rainbow' | 'discardAll';

export interface Card {
  id: string;
  color: Color;
  type: CardType;
  value: string; // '0'-'9' or 'reverse', 'skip', 'plus2', etc.
  imagePath?: string;
}

export interface Player {
  socketId: string;
  nickname: string;
  hand: Card[];
  isHost: boolean;
  isConnected: boolean;
  hasCalledLastCard?: boolean;
  profilePic: string;
  drawnCard?: Card | null;
}

export interface RoomSettings {
  playWithStack: boolean;
  playWithPlus6Plus10: boolean;
}

export interface Room {
  roomCode: string;
  hostId: string;
  maxPlayers: number;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentTurnIndex: number;
  direction: 1 | -1;
  gameStarted: boolean;
  winner: string | null;
  currentColor: Color | null;
  pendingEffect: string | null;
  settings: RoomSettings;
  pendingDraws: number;
}

// Client representations (safe state)
export interface ClientPlayer {
  socketId: string;
  nickname: string;
  cardCount: number;
  isHost: boolean;
  isConnected: boolean;
  hasCalledLastCard?: boolean;
  profilePic: string;
  drawnCard?: Card | null;
}

export interface ClientRoomState {
  roomCode: string;
  hostId: string;
  maxPlayers: number;
  players: ClientPlayer[];
  discardPileTop: Card | null;
  currentTurnIndex: number;
  direction: 1 | -1;
  gameStarted: boolean;
  winner: string | null;
  currentColor: Color | null;
  settings: RoomSettings;
  pendingDraws: number;
}
