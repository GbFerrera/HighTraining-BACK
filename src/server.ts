import "dotenv/config";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import multer from "multer";
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

  // Tratamento específico para erros do Multer
  if (error instanceof multer.MulterError) {
    let message = "Erro no upload do arquivo";
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = "Arquivo muito grande. Tamanho máximo permitido: 5MB";
        break;
      case 'LIMIT_FILE_COUNT':
        message = "Muitos arquivos enviados";
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = "Campo de arquivo inesperado. Use o campo 'photo'";
        break;
      case 'LIMIT_FIELD_KEY':
        message = "Nome do campo muito longo";
        break;
      case 'LIMIT_FIELD_VALUE':
        message = "Valor do campo muito longo";
        break;
      case 'LIMIT_FIELD_COUNT':
        message = "Muitos campos enviados";
        break;
      case 'LIMIT_PART_COUNT':
        message = "Muitas partes no formulário";
        break;
      default:
        message = error.message || "Erro no upload do arquivo";
    }

    return response.status(statusCode).json({
      status: "error",
      message: message,
    });
  }

  // Tratamento para outros erros de validação de arquivo
  if (error.message && error.message.includes('Tipo de arquivo inválido')) {
    return response.status(400).json({
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
