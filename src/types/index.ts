// Database Models
export interface Admin {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Treinador {
  id: number;
  admin_id: number;
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: number;
  admin_id: number;
  treinador_id?: number;
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  created_at: string;
  updated_at: string;
}

export interface Training {
  id: number;
  admin_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientTraining {
  id: number;
  cliente_id: number;
  training_id: number;
  assigned_at: string;
}

export interface ClienteEstatistic {
  id: number;
  cliente_id: number;
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
  recorded_at: string;
}

export interface AgendaPoint {
  id: number;
  cliente_id: number;
  treinador_id?: number;
  title: string;
  description?: string;
  scheduled_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: number;
  admin_id: number;
  name: string;
  description?: string;
  muscle_group?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseTraining {
  id: number;
  training_id: number;
  exercise_id: number;
  video_url?: string;
  sets?: number;
  reps?: string;
  rest_time?: string;
  notes?: string;
  order_index?: number;
}

// DTOs (Data Transfer Objects)
export interface CreateClienteDTO {
  name: string;
  email: string;
  password: string;
  treinador_id?: number;
  phone_number?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
}

export interface UpdateClienteDTO {
  name?: string;
  email?: string;
  password?: string;
  treinador_id?: number;
  phone_number?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
}

export interface CreateTreinadorDTO {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
}

export interface UpdateTreinadorDTO {
  name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
}

export interface CreateAdminDTO {
  name: string;
  email: string;
  password: string;
}

export interface CreateTrainingDTO {
  name: string;
  description?: string;
}

export interface UpdateTrainingDTO {
  name?: string;
  description?: string;
}

export interface CreateExerciseDTO {
  name: string;
  description?: string;
  muscle_group?: string;
}

export interface UpdateExerciseDTO {
  name?: string;
  description?: string;
  muscle_group?: string;
}

export interface CreateExerciseTrainingDTO {
  training_id: number;
  exercise_id: number;
  video_url?: string;
  sets?: number;
  reps?: string;
  rest_time?: string;
  notes?: string;
  order_index?: number;
}

export interface UpdateExerciseTrainingDTO {
  video_url?: string;
  sets?: number;
  reps?: string;
  rest_time?: string;
  notes?: string;
  order_index?: number;
}

export interface CreateClienteEstatisticDTO {
  cliente_id: number;
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
}

export interface CreateAgendaPointDTO {
  cliente_id: number;
  treinador_id?: number;
  title: string;
  description?: string;
  scheduled_at: string;
  status: string;
}

export interface UpdateAgendaPointDTO {
  title?: string;
  description?: string;
  scheduled_at?: string;
  status?: string;
}

// Response Types
export interface ClienteWithTreinador extends Omit<Cliente, 'password'> {
  treinador_name?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<Admin | Treinador | Cliente, 'password'>;
}

// Query Params
export interface ClienteQueryParams {
  term?: string;
  treinador_id?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
