const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/online", async (req, res) => {
  const users = await User.find({ online: true });
  res.json(users);
});

module.exports = router;
