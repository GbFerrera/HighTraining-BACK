/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('student_statistics', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
    table.integer('student_id').unsigned().notNullable();
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.decimal('weight', 10, 2);
    table.decimal('height', 10, 2);
    table.decimal('muscle_mass_percentage', 5, 2);
    table.text('notes');
    table.decimal('shoulder', 10, 2);
    table.decimal('chest', 10, 2);
    table.decimal('left_arm', 10, 2);
    table.decimal('right_arm', 10, 2);
    table.decimal('left_forearm', 10, 2);
    table.decimal('right_forearm', 10, 2);
    table.decimal('wrist', 10, 2);
    table.decimal('waist', 10, 2);
    table.decimal('abdomen', 10, 2);
    table.decimal('hip', 10, 2);
    table.decimal('left_thigh', 10, 2);
    table.decimal('right_thigh', 10, 2);
    table.decimal('left_calf', 10, 2);
    table.decimal('right_calf', 10, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('student_statistics');
};
