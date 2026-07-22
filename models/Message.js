git add .
git commit -m "Add backend and package.json"
git push
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  room: String,
  sender: String,
  receiver: String, // for DMs
  text: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
