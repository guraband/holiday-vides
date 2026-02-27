import { createApp } from "./ui/app.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error("#app element not found");
}

const app = createApp(root);
app.start();
