/**
 * Enhanced Multiplayer Manager
 * Handles real-time multiplayer functionality including WebSocket connections,
 * room management, tournament system, and spectator mode
 */

class MultiplayerManager {
  constructor() {
    this.socket = null;
    this.playerInfo = null;
    this.currentRoom = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.connectionAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isMockMode = false;
    this.mockRooms = [];
    
    // Initialize from localStorage
    this.loadPlayerProfile();
  }

  // Player Profile Management
  loadPlayerProfile() {
    const saved = localStorage.getItem('multiplayerProfile');
    if (saved) {
      this.playerInfo = JSON.parse(saved);
    } else {
      this.playerInfo = this.createDefaultProfile();
      this.savePlayerProfile();
    }
  }

  createDefaultProfile() {
    return {
      id: this.generatePlayerId(),
      username: `Player${Math.floor(Math.random() * 10000)}`,
      avatar: '🎮',
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        tournamentsWon: 0,
        totalScore: 0,
        rank: 'Beginner',
        level: 1,
        experience: 0
      },
      achievements: [],
      friends: [],
      preferences: {
        autoMatch: true,
        voiceChat: false,
        notifications: true
      }
    };
  }

  generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  savePlayerProfile() {
    localStorage.setItem('multiplayerProfile', JSON.stringify(this.playerInfo));
  }

  updatePlayerStats(gameResult) {
    this.playerInfo.stats.gamesPlayed++;
    if (gameResult.won) {
      this.playerInfo.stats.gamesWon++;
    }
    this.playerInfo.stats.totalScore += gameResult.score || 0;
    
    // Update experience and level
    this.playerInfo.stats.experience += gameResult.experience || 0;
    this.updatePlayerLevel();
    
    this.savePlayerProfile();
  }

  updatePlayerLevel() {
    const exp = this.playerInfo.stats.experience;
    const newLevel = Math.floor(exp / 100) + 1;
    if (newLevel > this.playerInfo.stats.level) {
      this.playerInfo.stats.level = newLevel;
      this.emit('levelUp', { level: newLevel });
    }
  }

  // WebSocket Connection Management
  connect(serverUrl = 'ws://localhost:8080') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('Already connected to multiplayer server');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(serverUrl);
        
        this.socket.onopen = () => {
          console.log('Connected to multiplayer server');
          this.isConnected = true;
          this.connectionAttempts = 0;
          this.authenticate();
          this.emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('Disconnected from multiplayer server');
          this.isConnected = false;
          this.emit('disconnected');
          this.handleReconnection();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentRoom = null;
    this.isMockMode = false;
  }

  handleReconnection() {
    if (this.connectionAttempts < this.maxReconnectAttempts) {
      this.connectionAttempts++;
      console.log(`Reconnection attempt ${this.connectionAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect().catch(() => {
          console.log('Reconnection failed');
        });
      }, this.reconnectDelay * this.connectionAttempts);
    }
  }

  authenticate() {
    this.sendMessage({
      type: 'authenticate',
      playerInfo: this.playerInfo
    });
  }

  // Message Handling
  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: not connected to server');
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'authenticated':
        this.handleAuthenticated(message);
        break;
      case 'roomJoined':
        this.handleRoomJoined(message);
        break;
      case 'roomLeft':
        this.handleRoomLeft(message);
        break;
      case 'playerJoined':
        this.handlePlayerJoined(message);
        break;
      case 'playerLeft':
        this.handlePlayerLeft(message);
        break;
      case 'gameStarted':
        this.handleGameStarted(message);
        break;
      case 'gameState':
        this.handleGameState(message);
        break;
      case 'playerMove':
        this.handlePlayerMove(message);
        break;
      case 'gameEnded':
        this.handleGameEnded(message);
        break;
      case 'tournamentUpdate':
        this.handleTournamentUpdate(message);
        break;
      case 'spectatorUpdate':
        this.handleSpectatorUpdate(message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  // Room Management
  createRoom(roomConfig) {
    if (this.isMockMode) {
      const room = {
        id: `room_${Date.now()}`,
        name: roomConfig.name || `${this.playerInfo.username}'s Room`,
        maxPlayers: Number(roomConfig.maxPlayers) || 4,
        currentPlayers: 1,
        gameMode: roomConfig.gameMode || 'classic',
        difficulty: roomConfig.difficulty || 2,
        theme: roomConfig.theme || 'fruits',
        isPrivate: Boolean(roomConfig.isPrivate),
        allowSpectators: roomConfig.allowSpectators !== false,
        players: [this.playerInfo]
      };
      this.mockRooms.push(room);
      this.currentRoom = room;
      this.emit('roomList', [...this.mockRooms]);
      this.emit('roomJoined', room);
      return;
    }

    this.sendMessage({
      type: 'createRoom',
      config: {
        name: roomConfig.name || `${this.playerInfo.username}'s Room`,
        maxPlayers: roomConfig.maxPlayers || 4,
        gameMode: roomConfig.gameMode || 'classic',
        difficulty: roomConfig.difficulty || 2,
        theme: roomConfig.theme || 'fruits',
        isPrivate: roomConfig.isPrivate || false,
        password: roomConfig.password,
        spectators: roomConfig.allowSpectators !== false
      }
    });
  }

  joinRoom(roomId, password = null) {
    if (this.isMockMode) {
      const room = this.mockRooms.find((candidate) => candidate.id === roomId);
      if (room && room.currentPlayers < room.maxPlayers) {
        room.currentPlayers += 1;
        this.currentRoom = room;
        this.emit('roomJoined', room);
        this.emit('roomList', [...this.mockRooms]);
      }
      return;
    }

    this.sendMessage({
      type: 'joinRoom',
      roomId,
      password
    });
  }

  leaveRoom() {
    if (this.isMockMode && this.currentRoom) {
      this.currentRoom.currentPlayers = Math.max(0, this.currentRoom.currentPlayers - 1);
      this.currentRoom = null;
      this.emit('roomLeft');
      this.emit('roomList', [...this.mockRooms]);
      return;
    }

    if (this.currentRoom) {
      this.sendMessage({
        type: 'leaveRoom',
        roomId: this.currentRoom.id
      });
    }
  }

  getRoomList() {
    if (this.isMockMode) {
      const rooms = [...this.mockRooms];
      this.emit('roomList', rooms);
      return rooms;
    }

    this.sendMessage({
      type: 'getRoomList'
    });
  }

  // Game Actions
  makeMove(cardId, moveData) {
    this.sendMessage({
      type: 'playerMove',
      roomId: this.currentRoom?.id,
      cardId,
      moveData,
      timestamp: Date.now()
    });
  }

  sendGameUpdate(gameState) {
    this.sendMessage({
      type: 'gameUpdate',
      roomId: this.currentRoom?.id,
      gameState,
      timestamp: Date.now()
    });
  }

  // Tournament System
  joinTournament(tournamentId) {
    this.sendMessage({
      type: 'joinTournament',
      tournamentId
    });
  }

  createTournament(config) {
    this.sendMessage({
      type: 'createTournament',
      config: {
        name: config.name,
        maxParticipants: config.maxParticipants || 16,
        gameMode: config.gameMode || 'classic',
        difficulty: config.difficulty || 2,
        bracketType: config.bracketType || 'single-elimination',
        entryFee: config.entryFee || 0,
        prizes: config.prizes || []
      }
    });
  }

  // Spectator Mode
  spectateRoom(roomId) {
    this.sendMessage({
      type: 'spectateRoom',
      roomId
    });
  }

  stopSpectating() {
    this.sendMessage({
      type: 'stopSpectating'
    });
  }

  // Event Handlers
  handleAuthenticated(message) {
    if (message.success) {
      console.log('Successfully authenticated');
      this.emit('authenticated', message.playerInfo);
    } else {
      console.error('Authentication failed:', message.error);
      this.emit('authenticationFailed', message.error);
    }
  }

  handleRoomJoined(message) {
    this.currentRoom = message.room;
    this.emit('roomJoined', message.room);
  }

  handleRoomLeft() {
    this.currentRoom = null;
    this.emit('roomLeft');
  }

  handlePlayerJoined(message) {
    this.emit('playerJoined', message.player);
  }

  handlePlayerLeft(message) {
    this.emit('playerLeft', message.player);
  }

  handleGameStarted(message) {
    this.emit('gameStarted', message.gameState);
  }

  handleGameState(message) {
    this.emit('gameState', message.gameState);
  }

  handlePlayerMove(message) {
    this.emit('playerMove', message);
  }

  handleGameEnded(message) {
    // Update player stats
    const result = message.results.find(r => r.playerId === this.playerInfo.id);
    if (result) {
      this.updatePlayerStats(result);
    }
    this.emit('gameEnded', message);
  }

  handleTournamentUpdate(message) {
    this.emit('tournamentUpdate', message);
  }

  handleSpectatorUpdate(message) {
    this.emit('spectatorUpdate', message);
  }

  // Event System
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Utility Methods
  isInRoom() {
    return this.currentRoom !== null;
  }

  getPlayerInfo() {
    return { ...this.playerInfo };
  }

  updatePlayerProfile(updates) {
    this.playerInfo = { ...this.playerInfo, ...updates };
    this.savePlayerProfile();
  }

  // Mock server connection for development
  connectMockServer() {
    console.log('Connecting to mock multiplayer server...');

    return new Promise((resolve) => {
      setTimeout(() => {
        this.isMockMode = true;
        this.isConnected = true;
        this.emit('connected');
        this.emit('authenticated', this.playerInfo);
        this.emit('roomList', [...this.mockRooms]);
        resolve();
      }, 300);
    });
  }
}

// Export singleton instance
const multiplayerManager = new MultiplayerManager();
export default multiplayerManager;
