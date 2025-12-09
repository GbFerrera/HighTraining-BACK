exports.up = function(knex) {
  return knex.schema.createTable('trainer_social_media', function(table) {
    table.increments('id').primary();
    table.integer('trainer_id').unsigned().notNullable();
    table.foreign('trainer_id').references('id').inTable('trainers').onDelete('CASCADE');
    table.string('platform', 50).notNullable();
    table.string('username', 255).notNullable();
    table.string('url', 500);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['trainer_id']);
    table.unique(['trainer_id', 'platform']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trainer_social_media');
};

