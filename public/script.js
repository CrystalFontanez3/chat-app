const token = localStorage.getItem("token");
const socket = io({ auth: { token } });

let currentRoom = null;

// Load rooms
fetch("/rooms")
  .then(res => res.json())
  .then(rooms => {
    const div = document.getElementById("rooms");
    rooms.forEach(r => {
      const btn = document.createElement("button");
      btn.textContent = r.name;
      btn.onclick = () => joinRoom(r.name);
      div.appendChild(btn);
    });
  });

// Load online users
setInterval(() => {
  fetch("/users/online")
    .then(res => res.json())
    .then(users => {
      const div = document.getElementById("online");
      div.innerHTML = "";
      users.forEach(u => {
        const p = document.createElement("p");
        p.textContent = u.username;
        div.appendChild(p);
      });
    });
}, 3000);

// Join room
function joinRoom(room) {
  currentRoom = room;
  socket.emit("joinRoom", room);
}

// Room history
socket.on("history", (messages) => {
  const list = document.getElementById("messages");
  list.innerHTML = "";
  messages.forEach(addMessage);
});

// New message
socket.on("message", addMessage);

function addMessage(msg) {
  const li = document.createElement("li");
  li.textContent = `${msg.sender}: ${msg.text}`;
  document.getElementById("messages").appendChild(li);
}

// Send message
function sendMessage() {
  const text = document.getElementById("input").value;
  socket.emit("chatMessage", { room: currentRoom, text });
  document.getElementById("input").value = "";
}

// Typing indicator
document.getElementById("input").addEventListener("input", () => {
  socket.emit("typing", currentRoom);
});

socket.on("typing", (user) => {
  console.log(`${user} is typing...`);
});

// DM
function sendDM() {
  const to = document.getElementById("to").value;
  const text = document.getElementById("dm").value;

  socket.emit("dm", { to, text });
}

socket.on("dm", (msg) => {
  const li = document.createElement("li");
  li.textContent = `${msg.sender} → ${msg.receiver}: ${msg.text}`;
  document.getElementById("dmMessages").appendChild(li);
});
