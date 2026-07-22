const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model("User", UserSchema);
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed });
  await user.save();

  res.json({ message: "User registered" });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user._id, username }, process.env.JWT_SECRET);

  res.json({ token });
});

module.exports = router;
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
const connectDB = require("./config/db");
const Message = require("./models/Message");
const authRoutes = require("./routes/auth");
const jwt = require("jsonwebtoken");
require("dotenv").config();

connectDB();

app.use(express.json());
app.use(express.static("public"));
app.use("/auth", authRoutes);

// Middleware to verify JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch {
    next(new Error("Authentication error"));
  }
});

// Socket events
io.on("connection", (socket) => {
  console.log("User connected:", socket.user.username);

  socket.on("joinRoom", async (room) => {
    socket.join(room);

    const history = await Message.find({ room }).sort({ timestamp: 1 });
    socket.emit("history", history);
  });

  socket.on("chatMessage", async ({ room, text }) => {
    const msg = new Message({
      room,
      username: socket.user.username,
      text
    });

    await msg.save();

    io.to(room).emit("message", msg);
  });
});

http.listen(3000, () => console.log("Server running"));
const token = localStorage.getItem("token");
const socket = io({ auth: { token } });

let currentRoom = null;

socket.on("history", (messages) => {
  const list = document.getElementById("messages");
  list.innerHTML = "";
  messages.forEach(addMessage);
});

socket.on("message", addMessage);

function addMessage(msg) {
  const li = document.createElement("li");
  li.textContent = `${msg.username}: ${msg.text}`;
  document.getElementById("messages").appendChild(li);
}

function joinRoom(room) {
  currentRoom = room;
  socket.emit("joinRoom", room);
}

function sendMessage() {
  const text = document.getElementById("input").value;
  socket.emit("chatMessage", { room: currentRoom, text });
  document.getElementById("input").value = "";
}
