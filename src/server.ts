import "dotenv/config";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import AppError from "./utils/AppError";
import routes from "./routes";
import { swaggerSpec } from "./configs/swagger";

const app = express();
const server = http.createServer(app);

// Configura o socket.io com ping sem esperar resposta
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir todas as origens, ajuste conforme necessário
    methods: ["GET", "POST"]
  },
  pingInterval: 30000,
  pingTimeout: 10000,
});

app.set("socketio", io);

app.use(cors());
app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Training App API Documentation"
}));

// Rota para acessar o JSON do Swagger
app.get("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(routes);

// Error handler
app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  console.error(error);

  return response.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

// Socket.io events
io.on("connection", (socket) => {
  console.log("Novo cliente conectado", socket.id);

  socket.on("register", (company_id: string | number) => {
    console.log(`Empresa ${company_id} registrada no socket ${socket.id}`);
    socket.join(String(company_id));
    // Lista todas as salas que o socket está
    const rooms = Array.from(socket.rooms);
    console.log(`Socket ${socket.id} está nas salas:`, rooms);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado", socket.id);
  });
});

const PORT = process.env.SERVER_PORT || 3232;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
});

export { app, io };
