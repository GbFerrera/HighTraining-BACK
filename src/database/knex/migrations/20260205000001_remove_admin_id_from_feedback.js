exports.up = function(knex) {
  return knex.schema.table('feedback', function(table) {
    table.dropForeign('admin_id');
    table.dropColumn('admin_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('feedback', function(table) {
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
  });
};
