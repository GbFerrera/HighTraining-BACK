exports.up = function(knex) {
  return knex.schema.createTable('student_load_adjustments', function(table) {
    table.increments('id').primary();
    table.integer('exercise_training_id').unsigned().notNullable();
    table.integer('student_id').unsigned().notNullable();
    table.decimal('original_load', 10, 2).nullable();
    table.decimal('adjusted_load', 10, 2).notNullable();
    table.string('adjustment_reason', 255).defaultTo('student_modification');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('exercise_training_id').references('id').inTable('exercise_trainings').onDelete('CASCADE');
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    
    // Index para buscar ajustes de um aluno em um exercício específico
    table.index(['exercise_training_id', 'student_id']);
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_load_adjustments');
};
