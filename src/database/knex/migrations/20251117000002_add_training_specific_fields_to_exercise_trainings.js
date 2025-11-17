/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('exercise_trainings', function(table) {
    table.integer('sets').nullable().comment('Número de séries para este exercício neste treino');
    table.integer('reps').nullable().comment('Número de repetições para este exercício neste treino');
    table.integer('rest_time').nullable().comment('Tempo de descanso em segundos');
    table.integer('order').nullable().comment('Ordem do exercício no treino');
    table.text('notes').nullable().comment('Observações específicas para este exercício neste treino');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('exercise_trainings', function(table) {
    table.dropColumn('sets');
    table.dropColumn('reps');
    table.dropColumn('rest_time');
    table.dropColumn('order');
    table.dropColumn('notes');
  });
};
