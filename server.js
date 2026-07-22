require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");
const Room = require("./models/Room");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const roomRoutes = require("./routes/rooms");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Track online users
const onlineUsers = new Map();

// Authenticate Socket.IO connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// Socket.IO events
io.on("connection", async (socket) => {
  // Mark user online
  onlineUsers.set(socket.userId, socket.id);
  await User.findByIdAndUpdate(socket.userId, { online: true });

  io.emit("online-users", Array.from(onlineUsers.keys()));

  // Join room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  // Room messages
  socket.on("room-message", async ({ roomId, content }) => {
    if (!content) return;

    const msg = await Message.create({
      sender: socket.userId,
      room: roomId,
      content
    });

    const populated = await msg.populate("sender", "username");
    io.to(roomId).emit("room-message", populated);
  });

  // Direct messages
  socket.on("dm-message", async ({ recipientId, content }) => {
    if (!content) return;

    const msg = await Message.create({
      sender: socket.userId,
      recipient: recipientId,
      content
    });

    const populated = await msg.populate("sender", "username");

    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) {
      io.to(recipientSocket).emit("dm-message", populated);
    }

    socket.emit("dm-message", populated);
  });

  // Typing indicator
  socket.on("typing", ({ roomId, isTyping }) => {
    socket.to(roomId).emit("typing", {
      userId: socket.userId,
      isTyping
    });
  });

  // Disconnect
  socket.on("disconnect", async () => {
    onlineUsers.delete(socket.userId);
    await User.findByIdAndUpdate(socket.userId, { online: false });
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");
const Room = require("./models/Room");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const roomRoutes = require("./routes/rooms");

const app = express();
const server = http.createServer(app);

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  onlineUsers.set(socket.userId, socket.id);
  await User.findByIdAndUpdate(socket.userId, { online: true });

  io.emit("online-users", Array.from(onlineUsers.keys()));

  socket.on("join-room", (roomId) => socket.join(roomId));

  socket.on("room-message", async ({ roomId, content }) => {
    if (!content) return;

    const msg = await Message.create({
      sender: socket.userId,
      room: roomId,
      content
    });

    const populated = await msg.populate("sender", "username");
    io.to(roomId).emit("room-message", populated);
  });

  socket.on("dm-message", async ({ recipientId, content }) => {
    if (!content) return;

    const msg = await Message.create({
      sender: socket.userId,
      recipient: recipientId,
      content
    });

    const populated = await msg.populate("sender", "username");

    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) io.to(recipientSocket).emit("dm-message", populated);

    socket.emit("dm-message", populated);
  });

  socket.on("typing", ({ roomId, isTyping }) => {
    socket.to(roomId).emit("typing", {
      userId: socket.userId,
      isTyping
    });
  });

  socket.on("disconnect", async () => {
    onlineUsers.delete(socket.userId);
    await User.findByIdAndUpdate(socket.userId, { online: false });
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
