import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import pollRoutes from "./routes/polls.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

  const corsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    credentials: true,
    optionsSuccessStatus: 204
  };
  

const io = new Server(server, { cors: corsOptions });

app.set("io", io);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); //
app.use(express.json());

app.get("/health", (req, res) => //lol
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Realtime polling connected." });
});

export default server;

