/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('trainings', function(table) {
    // Remove admin_id foreign key and column
    table.dropForeign('admin_id');
    table.dropColumn('admin_id');
    
    // Remove columns that are no longer needed
    table.dropColumn('duration');
    table.dropColumn('repeticoes');
    table.dropColumn('video_url');
    table.dropColumn('carga');
    
    // Add new column
    table.string('day_of_week');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('trainings', function(table) {
    // Add back admin_id
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
    
    // Add back removed columns
    table.string('duration');
    table.string('repeticoes');
    table.string('video_url');
    table.string('carga');
    
    // Remove day_of_week
    table.dropColumn('day_of_week');
  });
};
