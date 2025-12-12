import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

class TrainingRoutinesController {
  /**
   * @swagger
   * /training-routines:
   *   post:
   *     summary: Create training routine
   *     tags: [Training Routines]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [student_id, start_date, end_date, routine_type, goal, difficulty]
   *             properties:
   *               student_id:
   *                 type: integer
   *               trainer_id:
   *                 type: integer
   *               start_date:
   *                 type: string
   *                 format: date
   *               end_date:
   *                 type: string
   *                 format: date
   *               routine_type:
   *                 type: string
   *               goal:
   *                 type: string
   *               difficulty:
   *                 type: string
   *               instructions:
   *                 type: string
   *               hide_after_expiration:
   *                 type: boolean
   *               hide_before_start:
   *                 type: boolean
   */
  async create(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const {
      student_id,
      trainer_id,
      start_date,
      end_date,
      routine_type,
      goal,
      difficulty,
      instructions,
      hide_after_expiration,
      hide_before_start,
    } = req.body as any;

    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    if (!student_id || !start_date || !end_date || !routine_type || !goal || !difficulty) {
      throw new AppError('Campos obrigatórios: student_id, start_date, end_date, routine_type, goal, difficulty', 400);
    }

    // Validação de routine_type
    const validRoutineTypes = ['Dia da semana', 'Numérico'];
    if (!validRoutineTypes.includes(routine_type)) {
      throw new AppError('routine_type deve ser "Dia da semana" ou "Numérico"', 400);
    }

    // Validação de goal
    const validGoals = [
      'Hipertrofia',
      'Redução de gordura',
      'Redução de gordura/hipertrofia',
      'Definição muscular',
      'Condicionamento físico',
      'Qualidade de vida'
    ];
    if (!validGoals.includes(goal)) {
      throw new AppError('goal deve ser um dos seguintes: Hipertrofia, Redução de gordura, Redução de gordura/hipertrofia, Definição muscular, Condicionamento físico, Qualidade de vida', 400);
    }

    // Validação de difficulty
    const validDifficulties = ['Adaptação', 'Iniciante', 'Intermediário', 'Avançado'];
    if (!validDifficulties.includes(difficulty)) {
      throw new AppError('difficulty deve ser um dos seguintes: Adaptação, Iniciante, Intermediário, Avançado', 400);
    }

    const admin = await knex('admins').where({ id: admin_id }).first();
    if (!admin) throw new AppError('Admin não encontrado', 404);

    if (trainer_id) {
      const trainer = await knex('trainers').where({ id: trainer_id, admin_id }).first();
      if (!trainer) throw new AppError('Treinador não encontrado', 404);
    }

    const student = await knex('students')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .where({ 'students.id': student_id })
      .andWhere('trainers.admin_id', admin_id)
      .first();
    if (!student) throw new AppError('Cliente não encontrado', 404);

    const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    const [routine] = await knex('training_routines')
      .insert({
        admin_id,
        trainer_id: trainer_id || null,
        student_id,
        start_date,
        end_date,
        routine_type,
        goal,
        difficulty,
        instructions: instructions || null,
        hide_after_expiration: hide_after_expiration !== undefined ? hide_after_expiration : false,
        hide_before_start: hide_before_start !== undefined ? hide_before_start : false,
        created_at: now,
        updated_at: now,
      })
      .returning(['*']);

    return res.status(201).json(routine);
  }

  /**
   * @swagger
   * /training-routines:
   *   get:
   *     summary: List training routines
   *     tags: [Training Routines]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: student_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: trainer_id
   *         schema:
   *           type: integer
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { student_id, trainer_id } = req.query as any;

    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    let query = knex('training_routines')
      .select(
        'training_routines.*',
        'students.name as student_name',
        'trainers.name as trainer_name'
      )
      .leftJoin('students', 'training_routines.student_id', 'students.id')
      .leftJoin('trainers', 'training_routines.trainer_id', 'trainers.id')
      .where('training_routines.admin_id', admin_id);

    if (student_id) query = query.where('training_routines.student_id', student_id);
    if (trainer_id) query = query.where('training_routines.trainer_id', trainer_id);

    const rows = await query.orderBy('training_routines.start_date', 'desc');
    return res.json(rows);
  }

  /**
   * @swagger
   * /training-routines/{id}:
   *   get:
   *     summary: Get training routine by ID
   *     tags: [Training Routines]
   */
  async show(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { id } = req.params;
    if (!admin_id || !id) throw new AppError('É necessário enviar os IDs', 400);

    const row = await knex('training_routines')
      .select(
        'training_routines.*',
        'students.name as student_name',
        'trainers.name as trainer_name'
      )
      .leftJoin('students', 'training_routines.student_id', 'students.id')
      .leftJoin('trainers', 'training_routines.trainer_id', 'trainers.id')
      .where({ 'training_routines.id': id, 'training_routines.admin_id': admin_id })
      .first();

    if (!row) throw new AppError('Registro não encontrado', 404);
    return res.json(row);
  }

  /**
   * @swagger
   * /training-routines/{id}:
   *   put:
   *     summary: Update training routine
   *     tags: [Training Routines]
   */
  async update(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { id } = req.params;
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const existing = await knex('training_routines').where({ id, admin_id }).first();
    if (!existing) throw new AppError('Registro não encontrado', 404);

    const {
      student_id,
      trainer_id,
      start_date,
      end_date,
      routine_type,
      goal,
      difficulty,
      instructions,
      hide_after_expiration,
      hide_before_start,
    } = req.body as any;

    // Validação de routine_type
    if (routine_type !== undefined) {
      const validRoutineTypes = ['Dia da semana', 'Numérico'];
      if (!validRoutineTypes.includes(routine_type)) {
        throw new AppError('routine_type deve ser "Dia da semana" ou "Numérico"', 400);
      }
    }

    // Validação de goal
    if (goal !== undefined) {
      const validGoals = [
        'Hipertrofia',
        'Redução de gordura',
        'Redução de gordura/hipertrofia',
        'Definição muscular',
        'Condicionamento físico',
        'Qualidade de vida'
      ];
      if (!validGoals.includes(goal)) {
        throw new AppError('goal deve ser um dos seguintes: Hipertrofia, Redução de gordura, Redução de gordura/hipertrofia, Definição muscular, Condicionamento físico, Qualidade de vida', 400);
      }
    }

    // Validação de difficulty
    if (difficulty !== undefined) {
      const validDifficulties = ['Adaptação', 'Iniciante', 'Intermediário', 'Avançado'];
      if (!validDifficulties.includes(difficulty)) {
        throw new AppError('difficulty deve ser um dos seguintes: Adaptação, Iniciante, Intermediário, Avançado', 400);
      }
    }

    await knex('training_routines')
      .update({
        student_id: student_id !== undefined ? student_id : existing.student_id,
        trainer_id: trainer_id !== undefined ? trainer_id : existing.trainer_id,
        start_date: start_date !== undefined ? start_date : existing.start_date,
        end_date: end_date !== undefined ? end_date : existing.end_date,
        routine_type: routine_type !== undefined ? routine_type : existing.routine_type,
        goal: goal !== undefined ? goal : existing.goal,
        difficulty: difficulty !== undefined ? difficulty : existing.difficulty,
        instructions: instructions !== undefined ? instructions : existing.instructions,
        hide_after_expiration: hide_after_expiration !== undefined ? hide_after_expiration : existing.hide_after_expiration,
        hide_before_start: hide_before_start !== undefined ? hide_before_start : existing.hide_before_start,
        updated_at: moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'),
      })
      .where({ id, admin_id });

    const updated = await knex('training_routines')
      .select(
        'training_routines.*',
        'students.name as student_name',
        'trainers.name as trainer_name'
      )
      .leftJoin('students', 'training_routines.student_id', 'students.id')
      .leftJoin('trainers', 'training_routines.trainer_id', 'trainers.id')
      .where({ 'training_routines.id': id, 'training_routines.admin_id': admin_id })
      .first();

    return res.status(200).json({ message: 'Registro atualizado com sucesso', routine: updated });
  }

  /**
   * @swagger
   * /training-routines/{id}:
   *   delete:
   *     summary: Delete training routine
   *     tags: [Training Routines]
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { id } = req.params;
    if (!admin_id || !id) throw new AppError('É necessário enviar os IDs', 400);

    const existing = await knex('training_routines').where({ id, admin_id }).first();
    if (!existing) throw new AppError('Registro não encontrado', 404);

    await knex('training_routines').where({ id, admin_id }).delete();
    return res.json({ message: 'Registro excluído com sucesso' });
  }

  /**
   * @swagger
   * /training-routines/student/{student_id}/complete:
   *   get:
   *     summary: Get complete training routines with trainings and exercises for student
   *     tags: [Training Routines]
   *     parameters:
   *       - in: path
   *         name: student_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   */
  async getStudentCompleteRoutines(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { student_id } = req.params;

    if (!admin_id || !student_id) {
      throw new AppError('É necessário enviar o ID do admin e do estudante', 400);
    }

    // Buscar rotinas do estudante
    const routines = await knex('training_routines')
      .select(
        'training_routines.*',
        'students.name as student_name',
        'trainers.name as trainer_name'
      )
      .leftJoin('students', 'training_routines.student_id', 'students.id')
      .leftJoin('trainers', 'training_routines.trainer_id', 'trainers.id')
      .where({
        'training_routines.admin_id': admin_id,
        'training_routines.student_id': student_id
      })
      .orderBy('training_routines.start_date', 'desc');

    // Para cada rotina, buscar os treinos vinculados
    const routinesWithTrainings = await Promise.all(
      routines.map(async (routine) => {
        const trainings = await knex('routine_trainings')
          .select(
            'trainings.*',
            'routine_trainings.order as routine_order',
            'routine_trainings.is_active',
            'routine_trainings.notes as routine_notes'
          )
          .join('trainings', 'routine_trainings.training_id', 'trainings.id')
          .where('routine_trainings.routine_id', routine.id)
          .orderBy('routine_trainings.order', 'asc');

        // Para cada treino, buscar os exercícios vinculados
        const trainingsWithExercises = await Promise.all(
          trainings.map(async (training) => {
            const exercises = await knex('exercise_trainings')
              .select(
                'exercises.*',
                'exercise_trainings.sets',
                'exercise_trainings.reps',
                'exercise_trainings.rest_time',
                'exercise_trainings.order as exercise_order',
                'exercise_trainings.notes as exercise_notes',
                'exercise_trainings.video_url as exercise_video_url'
              )
              .join('exercises', 'exercise_trainings.exercise_id', 'exercises.id')
              .where('exercise_trainings.training_id', training.id)
              .orderBy('exercise_trainings.order', 'asc');

            return {
              ...training,
              exercises
            };
          })
        );

        return {
          ...routine,
          trainings: trainingsWithExercises
        };
      })
    );

    return res.json(routinesWithTrainings);
  }
}

export default new TrainingRoutinesController();
