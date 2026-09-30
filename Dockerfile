# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS builder
WORKDIR /app

RUN echo '{\
  "name": "whitebored-fullstack",\
  "version": "1.0.0",\
  "private": true,\
  "scripts": {\
    "build": "vite build"\
  },\
  "dependencies": {\
    "solid-js": "^1.8.0",\
    "express": "^4.19.2",\
    "mongoose": "^8.3.1",\
    "cors": "^2.8.5",\
    "bcryptjs": "^2.4.3",\
    "jsonwebtoken": "^9.0.2"\
  },\
  "devDependencies": {\
    "vite": "^5.0.0",\
    "vite-plugin-solid": "^2.8.0"\
  }\
}' > package.json

RUN echo 'import { defineConfig } from "vite";\
import solidPlugin from "vite-plugin-solid";\
export default defineConfig({\
  plugins: [solidPlugin()],\
});' > vite.config.js

RUN echo '<!DOCTYPE html>\
<html lang="en">\
  <head>\
    <meta charset="utf-8" />\
    <meta name="viewport" content="width=device-width, initial-scale=1" />\
    <title>whitebored.io</title>\
  </head>\
  <body>\
    <div id="root"></div>\
    <script type="module" src="/index.jsx"></script>\
  </body>\
</html>' > index.html

RUN echo 'body {\
  font-family: Roboto, "Helvetica Neue", sans-serif;\
  margin: 0;\
  padding: 0;\
  box-sizing: border-box;\
}\
.toolbar {\
  display: flex;\
  justify-content: space-between;\
  background: #3f51b5;\
  color: white;\
  padding: 12px 20px;\
  align-items: center;\
  flex-wrap: wrap;\
  gap: 10px;\
}' > style.css

# Copy your local index.jsx file into the container build
COPY index.jsx ./index.jsx

RUN npm install
RUN npx vite build

# --- Stage 2: Production Runtime ---
FROM node:18-alpine AS app-server
WORKDIR /app

RUN echo '{\
  "name": "whitebored-fullstack",\
  "version": "1.0.0",\
  "private": true,\
  "dependencies": {\
    "express": "^4.19.2",\
    "mongoose": "^8.3.1",\
    "cors": "^2.8.5",\
    "bcryptjs": "^2.4.3",\
    "jsonwebtoken": "^9.0.2"\
  }\
}' > package.json

RUN npm install --omit=dev

# Copy built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Write the Express server script
RUN echo 'const express = require("express");\
const path = require("path");\
const mongoose = require("mongoose");\
const cors = require("cors");\
\
const app = express();\
app.use(express.json({ limit: "10mb" }));\
app.use(cors());\
\
const MONGO_URI = process.env.MONGODB_URI || "mongodb://mongo:27017/whitebored";\
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";\
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpassword";\
\
mongoose.connect(MONGO_URI).catch(err => console.log("DB Connection warning:", err.message));\
\
const BlacklistSchema = new mongoose.Schema({\
  type: { type: String, required: true },\
  value: { type: String, required: true, unique: true },\
  reason: { type: String, required: true }\
});\
const Blacklist = mongoose.model("Blacklist", BlacklistSchema);\
\
const UserSchema = new mongoose.Schema({\
  username: { type: String, unique: true, required: true },\
  password: { type: String, required: true },\
  email: { type: String, required: true },\
  role: { type: String, default: "user" }\
});\
const User = mongoose.model("User", UserSchema);\
\
const WhiteboardSchema = new mongoose.Schema({\
  boardId: { type: String, unique: true, required: true },\
  owner: String,\
  data: String,\
  traces: Array,\
  textNodes: Array,\
  collaborators: [String]\
});\
const Whiteboard = mongoose.model("Whiteboard", WhiteboardSchema);\
\
app.get("/boards/:boardId", async (req, res) => {\
  const board = await Whiteboard.findOne({ boardId: req.params.boardId });\
  res.json(board || { boardId: req.params.boardId, data: "", traces: [], textNodes: [], collaborators: [] });\
});\
\
app.post("/boards", async (req, res) => {\
  const { boardId, data, traces, textNodes, owner, collaborators } = req.body;\
  const board = await Whiteboard.findOneAndUpdate(\
    { boardId },\
    { data, traces, textNodes, owner, collaborators },\
    { upsert: true, new: true }\
  );\
  res.json(board);\
});\
\
app.use(express.static(path.join(__dirname, "dist")));\
app.get("*", (req, res) => {\
  res.sendFile(path.join(__dirname, "dist", "index.html"));\
});\
\
const PORT = process.env.PORT || 3000;\
app.listen(PORT, "0.0.0.0", () => console.log("Server running on port " + PORT));' > server.js

EXPOSE 3000
CMD ["node", "server.js"]

# --- Stage 3: Nginx with NJS Module ---
FROM nginx:alpine AS nginx-server
RUN apk add --no-cache nginx-module-njs
RUN mkdir -p /etc/nginx/njs
COPY ./njs/passage_generator.js /etc/nginx/njs/passage_generator.js