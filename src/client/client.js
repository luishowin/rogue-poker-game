const socket = io();

const createBtn = document.getElementById('createRoomBtn');
const joinBtn = document.getElementById('joinRoomBtn');
const startBtn = document.getElementById('startBtn');
const roomInput = document.getElementById('roomInput');
const gameArea = document.getElementById('gameArea');
const playerHand = document.getElementById('playerHand');

let roomCode = '';
let hand = [];

// Button actions
createBtn.onclick = () => {
  roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  socket.emit('createRoom', roomCode);
  roomInput.value = roomCode;
  alert(`Room created: ${roomCode}`);
};

joinBtn.onclick = () => {
  roomCode = roomInput.value.trim();
  if (!roomCode) return alert('Enter a room code');
  socket.emit('joinRoom', roomCode);
};

startBtn.onclick = () => {
  socket.emit('startGame', roomCode);
  gameArea.style.display = 'block';
};

// Socket events
socket.on('roomCreated', (code) => console.log('Room created:', code));
socket.on('roomJoined', (code) => console.log('Joined room:', code));
socket.on('startGame', (cards) => renderHand(cards));
socket.on('updateHand', (cards) => renderHand(cards));

function renderHand(cards) {
  playerHand.innerHTML = '';
  hand = cards;
  cards.forEach((card) => {
    const div = document.createElement('div');
    div.className = 'card-tile';
    div.style.background = card.color;
    div.textContent = card.value;
    div.onclick = () => socket.emit('playCard', { room: roomCode, card });
    playerHand.appendChild(div);
  });
}
