const express = require("express");
const jwt = require("jsonwebtoken");
const Room = require("../models/Room");
const Message = require("../models/Message");

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/rooms
router.get("/", authMiddleware, async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

// POST /api/rooms
router.post("/", authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });
  const room = await Room.create({ name, members: [req.userId] });
  res.status(201).json(room);
});

// GET /api/rooms/:id/messages
router.get("/:id/messages", authMiddleware, async (req, res) => {
  const messages = await Message.find({ room: req.params.id })
    .populate("sender", "username")
    .sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = router;
