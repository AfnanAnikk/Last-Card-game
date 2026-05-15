import { Server, Socket } from 'socket.io';
import { Room, Player, ClientRoomState, ClientPlayer, RoomSettings } from './types';
import { generateDeck } from './deck';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public createRoom(socket: Socket, nickname: string, profilePic: string, playerId: string, maxPlayers: number, settings?: RoomSettings) {
    const roomCode = this.generateRoomCode();
    
    const host: Player = {
      socketId: socket.id,
      nickname,
      profilePic,
      playerId,
      hand: [],
      isHost: true,
      isConnected: true,
    };

    const newRoom: Room = {
      roomCode,
      hostId: socket.id,
      maxPlayers,
      players: [host],
      deck: [],
      discardPile: [],
      currentTurnIndex: 0,
      direction: 1,
      gameStarted: false,
      winner: null,
      currentColor: null,
      pendingEffect: null,
      settings: settings || { playWithStack: true, playWithPlus6Plus10: false, playWith07Swap: false },
      pendingDraws: 0,
      pendingChallenge: null,
      pendingSwap7: null
    };

    this.rooms.set(roomCode, newRoom);
    socket.join(roomCode);

    socket.emit('roomCreated', { roomCode, maxPlayers });
    this.broadcastGameState(roomCode);
  }

  public joinRoom(socket: Socket, nickname: string, profilePic: string, playerId: string, roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());

    if (!room) {
      socket.emit('errorMessage', 'Room does not exist');
      return;
    }

    if (room.gameStarted) {
      socket.emit('errorMessage', 'Game already started');
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('errorMessage', 'Room is full');
      return;
    }

    const existingPlayer = room.players.find(p => p.playerId === playerId);
    if (existingPlayer && !existingPlayer.isConnected) {
      existingPlayer.socketId = socket.id;
      existingPlayer.isConnected = true;
      existingPlayer.profilePic = profilePic;
      if (existingPlayer.isHost) {
        room.hostId = socket.id;
      }
      socket.join(roomCode);
      socket.emit('roomJoined', { roomCode });
      this.broadcastGameState(roomCode);
      return;
    }

    const player: Player = {
      socketId: socket.id,
      nickname,
      profilePic,
      playerId,
      hand: [],
      isHost: false,
      isConnected: true,
    };

    room.players.push(player);
    socket.join(roomCode);
    
    socket.emit('roomJoined', { roomCode });
    this.io.to(roomCode).emit('playerJoined', { nickname });
    this.broadcastGameState(roomCode);
  }

  public startGame(socket: Socket, roomCode: string) {
    console.log(`[ROOM_MANAGER] Executing startGame for room: ${roomCode}, by socket: ${socket.id}`);
    try {
      const room = this.rooms.get(roomCode.toUpperCase());
      if (!room) {
        console.log(`[ROOM_MANAGER] Error: Room ${roomCode} not found!`);
        return;
      }

      console.log(`[ROOM_MANAGER] Room found. Host is ${room.hostId}. Current socket is ${socket.id}`);
      if (room.hostId !== socket.id) {
        console.log(`[ROOM_MANAGER] Error: Socket ${socket.id} is not the host!`);
        socket.emit('errorMessage', 'Only the host can start the game');
        return;
      }

      console.log(`[ROOM_MANAGER] Player count: ${room.players.length}`);
      if (room.players.length < 2) {
        console.log(`[ROOM_MANAGER] Error: Not enough players.`);
        socket.emit('errorMessage', 'Need at least 2 players to start');
        return;
      }

      console.log(`[ROOM_MANAGER] All checks passed. Generating deck...`);

      room.gameStarted = true;
      room.deck = generateDeck(room.settings);
      
      room.players.forEach(player => {
        player.hand = room.deck.splice(0, 7);
        player.hasCalledLastCard = false;
        player.drawnCard = null;
      });

      let firstCard = room.deck.pop();
      while (firstCard && (firstCard.type !== 'number' || firstCard.color === 'black')) {
        room.deck.unshift(firstCard);
        firstCard = room.deck.pop();
      }
      
      if (firstCard) {
        room.discardPile.push(firstCard);
        room.currentColor = firstCard.color;
        console.log(`[ROOM_MANAGER] First card placed: ${firstCard.color} ${firstCard.value}`);
      }

      console.log(`[ROOM_MANAGER] Emitting gameStarted and broadcasting state to clients...`);
      this.io.to(room.roomCode).emit('gameStarted');
      this.broadcastGameState(room.roomCode);
      console.log(`[ROOM_MANAGER] Start game execution complete!`);
    } catch (error: any) {
      console.error("START GAME ERROR:", error);
      socket.emit('errorMessage', `Failed to start game: ${error.message}`);
    }
  }

  public updateSettings(socket: Socket, roomCode: string, settings: RoomSettings) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.gameStarted) return;

    if (room.hostId === socket.id) {
      room.settings = settings;
      this.broadcastGameState(room.roomCode);
    }
  }

  public handleDisconnect(socket: Socket) {
    for (const [roomCode, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.isConnected = false;
        
        if (!room.gameStarted) {
          room.players = room.players.filter(p => p.socketId !== socket.id);
          this.io.to(roomCode).emit('playerLeft', { nickname: player.nickname });
          
          if (room.players.length === 0) {
            this.rooms.delete(roomCode);
          } else if (player.isHost) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].socketId;
          }
          this.broadcastGameState(roomCode);
        } else {
          this.broadcastGameState(roomCode);
          this.io.to(roomCode).emit('gameMessage', `${player.nickname} disconnected`);
        }
      }
    }
  }



  private broadcastGameState(roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return;

    room.players.forEach(player => {
      const state = this.getClientStateForPlayer(room, player);
      this.io.to(player.socketId).emit('gameStateUpdated', state);
    });
  }

  private getClientStateForPlayer(room: Room, player: Player): any {
    const clientRoomState: ClientRoomState = {
      roomCode: room.roomCode,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      players: room.players.map(p => ({
        socketId: p.socketId,
        nickname: p.nickname,
        profilePic: p.profilePic,
        cardCount: p.hand.length,
        isHost: p.isHost,
        isConnected: p.isConnected,
        hasCalledLastCard: p.hasCalledLastCard,
        drawnCard: p.socketId === player.socketId ? p.drawnCard : null
      })),
      discardPileTop: room.discardPile.length > 0 ? room.discardPile[room.discardPile.length - 1] : null,
      previousDiscardPileTop: room.discardPile.length > 1 ? room.discardPile[room.discardPile.length - 2] : null,
      currentTurnIndex: room.currentTurnIndex,
      direction: room.direction,
      gameStarted: room.gameStarted,
      winner: room.winner,
      currentColor: room.currentColor,
      settings: room.settings,
      pendingDraws: room.pendingDraws,
      pendingChallenge: room.pendingChallenge,
      pendingSwap7: room.pendingSwap7
    };

    return {
      room: clientRoomState,
      hand: player.hand
    };
  }

  private drawCardsToPlayer(room: Room, player: Player, amount: number) {
    for (let i = 0; i < amount; i++) {
      if (room.deck.length === 0) {
        if (room.discardPile.length > 1) {
          const topCard = room.discardPile.pop()!;
          room.deck = [...room.discardPile].sort(() => Math.random() - 0.5);
          room.discardPile = [topCard];
        } else {
          break;
        }
      }
      const card = room.deck.pop();
      if (card) player.hand.push(card);
    }
  }

  public drawCard(socket: Socket, roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted || room.winner) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== room.currentTurnIndex) {
      socket.emit('invalidMove', 'Not your turn');
      return;
    }

    if (room.pendingDraws > 0) {
      socket.emit('invalidMove', 'You must accept the penalty draws or stack a plus card');
      return;
    }

    const player = room.players[playerIndex];
    if (player.drawnCard) {
      socket.emit('invalidMove', 'You already drew a card. Please decide to Keep or Play it.');
      return;
    }

    if (room.deck.length === 0) {
      if (room.discardPile.length > 1) {
        const topCard = room.discardPile.pop()!;
        room.deck = [...room.discardPile].sort(() => Math.random() - 0.5);
        room.discardPile = [topCard];
      } else {
        socket.emit('errorMessage', 'No more cards to draw');
        return;
      }
    }

    const drawnCard = room.deck.pop();
    if (drawnCard) {
      player.drawnCard = drawnCard;
      this.io.to(player.socketId).emit('drawnCardPopup', drawnCard);
      this.io.to(roomCode).emit('gameMessage', `${player.nickname} drew a card and is deciding...`);
      this.broadcastGameState(roomCode);
    }
  }

  public keepDrawnCard(socket: Socket, roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted || room.winner) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== room.currentTurnIndex) return;

    const player = room.players[playerIndex];
    if (!player.drawnCard) return;

    player.hand.push(player.drawnCard);
    player.drawnCard = null;

    this.io.to(roomCode).emit('gameMessage', `${player.nickname} kept the card`);
    this.advanceTurn(room);
    this.broadcastGameState(roomCode);
  }

  public playCard(socket: Socket, roomCode: string, cardId: string, chosenColor?: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted || room.winner) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== room.currentTurnIndex) return;

    const player = room.players[playerIndex];
    
    let card = player.hand.find(c => c.id === cardId);
    let isFromDrawnCard = false;

    if (!card && player.drawnCard?.id === cardId) {
      card = player.drawnCard;
      isFromDrawnCard = true;
    }

    if (!card) {
      socket.emit('invalidMove', 'Card not in hand');
      return;
    }

    const topCard = room.discardPile[room.discardPile.length - 1];

    const isColorMatch = card.color === room.currentColor;
    const isValueMatch = card.value === topCard.value;
    const isSpecial = card.color === 'black';

    if (!isColorMatch && !isValueMatch && !isSpecial) {
      socket.emit('invalidMove', 'Card cannot be played');
      return;
    }

    // Play the card
    if (isFromDrawnCard) {
      player.drawnCard = null;
    } else {
      player.hand = player.hand.filter(c => c.id !== cardId);
    }
    
    room.discardPile.push(card);
    player.hasCalledLastCard = false;

    // Discard All (Stack) rule
    if (card.type === 'discardAll') {
      const matchingColorCards = player.hand.filter(c => c.color === card.color);
      if (matchingColorCards.length > 0) {
        player.hand = player.hand.filter(c => c.color !== card.color);
        room.discardPile.push(...matchingColorCards);
        this.io.to(roomCode).emit('gameMessage', `${player.nickname} discarded all their ${card.color} cards!`);
      }
    }

    // Set Colors
    const previousColor = room.currentColor;
    if (isSpecial && chosenColor && ['red', 'blue', 'green', 'yellow'].includes(chosenColor)) {
      room.currentColor = chosenColor as any;
      this.io.to(roomCode).emit('gameMessage', `${player.nickname} played ${card.type} and changed color to ${chosenColor}`);
    } else {
      room.currentColor = card.color;
      this.io.to(roomCode).emit('gameMessage', `${player.nickname} played a card`);
    }

    // Check Win
    if (player.hand.length === 0 && !player.drawnCard) {
      room.winner = player.socketId;
      this.io.to(roomCode).emit('gameOver', { winner: player.nickname });
      this.broadcastGameState(roomCode);
      return;
    }

    // Special Action Resolution
    let skipNext = false;
    let turnAdvancedByPlus = false;

    if (card.type === 'reverse') {
      room.direction = (room.direction * -1) as (1 | -1);
      if (room.players.length === 2) {
        skipNext = true; // Reverse in 2-player acts as skip
      }
    } else if (card.type === 'skip') {
      skipNext = true;
    } else if (card.type.startsWith('plus')) {
      const amountStr = card.type.replace('plus', '');
      const drawAmount = parseInt(amountStr);
      if (!isNaN(drawAmount)) {
        if (room.pendingDraws === 0 && ['plus4', 'plus6', 'plus10'].includes(card.type)) {
          room.pendingChallenge = {
            playerWhoPlayedId: player.socketId,
            previousColor: previousColor
          };
        } else if (['plus4', 'plus6', 'plus10'].includes(card.type)) {
          room.pendingChallenge = null;
        } else if (card.type === 'plus2') {
          room.pendingChallenge = null;
        }
        
        room.pendingDraws += drawAmount;
        turnAdvancedByPlus = true;
      }
    }

    if (room.settings.playWith07Swap) {
      if (card.value === '0') {
        // Shift hands in the current direction
        const hands = room.players.map(p => [...p.hand]);
        for (let i = 0; i < room.players.length; i++) {
          const giverIndex = (i - room.direction + room.players.length) % room.players.length;
          room.players[i].hand = hands[giverIndex];
        }
        this.io.to(roomCode).emit('gameMessage', `${player.nickname} played a 0! Everyone's hands were shifted.`);
      } else if (card.value === '7') {
        room.pendingSwap7 = player.socketId;
        this.io.to(roomCode).emit('gameMessage', `${player.nickname} played a 7 and gets to swap hands!`);
        this.broadcastGameState(roomCode);
        return; // Pause turn advancement until they choose
      }
    }

    this.advanceTurn(room);
    if (skipNext && !turnAdvancedByPlus) {
      this.advanceTurn(room);
    }

    this.broadcastGameState(roomCode);
  }

  public callLastCard(socket: Socket, roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (player.hand.length <= 2) {
      player.hasCalledLastCard = true;
      this.io.to(roomCode).emit('gameMessage', `${player.nickname} called LAST CARD!`);
      this.broadcastGameState(roomCode);
    }
  }

  public catchLastCard(socket: Socket, roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted) return;

    const catcher = room.players.find(p => p.socketId === socket.id);
    if (!catcher) return;

    const vulnerablePlayer = room.players.find(p => p.hand.length === 1 && !p.hasCalledLastCard);
    
    if (vulnerablePlayer) {
      this.drawCardsToPlayer(room, vulnerablePlayer, 2);
      this.io.to(roomCode).emit('gameMessage', `${catcher.nickname} caught ${vulnerablePlayer.nickname}! Penalty: +2 cards`);
      this.broadcastGameState(roomCode);
    }
  }

  public acceptDraws(socket: Socket, roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted || room.winner) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== room.currentTurnIndex) return;

    if (room.pendingDraws > 0) {
      const player = room.players[playerIndex];
      this.drawCardsToPlayer(room, player, room.pendingDraws);
      this.io.to(roomCode).emit('gameMessage', `${player.nickname} accepted and drew ${room.pendingDraws} cards.`);
      room.pendingDraws = 0;
      room.pendingChallenge = null;
      this.advanceTurn(room);
      this.broadcastGameState(roomCode);
    }
  }

  public challengeDraws(socket: Socket, roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted || room.winner) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== room.currentTurnIndex) return;

    const challenger = room.players[playerIndex];
    const challenge = room.pendingChallenge;
    
    if (!challenge || room.pendingDraws === 0) {
      socket.emit('invalidMove', 'Nothing to challenge');
      return;
    }

    const playerWhoPlayed = room.players.find(p => p.socketId === challenge.playerWhoPlayedId);
    if (!playerWhoPlayed) return;

    const hasPreviousColor = playerWhoPlayed.hand.some(c => c.color === challenge.previousColor);

    if (hasPreviousColor) {
      // Challenger Wins! Player who played the card takes the penalty
      this.drawCardsToPlayer(room, playerWhoPlayed, room.pendingDraws);
      this.io.to(roomCode).emit('gameMessage', `${challenger.nickname} won the challenge! ${playerWhoPlayed.nickname} drew ${room.pendingDraws} cards.`);
      room.pendingDraws = 0;
      room.pendingChallenge = null;
      // Challenger doesn't draw, they can now play a card because their turn does not advance
    } else {
      // Challenger Loses! Challenger takes pendingDraws + 2
      const penaltyDraws = room.pendingDraws + 2;
      this.drawCardsToPlayer(room, challenger, penaltyDraws);
      this.io.to(roomCode).emit('gameMessage', `${challenger.nickname} lost the challenge! They drew ${penaltyDraws} cards.`);
      room.pendingDraws = 0;
      room.pendingChallenge = null;
      this.advanceTurn(room);
    }
    
    this.broadcastGameState(roomCode);
  }

  private checkAutoDraw(room: Room) {
    if (room.pendingDraws > 0) {
      const currentPlayer = room.players[room.currentTurnIndex];
      
      // Does the player have a counter + card?
      const hasCounter = currentPlayer.hand.some(card => card.type.startsWith('plus'));
      
      // Do they have a challenge?
      const hasChallenge = room.pendingChallenge != null;

      if (!hasCounter && !hasChallenge) {
        // Force draw and skip
        this.drawCardsToPlayer(room, currentPlayer, room.pendingDraws);
        this.io.to(room.roomCode).emit('gameMessage', `${currentPlayer.nickname} had no counter and was forced to draw ${room.pendingDraws} cards!`);
        room.pendingDraws = 0;
        room.pendingChallenge = null;
        this.advanceTurn(room);
      }
    }
  }

  private advanceTurn(room: Room) {
    room.currentTurnIndex = (room.currentTurnIndex + room.direction + room.players.length) % room.players.length;
    this.checkAutoDraw(room);
  }

  public swapHands(socket: Socket, roomCode: string, targetSocketId: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.gameStarted || room.winner) return;

    if (room.pendingSwap7 !== socket.id) return;

    const player = room.players.find(p => p.socketId === socket.id);
    const target = room.players.find(p => p.socketId === targetSocketId);

    if (player && target) {
      const temp = [...player.hand];
      player.hand = [...target.hand];
      target.hand = temp;

      this.io.to(roomCode).emit('gameMessage', `${player.nickname} swapped hands with ${target.nickname}!`);
      
      room.pendingSwap7 = null;
      this.advanceTurn(room);
      this.broadcastGameState(roomCode);
    }
  }
}
