exports.up = function(knex) {
  return knex.schema.createTable('push_tokens', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.text('user_type').notNullable();
    table.string('push_token').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  })
  .then(() => knex.raw("ALTER TABLE push_tokens ADD CONSTRAINT push_tokens_user_type_check CHECK (user_type = ANY (ARRAY['trainer','student']))"))
  .then(() => knex.raw('CREATE UNIQUE INDEX "push_tokens_user_id_user_type_unique" ON push_tokens (user_id, user_type)'))
  .then(() => knex.raw('CREATE INDEX "push_tokens_push_token_index" ON push_tokens USING btree (push_token)'))
  .then(() => knex.raw('CREATE INDEX "push_tokens_user_id_user_type_index" ON push_tokens USING btree (user_id, user_type)'));
};

exports.down = function(knex) {
  return knex.schema.dropTable('push_tokens');
};

