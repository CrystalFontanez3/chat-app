const socket = io("https://your-backend-url", {
  auth: { token: localStorage.getItem("token") }
});
