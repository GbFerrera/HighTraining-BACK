exports.up = function(knex) {
  return knex.schema.table('students', function(table) {
    table.text('description').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('students', function(table) {
    table.dropColumn('description');
  });
};
