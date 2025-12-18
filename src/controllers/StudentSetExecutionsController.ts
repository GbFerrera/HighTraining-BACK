import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateSetExecutionDTO {
  student_id: number;
  exercise_training_id: number;
  training_id: number;
  execution_date: string;
  set_number: number;
  reps_completed?: number;
  load_used?: number;
  rest_time?: number;
  notes?: string;
}

class StudentSetExecutionsController {
  async create(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const {
      student_id,
      exercise_training_id,
      training_id,
      execution_date,
      set_number,
      reps_completed,
      load_used,
      rest_time,
      notes
    } = req.body as CreateSetExecutionDTO;

    if (!student_id || !exercise_training_id || !training_id || !execution_date || !set_number) {
      throw new AppError('Campos obrigatórios: student_id, exercise_training_id, training_id, execution_date, set_number', 400);
    }

    const student = await knex('students')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .where({ 'students.id': student_id })
      .andWhere('trainers.admin_id', admin_id)
      .first();

    if (!student) throw new AppError('Aluno não encontrado', 404);

    const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    const existing = await knex('student_set_executions')
      .where({
        student_id,
        exercise_training_id,
        execution_date,
        set_number
      })
      .first();

    if (existing) {
      const [updated] = await knex('student_set_executions')
        .where({ id: existing.id })
        .update({
          reps_completed,
          load_used,
          rest_time,
          notes,
          updated_at: now
        })
        .returning('*');

      return res.json(updated);
    }

    const [execution] = await knex('student_set_executions')
      .insert({
        student_id,
        exercise_training_id,
        training_id,
        execution_date,
        set_number,
        reps_completed,
        load_used,
        rest_time,
        notes,
        created_at: now,
        updated_at: now
      })
      .returning('*');

    return res.status(201).json(execution);
  }

  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const { student_id, exercise_training_id, training_id, start_date, end_date } = req.query;

    let query = knex('student_set_executions')
      .select('student_set_executions.*')
      .leftJoin('students', 'student_set_executions.student_id', 'students.id')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .where('trainers.admin_id', admin_id);

    if (student_id) {
      query = query.where('student_set_executions.student_id', student_id);
    }

    if (exercise_training_id) {
      query = query.where('student_set_executions.exercise_training_id', exercise_training_id);
    }

    if (training_id) {
      query = query.where('student_set_executions.training_id', training_id);
    }

    if (start_date) {
      query = query.where('student_set_executions.execution_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('student_set_executions.execution_date', '<=', end_date);
    }

    const executions = await query.orderBy('student_set_executions.execution_date', 'desc')
      .orderBy('student_set_executions.set_number', 'asc');

    return res.json(executions);
  }

  async show(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const { id } = req.params;

    const execution = await knex('student_set_executions')
      .select('student_set_executions.*')
      .leftJoin('students', 'student_set_executions.student_id', 'students.id')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .where({ 'student_set_executions.id': id })
      .andWhere('trainers.admin_id', admin_id)
      .first();

    if (!execution) throw new AppError('Execução não encontrada', 404);

    return res.json(execution);
  }

  async getByTrainingDate(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const { student_id, training_id, execution_date } = req.query;

    if (!student_id || !training_id || !execution_date) {
      throw new AppError('Parâmetros obrigatórios: student_id, training_id, execution_date', 400);
    }

    const executions = await knex('student_set_executions')
      .select('student_set_executions.*', 'exercise_trainings.exercise_id', 'exercises.name as exercise_name')
      .leftJoin('exercise_trainings', 'student_set_executions.exercise_training_id', 'exercise_trainings.id')
      .leftJoin('exercises', 'exercise_trainings.exercise_id', 'exercises.id')
      .leftJoin('students', 'student_set_executions.student_id', 'students.id')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .where({
        'student_set_executions.student_id': student_id,
        'student_set_executions.training_id': training_id,
        'student_set_executions.execution_date': execution_date
      })
      .andWhere('trainers.admin_id', admin_id)
      .orderBy('student_set_executions.exercise_training_id', 'asc')
      .orderBy('student_set_executions.set_number', 'asc');

    const grouped = executions.reduce((acc: any, exec: any) => {
      const key = exec.exercise_training_id;
      if (!acc[key]) {
        acc[key] = {
          exercise_training_id: exec.exercise_training_id,
          exercise_id: exec.exercise_id,
          exercise_name: exec.exercise_name,
          sets: []
        };
      }
      acc[key].sets.push({
        id: exec.id,
        set_number: exec.set_number,
        reps_completed: exec.reps_completed,
        load_used: exec.load_used,
        rest_time: exec.rest_time,
        notes: exec.notes,
        created_at: exec.created_at,
        updated_at: exec.updated_at
      });
      return acc;
    }, {});

    return res.json(Object.values(grouped));
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const { id } = req.params;

    const execution = await knex('student_set_executions')
      .select('student_set_executions.*')
      .leftJoin('students', 'student_set_executions.student_id', 'students.id')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .where({ 'student_set_executions.id': id })
      .andWhere('trainers.admin_id', admin_id)
      .first();

    if (!execution) throw new AppError('Execução não encontrada', 404);

    await knex('student_set_executions').where({ id }).delete();

    return res.status(204).send();
  }

  async getTrainerStudentsPerformance(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const days = Number(req.query.days) || 7;
    const startDate = moment().subtract(days, 'days').tz('America/Sao_Paulo').format('YYYY-MM-DD');

    // Buscar execuções de séries dos alunos do personal
    const executions = await knex('student_set_executions')
      .select(
        'student_set_executions.*',
        'students.name as student_name',
        'exercises.name as exercise_name',
        'trainings.name as training_name',
        'trainings.day_of_week'
      )
      .leftJoin('students', 'student_set_executions.student_id', 'students.id')
      .leftJoin('trainers', 'students.trainer_id', 'trainers.id')
      .leftJoin('exercise_trainings', 'student_set_executions.exercise_training_id', 'exercise_trainings.id')
      .leftJoin('exercises', 'exercise_trainings.exercise_id', 'exercises.id')
      .leftJoin('trainings', 'student_set_executions.training_id', 'trainings.id')
      .where('trainers.admin_id', admin_id)
      .where('student_set_executions.execution_date', '>=', startDate)
      .orderBy('student_set_executions.execution_date', 'desc')
      .orderBy('student_set_executions.student_id', 'asc')
      .orderBy('student_set_executions.exercise_training_id', 'asc')
      .orderBy('student_set_executions.set_number', 'asc');

    // Agrupar por aluno e exercício
    const performanceByStudent: Record<number, any> = {};

    executions.forEach(exec => {
      if (!performanceByStudent[exec.student_id]) {
        performanceByStudent[exec.student_id] = {
          student_id: exec.student_id,
          student_name: exec.student_name,
          total_sets: 0,
          exercises: {}
        };
      }

      const exerciseKey = `${exec.exercise_training_id}_${exec.execution_date}`;
      if (!performanceByStudent[exec.student_id].exercises[exerciseKey]) {
        performanceByStudent[exec.student_id].exercises[exerciseKey] = {
          exercise_training_id: exec.exercise_training_id,
          exercise_name: exec.exercise_name,
          training_name: exec.training_name,
          day_of_week: exec.day_of_week,
          execution_date: exec.execution_date,
          sets: []
        };
      }

      performanceByStudent[exec.student_id].exercises[exerciseKey].sets.push({
        set_number: exec.set_number,
        reps_completed: exec.reps_completed,
        load_used: exec.load_used,
        rest_time: exec.rest_time,
        notes: exec.notes
      });

      performanceByStudent[exec.student_id].total_sets++;
    });

    // Converter para array e formatar exercícios
    const result = Object.values(performanceByStudent).map(student => ({
      ...student,
      exercises: Object.values(student.exercises)
    }));

    return res.json({
      students: result,
      period_days: days,
      total_students: result.length
    });
  }
}

export default new StudentSetExecutionsController();
