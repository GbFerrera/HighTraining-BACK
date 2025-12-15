import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Diretórios para salvar as fotos
const clienteUploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'cliente-photos');
const treinadorUploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'treinador-photos');
const feedbackUploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'feedback-photos');
const timelineUploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'timeline-photos');
const studentProfileUploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'student-profile-photos');
const trainerProfileUploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'trainer-profile-photos');

// Criar diretórios se não existirem
if (!fs.existsSync(clienteUploadDir)) {
  fs.mkdirSync(clienteUploadDir, { recursive: true });
}

if (!fs.existsSync(treinadorUploadDir)) {
  fs.mkdirSync(treinadorUploadDir, { recursive: true });
}

if (!fs.existsSync(feedbackUploadDir)) {
  fs.mkdirSync(feedbackUploadDir, { recursive: true });
}

if (!fs.existsSync(timelineUploadDir)) {
  fs.mkdirSync(timelineUploadDir, { recursive: true });
}

if (!fs.existsSync(studentProfileUploadDir)) {
  fs.mkdirSync(studentProfileUploadDir, { recursive: true });
}

if (!fs.existsSync(trainerProfileUploadDir)) {
  fs.mkdirSync(trainerProfileUploadDir, { recursive: true });
}

// Filtro para aceitar apenas imagens
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.'));
  }
};

// Configuração do storage para clientes
const clienteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, clienteUploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Configuração do storage para treinadores
const treinadorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, treinadorUploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Configuração do Multer para clientes
export const upload = multer({
  storage: clienteStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Configuração do storage para feedback
const feedbackStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, feedbackUploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Configuração do storage para timeline
const timelineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, timelineUploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Configuração do Multer para treinadores
export const treinadorUpload = multer({
  storage: treinadorStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Configuração do Multer para feedback (permite múltiplos arquivos)
export const feedbackUpload = multer({
  storage: feedbackStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB por arquivo
    files: 10 // Máximo 10 arquivos por upload
  }
});

// Configuração do Multer para timeline (uma foto por entrada)
export const timelineUpload = multer({
  storage: timelineStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Configuração do storage para fotos de perfil de estudantes
const studentProfileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, studentProfileUploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Configuração do storage para fotos de perfil de treinadores
const trainerProfileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, trainerProfileUploadDir);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Configuração do Multer para fotos de perfil de estudantes
export const studentProfileUpload = multer({
  storage: studentProfileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Configuração do Multer para fotos de perfil de treinadores
export const trainerProfileUpload = multer({
  storage: trainerProfileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

export { clienteUploadDir, treinadorUploadDir, feedbackUploadDir, timelineUploadDir, studentProfileUploadDir, trainerProfileUploadDir };
