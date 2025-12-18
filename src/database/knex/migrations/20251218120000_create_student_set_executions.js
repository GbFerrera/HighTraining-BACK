exports.up = function(knex) {
  return knex.schema.createTable('student_set_executions', function(table) {
    table.increments('id').primary();
    table.integer('student_id').unsigned().notNullable();
    table.integer('exercise_training_id').unsigned().notNullable();
    table.integer('training_id').unsigned().notNullable();
    table.date('execution_date').notNullable();
    table.integer('set_number').notNullable(); // Número da série (1, 2, 3, etc)
    table.integer('reps_completed').nullable(); // Repetições completadas
    table.decimal('load_used', 10, 2).nullable(); // Carga utilizada em kg
    table.integer('rest_time').nullable(); // Tempo de descanso em segundos
    table.text('notes').nullable(); // Observações do aluno
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.foreign('exercise_training_id').references('id').inTable('exercise_trainings').onDelete('CASCADE');
    table.foreign('training_id').references('id').inTable('trainings').onDelete('CASCADE');
    
    // Índices para otimizar buscas
    table.index(['student_id', 'execution_date']);
    table.index(['exercise_training_id', 'execution_date']);
    table.index(['training_id', 'execution_date']);
    
    // Índice único para evitar duplicatas de série no mesmo dia
    table.unique(['student_id', 'exercise_training_id', 'execution_date', 'set_number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_set_executions');
};
