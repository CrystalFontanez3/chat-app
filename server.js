const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");
const Room = require("./models/Room");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const roomRoutes = require("./routes/rooms");
module.exports = mongoose.model("User", UserSchema);
