import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

type RepType = 'reps-load' | 'reps-load-time' | 'complete-set' | 'reps-time' | 'cadence' | 'notes' | 'running' | 'time-incline';

const TABLES: Record<RepType, string> = {
  'reps-load': 'rep_reps_load',
  'reps-load-time': 'rep_reps_load_time',
  'complete-set': 'rep_complete_set',
  'reps-time': 'rep_reps_time',
  'cadence': 'rep_cadence',
  'notes': 'rep_notes',
  'running': 'rep_running',
  'time-incline': 'rep_time_incline',
};

// Mapping exercise names/categories to repetition types
const EXERCISE_TYPE_MAPPING: Record<string, RepType> = {
  // Running exercises
  'corrida': 'running',
  'caminhada': 'running',
  'esteira': 'running',
  'cooper': 'running',
  
  // Cadence exercises
  'cadencia': 'cadence',
  'ritmo': 'cadence',
  
  // Time-incline exercises (treadmill with incline)
  'inclinacao': 'time-incline',
  'subida': 'time-incline',
  
  // Notes exercises (stretching, warm-up, etc.)
  'alongamento': 'notes',
  'aquecimento': 'notes',
  'observacao': 'notes',
  'anotacao': 'notes',
};

// Function to determine repetition type based on exercise
function getRepetitionTypeForExercise(exerciseName: string, category?: string): RepType {
  const name = (exerciseName || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  
  // Check exercise name first
  for (const [keyword, type] of Object.entries(EXERCISE_TYPE_MAPPING)) {
    if (name.includes(keyword) || cat.includes(keyword)) {
      return type;
    }
  }
  
  // Default to reps-load for traditional weight exercises
  return 'reps-load';
}

class RepetitionsController {
  /**
   * @swagger
   * /repetitions/{type}:
   *   post:
   *     summary: Criar nova repetição de exercício
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [reps-load, reps-load-time, complete-set, reps-time, cadence, notes, running, time-incline]
   *         description: Tipo de repetição
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             oneOf:
   *               - type: object
   *                 title: reps-load
   *                 required: [exercise_id, set, reps, load, rest]
   *                 properties:
   *                   exercise_id:
   *                     type: number
   *                     example: 1
   *                   set:
   *                     type: number
   *                     example: 3
   *                   reps:
   *                     type: number
   *                     example: 12
   *                   load:
   *                     type: number
   *                     example: 50
   *                   rest:
   *                     type: number
   *                     example: 60
   *               - type: object
   *                 title: reps-load-time
   *                 required: [exercise_id, reps, load, time]
   *                 properties:
   *                   exercise_id:
   *                     type: number
   *                     example: 1
   *                   reps:
   *                     type: number
   *                     example: 12
   *                   load:
   *                     type: number
   *                     example: 50
   *                   time:
   *                     type: number
   *                     example: 30
   *               - type: object
   *                 title: complete-set
   *                 required: [exercise_id, set, reps, load, time, rest]
   *                 properties:
   *                   exercise_id:
   *                     type: number
   *                     example: 1
   *                   set:
   *                     type: number
   *                     example: 3
   *                   reps:
   *                     type: number
   *                     example: 12
   *                   load:
   *                     type: number
   *                     example: 50
   *                   time:
   *                     type: number
   *                     example: 30
   *                   rest:
   *                     type: number
   *                     example: 60
   *               - type: object
   *                 title: reps-time
   *                 required: [exercise_id, set, reps, time, rest]
   *                 properties:
   *                   exercise_id:
   *                     type: number
   *                     example: 1
   *                   set:
   *                     type: number
   *                     example: 3
   *                   reps:
   *                     type: number
   *                     example: 12
   *                   time:
   *                     type: number
   *                     example: 30
   *                   rest:
   *                     type: number
   *                     example: 60
   *     responses:
   *       201:
   *         description: Repetição criada com sucesso
   *       400:
   *         description: Dados inválidos ou tipo de repetição inválido
   *       404:
   *         description: Exercício não encontrado
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { type } = req.params as { type: RepType };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const body = req.body || {};
    const exercise_id = Number(body.exercise_id);
    if (!exercise_id || isNaN(exercise_id)) throw new AppError('exercise_id inválido', 400);

    const exercise = await knex('exercises')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ 'exercises.id': exercise_id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();
    if (!exercise) throw new AppError('Exercício não encontrado', 404);

    const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    const table = TABLES[type];
    let payload: any = { exercise_id, created_at: now };

    switch (type) {
      case 'reps-load': {
        const { set, reps, load, rest } = body;
        if ([set, reps, load, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, load, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), rest: Number(rest) };
        break;
      }
      case 'reps-load-time': {
        const { reps, load, time } = body;
        if ([reps, load, time].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: reps, load, time', 400);
        payload = { ...payload, reps: Number(reps), load: Number(load), time: Number(time) };
        break;
      }
      case 'complete-set': {
        const { set, reps, load, time, rest } = body;
        if ([set, reps, load, time, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, load, time, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), time: Number(time), rest: Number(rest) };
        break;
      }
      case 'reps-time': {
        const { set, reps, time, rest } = body;
        if ([set, reps, time, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, time, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), time: Number(time), rest: Number(rest) };
        break;
      }
      case 'cadence': {
        const { cadence } = body;
        if (!cadence) throw new AppError('Campo obrigatório: cadence', 400);
        payload = { ...payload, cadence: String(cadence) };
        break;
      }
      case 'notes': {
        const { notes } = body;
        if (!notes) throw new AppError('Campo obrigatório: notes', 400);
        payload = { ...payload, notes: String(notes) };
        break;
      }
      case 'running': {
        const { speed, distance, time, pace, rest } = body;
        if (rest === undefined) throw new AppError('Campo obrigatório: rest', 400);
        payload = { 
          ...payload, 
          speed: speed ? Number(speed) : null,
          distance: distance ? Number(distance) : null,
          time: time ? Number(time) : null,
          pace: pace ? String(pace) : null,
          rest: Number(rest)
        };
        break;
      }
      case 'time-incline': {
        const { time, incline, rest } = body;
        if ([time, incline, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: time, incline, rest', 400);
        payload = { ...payload, time: Number(time), incline: Number(incline), rest: Number(rest) };
        break;
      }
    }

    const [row] = await knex(table).insert(payload).returning('*');
    return res.status(201).json(row);
  }

  /**
   * @swagger
   * /repetitions/{type}:
   *   get:
   *     summary: Listar repetições de exercício por tipo
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [reps-load, reps-load-time, complete-set, reps-time, cadence, notes, running, time-incline]
   *         description: Tipo de repetição
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *       - in: query
   *         name: exercise_id
   *         schema:
   *           type: number
   *         description: Filtrar por ID do exercício
   *     responses:
   *       200:
   *         description: Lista de repetições
   *       400:
   *         description: Tipo de repetição inválido
   */
  async index(req: Request, res: Response): Promise<Response> {
    const { type } = req.params as { type: RepType };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const { exercise_id } = req.query as any;
    const table = TABLES[type];

    let query = knex(table)
      .select(`${table}.*`)
      .leftJoin('exercises', `${table}.exercise_id`, 'exercises.id')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      });

    if (exercise_id) query = query.where(`${table}.exercise_id`, exercise_id);

    const rows = await query.orderBy(`${table}.created_at`, 'desc');
    return res.json(rows);
  }

  /**
   * @swagger
   * /repetitions/{type}/{id}:
   *   get:
   *     summary: Obter repetição específica por ID
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [reps-load, reps-load-time, complete-set, reps-time, cadence, notes, running, time-incline]
   *         description: Tipo de repetição
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da repetição
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Repetição encontrada
   *       400:
   *         description: Tipo de repetição inválido
   *       404:
   *         description: Registro não encontrado
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { type, id } = req.params as { type: RepType; id: string };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const table = TABLES[type];

    const row = await knex(table)
      .select(`${table}.*`)
      .leftJoin('exercises', `${table}.exercise_id`, 'exercises.id')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ [`${table}.id`]: id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();

    if (!row) throw new AppError('Registro não encontrado', 404);
    return res.json(row);
  }

  /**
   * @swagger
   * /repetitions/{type}/{id}:
   *   delete:
   *     summary: Deletar repetição específica
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [reps-load, reps-load-time, complete-set, reps-time, cadence, notes, running, time-incline]
   *         description: Tipo de repetição
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da repetição
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Registro excluído com sucesso
   *       400:
   *         description: Tipo de repetição inválido
   *       404:
   *         description: Registro não encontrado
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { type, id } = req.params as { type: RepType; id: string };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const table = TABLES[type];

    const row = await knex(table)
      .leftJoin('exercises', `${table}.exercise_id`, 'exercises.id')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ [`${table}.id`]: id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();

    if (!row) throw new AppError('Registro não encontrado', 404);

    await knex(table).where({ id }).delete();
    return res.json({ message: 'Registro excluído com sucesso' });
  }

  /**
   * @swagger
   * /repetitions/{type}/{id}/load:
   *   patch:
   *     summary: Atualizar somente a carga de uma repetição
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [reps-load, reps-load-time, complete-set]
   *         description: Tipos que possuem campo de carga
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da repetição
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [load]
   *             properties:
   *               load:
   *                 type: number
   *                 example: 55.5
   *                 description: Nova carga (peso)
   *     responses:
   *       200:
   *         description: Carga atualizada com sucesso
   *       400:
   *         description: Dados inválidos ou tipo sem carga
   *       404:
   *         description: Registro não encontrado
   */
  async updateLoad(req: Request, res: Response): Promise<Response> {
    const { type, id } = req.params as { type: RepType; id: string };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    // Somente tipos com carga
    const typesWithLoad: RepType[] = ['reps-load', 'reps-load-time', 'complete-set'];
    if (!typesWithLoad.includes(type)) throw new AppError('Este tipo de repetição não possui carga', 400);

    const { load } = req.body as any;
    const newLoad = Number(load);
    if (load === undefined || isNaN(newLoad)) throw new AppError('Campo load é obrigatório e deve ser numérico', 400);

    const table = TABLES[type];

    const exists = await knex(table)
      .select(`${table}.*`)
      .leftJoin('exercises', `${table}.exercise_id`, 'exercises.id')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ [`${table}.id`]: id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();

    if (!exists) throw new AppError('Registro não encontrado', 404);

    await knex(table)
      .update({ load: newLoad })
      .where({ id });

    const updated = await knex(table).where({ id }).first();
    return res.status(200).json({ message: 'Carga atualizada com sucesso', repetition: updated });
  }

  /**
   * @swagger
   * /repetitions/exercise/{exercise_id}:
   *   get:
   *     summary: Buscar todas as repetições de um exercício específico
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exercise_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do exercício
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Repetições encontradas para o exercício
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 exercise_id:
   *                   type: integer
   *                 repetitions:
   *                   type: array
   *                   items:
   *                     type: object
   *       404:
   *         description: Exercício não encontrado
   */
  async getByExercise(req: Request, res: Response): Promise<Response> {
    const { exercise_id } = req.params;
    const admin_id = req.headers.admin_id as string;
    
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);
    if (!exercise_id || isNaN(Number(exercise_id))) throw new AppError('ID do exercício inválido', 400);

    // Verificar se o exercício existe e pertence ao admin
    const exercise = await knex('exercises')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ 'exercises.id': exercise_id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();
      
    if (!exercise) throw new AppError('Exercício não encontrado', 404);

    // Buscar repetições em todas as tabelas
    const allRepetitions: any[] = [];

    const exerciseTrainingPreset = await knex('exercise_trainings')
      .select(
        'exercise_trainings.id',
        'exercise_trainings.exercise_id',
        'exercise_trainings.sets',
        'exercise_trainings.reps',
        'exercise_trainings.rest_time',
        'exercise_trainings.rep_type',
        'exercise_trainings.default_load',
        'exercise_trainings.default_set',
        'exercise_trainings.default_reps',
        'exercise_trainings.default_time',
        'exercise_trainings.default_rest',
        'exercise_trainings.created_at',
        'exercise_trainings.updated_at'
      )
      .where({ 'exercise_trainings.admin_id': admin_id, 'exercise_trainings.exercise_id': exercise_id })
      .orderBy('exercise_trainings.updated_at', 'desc')
      .orderBy('exercise_trainings.created_at', 'desc')
      .first();

    // Buscar em rep_reps_load
    const repsLoad = await knex('rep_reps_load')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    repsLoad.forEach(rep => {
      allRepetitions.push({
        ...rep,
        type: 'reps-load',
        formatted: `${rep.set}x ${rep.reps} - ${rep.load}kg - ${rep.rest}s descanso`
      });
    });

    // Buscar em rep_reps_load_time
    const repsLoadTime = await knex('rep_reps_load_time')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    repsLoadTime.forEach(rep => {
      allRepetitions.push({
        ...rep,
        type: 'reps-load-time',
        formatted: `${rep.reps} reps - ${rep.load}kg - ${rep.time}s`
      });
    });

    // Buscar em rep_complete_set
    const completeSet = await knex('rep_complete_set')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    completeSet.forEach(rep => {
      allRepetitions.push({
        ...rep,
        type: 'complete-set',
        formatted: `${rep.set}x ${rep.reps} - ${rep.load}kg - ${rep.time}s - ${rep.rest}s descanso`
      });
    });

    // Buscar em rep_reps_time
    const repsTime = await knex('rep_reps_time')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    repsTime.forEach(rep => {
      allRepetitions.push({
        ...rep,
        type: 'reps-time',
        formatted: `${rep.set}x ${rep.reps} - ${rep.time}s - ${rep.rest}s descanso`
      });
    });

    // Buscar em rep_cadence
    const cadence = await knex('rep_cadence')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    cadence.forEach(rep => {
      allRepetitions.push({
        ...rep,
        type: 'cadence',
        formatted: `Cadência: ${rep.cadence}`
      });
    });

    // Buscar em rep_notes
    const notes = await knex('rep_notes')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    notes.forEach(rep => {
      allRepetitions.push({
        ...rep,
        type: 'notes',
        formatted: `Observações: ${rep.notes.substring(0, 50)}${rep.notes.length > 50 ? '...' : ''}`
      });
    });

    // Buscar em rep_running
    const running = await knex('rep_running')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    running.forEach(rep => {
      const parts = [];
      if (rep.speed) parts.push(`${rep.speed}km/h`);
      if (rep.distance) parts.push(`${rep.distance}m`);
      if (rep.time) parts.push(`${rep.time}s`);
      if (rep.pace) parts.push(`pace ${rep.pace}`);
      parts.push(`${rep.rest}s descanso`);
      
      allRepetitions.push({
        ...rep,
        type: 'running',
        formatted: `Corrida: ${parts.join(' - ')}`
      });
    });

    // Buscar em rep_time_incline
    const timeIncline = await knex('rep_time_incline')
      .where({ exercise_id })
      .orderBy('created_at', 'desc');
    timeIncline.forEach(rep => {
      allRepetitions.push({
        ...rep,
        type: 'time-incline',
        formatted: `${rep.time}s - ${rep.incline}% inclinação - ${rep.rest}s descanso`
      });
    });

    if (exerciseTrainingPreset) {
      const presetType: RepType = (exerciseTrainingPreset.rep_type as RepType) || getRepetitionTypeForExercise(exercise.name, exercise.muscle_group);
      const presetCreatedAt = exerciseTrainingPreset.updated_at || exerciseTrainingPreset.created_at;
      const presetSet = exerciseTrainingPreset.default_set ?? exerciseTrainingPreset.sets ?? null;
      const presetReps = exerciseTrainingPreset.default_reps ?? exerciseTrainingPreset.reps ?? null;
      const presetLoad = exerciseTrainingPreset.default_load ?? null;
      const presetTime = exerciseTrainingPreset.default_time ?? null;
      const presetRest = exerciseTrainingPreset.default_rest ?? exerciseTrainingPreset.rest_time ?? null;

      // Buscar ajuste mais recente do aluno para este exercise_training (se houver student_id na query)
      let adjustedLoad = null;
      let adjustment = null;
      const studentIdFromQuery = (req.query as any).student_id;
      
      if (studentIdFromQuery) {
        adjustment = await knex('student_load_adjustments')
          .where({ 
            exercise_training_id: exerciseTrainingPreset.id,
            student_id: studentIdFromQuery
          })
          .orderBy('created_at', 'desc')
          .first();
        
        if (adjustment) {
          adjustedLoad = adjustment.adjusted_load;
        }
      }

      let formatted = 'Repetição definida';
      const displayLoad = adjustedLoad ?? presetLoad;
      
      if (presetType === 'reps-load') {
        formatted = `${presetSet ?? 0}x ${presetReps ?? 0} - ${displayLoad ?? 0}kg - ${presetRest ?? 0}s descanso`;
      } else if (presetType === 'reps-load-time') {
        formatted = `${presetReps ?? 0} reps - ${displayLoad ?? 0}kg - ${presetTime ?? 0}s`;
      } else if (presetType === 'complete-set') {
        formatted = `${presetSet ?? 0}x ${presetReps ?? 0} - ${displayLoad ?? 0}kg - ${presetTime ?? 0}s - ${presetRest ?? 0}s descanso`;
      } else if (presetType === 'reps-time') {
        formatted = `${presetSet ?? 0}x ${presetReps ?? 0} - ${presetTime ?? 0}s - ${presetRest ?? 0}s descanso`;
      } else if (presetType === 'cadence') {
        formatted = `Cadência`;
      } else if (presetType === 'notes') {
        formatted = `Observações`;
      } else if (presetType === 'running') {
        formatted = `Corrida`;
      } else if (presetType === 'time-incline') {
        formatted = `${presetTime ?? 0}s - inclinação - ${presetRest ?? 0}s descanso`;
      }

      allRepetitions.push({
        id: exerciseTrainingPreset.id,
        exercise_id: Number(exercise_id),
        type: presetType,
        set: presetSet,
        reps: presetReps,
        load: displayLoad, // Mostra o peso ajustado se existir, senão o original
        original_load: presetLoad, // Sempre mantém o peso original do personal
        adjusted_load: adjustedLoad, // Peso ajustado pelo aluno (null se não ajustou)
        has_adjustment: !!adjustment, // Flag indicando se houve ajuste
        time: presetTime,
        rest: presetRest,
        created_at: presetCreatedAt,
        formatted,
        source: 'exercise_trainings',
      });
    }

    // Ordenar todas as repetições por data de criação (mais recente primeiro)
    allRepetitions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({
      exercise_id: Number(exercise_id),
      exercise_name: exercise.name,
      repetitions: allRepetitions
    });
  }

  /**
   * @swagger
   * /repetitions/load-progress/student/{student_id}:
   *   get:
   *     summary: Evolução de carga dos exercícios do aluno
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: student_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do aluno
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *       - in: query
   *         name: exercise_id
   *         schema:
   *           type: integer
   *         description: Filtrar por um exercício específico
   *       - in: query
   *         name: start_date
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: end_date
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Série temporal de cargas por exercício
   */
  async loadProgressByStudent(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;
    const admin_id = req.headers.admin_id as string;
    const { exercise_id, start_date, end_date } = req.query as any;

    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);
    if (!student_id || isNaN(Number(student_id))) throw new AppError('ID do aluno inválido', 400);

    const student = await knex('students').where({ id: student_id }).first();
    if (!student) throw new AppError('Aluno não encontrado', 404);

    let exercisesQuery = knex('exercise_trainings')
      .select('exercise_trainings.exercise_id', 'exercises.name as exercise_name')
      .leftJoin('routine_trainings', 'exercise_trainings.training_id', 'routine_trainings.training_id')
      .leftJoin('training_routines', 'routine_trainings.routine_id', 'training_routines.id')
      .leftJoin('exercises', 'exercise_trainings.exercise_id', 'exercises.id')
      .where('training_routines.admin_id', admin_id)
      .andWhere('training_routines.student_id', student_id);

    if (exercise_id) exercisesQuery = exercisesQuery.andWhere('exercise_trainings.exercise_id', exercise_id);

    const exercisesRows = await exercisesQuery.distinct();
    const exerciseIds = exercisesRows.map((r: any) => r.exercise_id);

    if (exerciseIds.length === 0) {
      return res.json({ student_id: Number(student_id), exercises: [] });
    }

    const applyDateRange = (qb: any, alias: string) => {
      if (start_date) qb = qb.andWhere(`${alias}.created_at`, '>=', start_date);
      if (end_date) qb = qb.andWhere(`${alias}.created_at`, '<=', end_date);
      return qb;
    };

    type ProgressRow = {
      exercise_id: number;
      set?: number | null;
      reps?: number | null;
      load?: number | null;
      time?: number | null;
      rest?: number | null;
      created_at: string;
    };

    const repsLoad = await applyDateRange(
      knex('rep_reps_load').select(
        'rep_reps_load.id',
        'rep_reps_load.exercise_id',
        'rep_reps_load.set',
        'rep_reps_load.reps',
        'rep_reps_load.load',
        'rep_reps_load.rest',
        'rep_reps_load.created_at'
      ).whereIn('rep_reps_load.exercise_id', exerciseIds),
      'rep_reps_load'
    ) as unknown as ProgressRow[];

    const repsLoadTime = await applyDateRange(
      knex('rep_reps_load_time').select(
        'rep_reps_load_time.id',
        'rep_reps_load_time.exercise_id',
        knex.raw('NULL as set'),
        'rep_reps_load_time.reps',
        'rep_reps_load_time.load',
        'rep_reps_load_time.time',
        knex.raw('NULL as rest'),
        'rep_reps_load_time.created_at'
      ).whereIn('rep_reps_load_time.exercise_id', exerciseIds),
      'rep_reps_load_time'
    ) as unknown as ProgressRow[];

    const completeSet = await applyDateRange(
      knex('rep_complete_set').select(
        'rep_complete_set.id',
        'rep_complete_set.exercise_id',
        'rep_complete_set.set',
        'rep_complete_set.reps',
        'rep_complete_set.load',
        'rep_complete_set.time',
        'rep_complete_set.rest',
        'rep_complete_set.created_at'
      ).whereIn('rep_complete_set.exercise_id', exerciseIds),
      'rep_complete_set'
    ) as unknown as ProgressRow[];

    interface ExerciseProgressPoint {
      type: 'reps-load' | 'reps-load-time' | 'complete-set';
      set: number | null;
      reps: number | null;
      load: number | null;
      time: number | null;
      rest: number | null;
      created_at: string;
    }

    interface ExerciseProgress {
      exercise_id: number;
      exercise_name: string;
      progress: ExerciseProgressPoint[];
    }

    type ExerciseRow = { exercise_id: number; exercise_name: string };
    const exercisesRowsTyped = exercisesRows as ExerciseRow[];

    const byExercise: Record<number, ExerciseProgress> = {};
    for (const row of exercisesRowsTyped) {
      byExercise[row.exercise_id] = { exercise_id: row.exercise_id, exercise_name: row.exercise_name, progress: [] };
    }

    const push = (type: ExerciseProgressPoint['type'], r: ProgressRow) => {
      const e = byExercise[r.exercise_id];
      if (!e) return;
      e.progress.push({
        type,
        set: (r.set ?? null) as number | null,
        reps: (r.reps ?? null) as number | null,
        load: (r.load ?? null) as number | null,
        time: (r.time ?? null) as number | null,
        rest: (r.rest ?? null) as number | null,
        created_at: r.created_at,
      });
    };

    repsLoad.forEach(r => push('reps-load', r));
    repsLoadTime.forEach(r => push('reps-load-time', r));
    completeSet.forEach(r => push('complete-set', r));

    Object.values(byExercise).forEach((e: ExerciseProgress) => {
      e.progress.sort((a: ExerciseProgressPoint, b: ExerciseProgressPoint) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return res.json({ student_id: Number(student_id), exercises: Object.values(byExercise) });
  }

  /**
   * @swagger
   * /repetitions/auto/{exercise_id}:
   *   post:
   *     summary: Criar repetição automaticamente baseada no tipo do exercício
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exercise_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do exercício
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             description: Campos variam baseado no tipo do exercício
   *     responses:
   *       201:
   *         description: Repetição criada com sucesso
   *       400:
   *         description: Dados inválidos
   *       404:
   *         description: Exercício não encontrado
   */
  async createAuto(req: Request, res: Response): Promise<Response> {
    const { exercise_id } = req.params;
    const admin_id = req.headers.admin_id as string;
    
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);
    if (!exercise_id || isNaN(Number(exercise_id))) throw new AppError('ID do exercício inválido', 400);

    // Buscar o exercício para determinar o tipo
    const exercise = await knex('exercises')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ 'exercises.id': exercise_id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();
      
    if (!exercise) throw new AppError('Exercício não encontrado', 404);

    // Determinar o tipo de repetição baseado no exercício
    const repType = getRepetitionTypeForExercise(exercise.name, exercise.category);
    
    // Criar a repetição usando o tipo determinado
    const body = { ...req.body, exercise_id: Number(exercise_id) };
    const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
    const table = TABLES[repType];
    let payload: any = { exercise_id: Number(exercise_id), created_at: now };

    switch (repType) {
      case 'reps-load': {
        const { set, reps, load, rest } = body;
        if ([set, reps, load, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, load, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), rest: Number(rest) };
        break;
      }
      case 'reps-load-time': {
        const { reps, load, time } = body;
        if ([reps, load, time].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: reps, load, time', 400);
        payload = { ...payload, reps: Number(reps), load: Number(load), time: Number(time) };
        break;
      }
      case 'complete-set': {
        const { set, reps, load, time, rest } = body;
        if ([set, reps, load, time, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, load, time, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), time: Number(time), rest: Number(rest) };
        break;
      }
      case 'reps-time': {
        const { set, reps, time, rest } = body;
        if ([set, reps, time, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, time, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), time: Number(time), rest: Number(rest) };
        break;
      }
      case 'cadence': {
        const { cadence } = body;
        if (!cadence) throw new AppError('Campo obrigatório: cadence', 400);
        payload = { ...payload, cadence: String(cadence) };
        break;
      }
      case 'notes': {
        const { notes } = body;
        if (!notes) throw new AppError('Campo obrigatório: notes', 400);
        payload = { ...payload, notes: String(notes) };
        break;
      }
      case 'running': {
        const { speed, distance, time, pace, rest } = body;
        if (rest === undefined) throw new AppError('Campo obrigatório: rest', 400);
        payload = { 
          ...payload, 
          speed: speed ? Number(speed) : null,
          distance: distance ? Number(distance) : null,
          time: time ? Number(time) : null,
          pace: pace ? String(pace) : null,
          rest: Number(rest)
        };
        break;
      }
      case 'time-incline': {
        const { time, incline, rest } = body;
        if ([time, incline, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: time, incline, rest', 400);
        payload = { ...payload, time: Number(time), incline: Number(incline), rest: Number(rest) };
        break;
      }
    }

    const [row] = await knex(table).insert(payload).returning('*');
    return res.status(201).json({ 
      ...row, 
      type: repType,
      message: `Repetição criada automaticamente como tipo: ${repType}` 
    });
  }

  // Métodos específicos para cada tipo de repetição
  
  /**
   * @swagger
   * /repetitions/running:
   *   post:
   *     summary: Criar repetição de corrida
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, rest]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               speed:
   *                 type: number
   *                 example: 10.5
   *               distance:
   *                 type: number
   *                 example: 5000
   *               time:
   *                 type: number
   *                 example: 1800
   *               pace:
   *                 type: string
   *                 example: "5:30"
   *               rest:
   *                 type: number
   *                 example: 120
   *     responses:
   *       201:
   *         description: Repetição de corrida criada com sucesso
   */
  async createRunning(req: Request, res: Response): Promise<Response> {
    req.params.type = 'running';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/cadence:
   *   post:
   *     summary: Criar repetição de cadência
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, cadence]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               cadence:
   *                 type: string
   *                 example: "2-1-2-1"
   *     responses:
   *       201:
   *         description: Repetição de cadência criada com sucesso
   */
  async createCadence(req: Request, res: Response): Promise<Response> {
    req.params.type = 'cadence';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/notes:
   *   post:
   *     summary: Criar repetição com observações
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, notes]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               notes:
   *                 type: string
   *                 example: "Observações sobre o exercício"
   *     responses:
   *       201:
   *         description: Repetição com observações criada com sucesso
   */
  async createNotes(req: Request, res: Response): Promise<Response> {
    req.params.type = 'notes';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/time-incline:
   *   post:
   *     summary: Criar repetição tempo-inclinação
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, time, incline, rest]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               time:
   *                 type: number
   *                 example: 600
   *               incline:
   *                 type: number
   *                 example: 5.5
   *               rest:
   *                 type: number
   *                 example: 60
   *     responses:
   *       201:
   *         description: Repetição tempo-inclinação criada com sucesso
   */
  async createTimeIncline(req: Request, res: Response): Promise<Response> {
    req.params.type = 'time-incline';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/reps-load:
   *   post:
   *     summary: Criar repetição reps-load
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, set, reps, load, rest]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               set:
   *                 type: number
   *                 example: 3
   *               reps:
   *                 type: number
   *                 example: 12
   *               load:
   *                 type: number
   *                 example: 50
   *               rest:
   *                 type: number
   *                 example: 60
   *     responses:
   *       201:
   *         description: Repetição reps-load criada com sucesso
   */
  async createRepsLoad(req: Request, res: Response): Promise<Response> {
    req.params.type = 'reps-load';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/reps-load-time:
   *   post:
   *     summary: Criar repetição reps-load-time
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, reps, load, time]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               reps:
   *                 type: number
   *                 example: 12
   *               load:
   *                 type: number
   *                 example: 50
   *               time:
   *                 type: number
   *                 example: 30
   *     responses:
   *       201:
   *         description: Repetição reps-load-time criada com sucesso
   */
  async createRepsLoadTime(req: Request, res: Response): Promise<Response> {
    req.params.type = 'reps-load-time';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/complete-set:
   *   post:
   *     summary: Criar repetição complete-set
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, set, reps, load, time, rest]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               set:
   *                 type: number
   *                 example: 3
   *               reps:
   *                 type: number
   *                 example: 12
   *               load:
   *                 type: number
   *                 example: 50
   *               time:
   *                 type: number
   *                 example: 30
   *               rest:
   *                 type: number
   *                 example: 60
   *     responses:
   *       201:
   *         description: Repetição complete-set criada com sucesso
   */
  async createCompleteSet(req: Request, res: Response): Promise<Response> {
    req.params.type = 'complete-set';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/reps-time:
   *   post:
   *     summary: Criar repetição reps-time
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [exercise_id, set, reps, time, rest]
   *             properties:
   *               exercise_id:
   *                 type: number
   *                 example: 1
   *               set:
   *                 type: number
   *                 example: 3
   *               reps:
   *                 type: number
   *                 example: 12
   *               time:
   *                 type: number
   *                 example: 30
   *               rest:
   *                 type: number
   *                 example: 60
   *     responses:
   *       201:
   *         description: Repetição reps-time criada com sucesso
   */
  async createRepsTime(req: Request, res: Response): Promise<Response> {
    req.params.type = 'reps-time';
    return this.create(req, res);
  }

  /**
   * @swagger
   * /repetitions/exercise-training/{id}/load:
   *   patch:
   *     summary: Registrar ajuste de carga feito pelo aluno (não sobrescreve o original)
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do exercise_training
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [load, student_id]
   *             properties:
   *               load:
   *                 type: number
   *                 example: 55.5
   *                 description: Nova carga ajustada pelo aluno
   *               student_id:
   *                 type: number
   *                 example: 1
   *                 description: ID do aluno que fez o ajuste
   *     responses:
   *       200:
   *         description: Ajuste registrado com sucesso
   *       400:
   *         description: Dados inválidos
   *       404:
   *         description: Registro não encontrado
   */
  /**
   * @swagger
   * /repetitions/load-adjustments/trainer:
   *   get:
   *     summary: Buscar ajustes de peso recentes dos alunos do personal
   *     tags: [Repetitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *       - in: query
   *         name: days
   *         schema:
   *           type: number
   *         description: Número de dias para buscar ajustes (padrão 7)
   *     responses:
   *       200:
   *         description: Lista de ajustes de peso dos alunos
   */
  async getTrainerStudentsAdjustments(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const days = Number(req.query.days) || 7;
    const startDate = moment().subtract(days, 'days').tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    // Buscar todos os alunos do personal
    const students = await knex('students')
      .select('students.id', 'students.name')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .where('trainers.admin_id', admin_id);

    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return res.json({ adjustments: [] });
    }

    // Buscar ajustes de peso dos últimos X dias
    const adjustments = await knex('student_load_adjustments as sla')
      .select(
        'sla.id',
        'sla.student_id',
        'sla.exercise_training_id',
        'sla.original_load',
        'sla.adjusted_load',
        'sla.created_at',
        'students.name as student_name',
        'exercises.name as exercise_name',
        'exercise_trainings.exercise_id'
      )
      .leftJoin('students', 'sla.student_id', 'students.id')
      .leftJoin('exercise_trainings', 'sla.exercise_training_id', 'exercise_trainings.id')
      .leftJoin('exercises', 'exercise_trainings.exercise_id', 'exercises.id')
      .whereIn('sla.student_id', studentIds)
      .where('sla.created_at', '>=', startDate)
      .orderBy('sla.created_at', 'desc');

    // Agrupar por aluno e calcular estatísticas
    const adjustmentsByStudent: Record<number, any> = {};
    
    adjustments.forEach(adj => {
      if (!adjustmentsByStudent[adj.student_id]) {
        adjustmentsByStudent[adj.student_id] = {
          student_id: adj.student_id,
          student_name: adj.student_name,
          total_adjustments: 0,
          increased: 0,
          decreased: 0,
          maintained: 0,
          adjustments: []
        };
      }

      const diff = adj.adjusted_load - adj.original_load;
      adjustmentsByStudent[adj.student_id].total_adjustments++;
      
      if (diff > 0) adjustmentsByStudent[adj.student_id].increased++;
      else if (diff < 0) adjustmentsByStudent[adj.student_id].decreased++;
      else adjustmentsByStudent[adj.student_id].maintained++;

      adjustmentsByStudent[adj.student_id].adjustments.push({
        id: adj.id,
        exercise_name: adj.exercise_name,
        original_load: adj.original_load,
        adjusted_load: adj.adjusted_load,
        difference: diff,
        created_at: adj.created_at
      });
    });

    const result = Object.values(adjustmentsByStudent);

    return res.json({ 
      adjustments: result,
      summary: {
        total_students_with_adjustments: result.length,
        total_adjustments: adjustments.length,
        period_days: days
      }
    });
  }

  async updateExerciseTrainingLoad(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;
    
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const { load, student_id } = req.body as any;
    const newLoad = Number(load);
    const studentId = Number(student_id);
    
    if (load === undefined || isNaN(newLoad)) throw new AppError('Campo load é obrigatório e deve ser numérico', 400);
    if (!student_id || isNaN(studentId)) throw new AppError('Campo student_id é obrigatório', 400);

    const exerciseTraining = await knex('exercise_trainings')
      .where({ 'exercise_trainings.id': id, 'exercise_trainings.admin_id': admin_id })
      .first();

    if (!exerciseTraining) throw new AppError('Registro não encontrado', 404);

    const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
    const originalLoad = exerciseTraining.default_load || 0;

    // Criar ou atualizar tabela de ajustes (student_load_adjustments)
    // Verifica se já existe um ajuste para este aluno neste exercise_training
    const existingAdjustment = await knex('student_load_adjustments')
      .where({ 
        exercise_training_id: id, 
        student_id: studentId 
      })
      .orderBy('created_at', 'desc')
      .first();

    // Inserir novo registro de ajuste
    const [adjustment] = await knex('student_load_adjustments')
      .insert({
        exercise_training_id: id,
        student_id: studentId,
        original_load: originalLoad,
        adjusted_load: newLoad,
        adjustment_reason: 'student_modification',
        created_at: now,
      })
      .returning('*');

    return res.status(200).json({ 
      message: 'Ajuste de carga registrado com sucesso',
      adjustment: adjustment,
      original_load: originalLoad,
      adjusted_load: newLoad,
      difference: newLoad - originalLoad
    });
  }
}

export default new RepetitionsController();
