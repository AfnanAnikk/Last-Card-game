const { io } = require("socket.io-client");
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("createRoom", { nickname: "HostPlayer", profilePic: "profile1.png", maxPlayers: 4, settings: { playWithStack: true, playWithPlus6Plus10: true }});
});

socket.on("roomCreated", (data) => {
  console.log("Room Created:", data.roomCode);
  const socket2 = io("http://localhost:3001");
  socket2.on("connect", () => {
    socket2.emit("joinRoom", { nickname: "Player2", profilePic: "profile2.png", roomCode: data.roomCode });
  });
  
  socket2.on("roomJoined", () => {
    console.log("Player2 joined. Starting game...");
    socket.emit("startGame", { roomCode: data.roomCode });
  });
});

socket.on("gameStarted", () => {
  console.log("GAME STARTED SUCCESSFULLY!");
  process.exit(0);
});

socket.on("errorMessage", (msg) => {
  console.log("ERROR:", msg);
  process.exit(1);
});

socket.on("invalidMove", (msg) => {
  console.log("INVALID MOVE:", msg);
  process.exit(1);
});

setTimeout(() => {
  console.log("TIMEOUT");
  process.exit(1);
}, 3000);
