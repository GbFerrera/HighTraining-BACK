exports.up = function(knex) {
  return knex.schema.table('trainers', function(table) {
    table.string('instagram').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('trainers', function(table) {
    table.dropColumn('instagram');
  });
};
