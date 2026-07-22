const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

router.get("/", async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

router.post("/", async (req, res) => {
  const room = new Room({ name: req.body.name });
  await room.save();
  res.json(room);
});

module.exports = router;
