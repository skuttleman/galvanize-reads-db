exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('authors', function(table) {
      table.increments('id');
      table.string('first_name');
      table.string('last_name');
      table.string('middle_initial', 1);
      table.text('biography');
      table.string('portrait_url');
    }),
    knex.schema.createTable('genres', function(table) {
      table.increments('id');
      table.string('name');
    })
  ]).then(function() {
    return knex.schema.createTable('books', function(table) {
      table.increments('id');
      table.string('title');
      table.text('description');
      table.string('cover_url');
      table.integer('genre_id').references('id').inTable('genres').onDelete('CASCADE');
    });
  }).then(function() {
    return knex.schema.createTable('book_authors', function(table) {
      table.integer('author_id').references('id').inTable('authors').onDelete('CASCADE');
      table.integer('book_id').references('id').inTable('books').onDelete('CASCADE');
      table.primary(['author_id', 'book_id']);
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('book_authors').then(function() {
    return knex.schema.dropTableIfExists('books');
  }).then(function() {
    return Promise.all([
      knex.schema.dropTableIfExists('genres'),
      knex.schema.dropTableIfExists('authors')
    ]);
  });
};
