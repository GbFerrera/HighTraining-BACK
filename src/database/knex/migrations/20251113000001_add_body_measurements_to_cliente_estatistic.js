/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('cliente_estatistic', function(table) {
    // Medidas corporais
    table.decimal('ombro', 10, 2);
    table.decimal('torax', 10, 2);
    table.decimal('braco_esquerdo', 10, 2);
    table.decimal('braco_direito', 10, 2);
    table.decimal('antebraco_esquerdo', 10, 2);
    table.decimal('antebraco_direito', 10, 2);
    table.decimal('punho', 10, 2);
    table.decimal('cintura', 10, 2);
    table.decimal('abdome', 10, 2);
    table.decimal('quadril', 10, 2);
    table.decimal('coxa_esquerda', 10, 2);
    table.decimal('coxa_direita', 10, 2);
    table.decimal('panturrilha_esquerda', 10, 2);
    table.decimal('panturrilha_direita', 10, 2);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('cliente_estatistic', function(table) {
    table.dropColumn('ombro');
    table.dropColumn('torax');
    table.dropColumn('braco_esquerdo');
    table.dropColumn('braco_direito');
    table.dropColumn('antebraco_esquerdo');
    table.dropColumn('antebraco_direito');
    table.dropColumn('punho');
    table.dropColumn('cintura');
    table.dropColumn('abdome');
    table.dropColumn('quadril');
    table.dropColumn('coxa_esquerda');
    table.dropColumn('coxa_direita');
    table.dropColumn('panturrilha_esquerda');
    table.dropColumn('panturrilha_direita');
  });
};
