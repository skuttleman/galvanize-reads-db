var knex = require('../db/knex');
var fs = require('fs');

exports.seed = function(knex, Promise) {
  if (true) {
    return getSeedData(__dirname + '/data.csv').then(function(data) {
      return Promise.all(data.genres.map(addGenre)).then(function(genres) {
        return Promise.all(data.books.map(addBook)).then(function(books) {
          return Promise.all(data.authors.map(addAuthor)).then(function(authors) {
            return Promise.resolve({ books: books, authors: authors});
          });
        });
      }).then(function(records) {
        return addBookAuthors(data.books, records.books, records.authors);
      });
    });
  }
};

function addAuthor(author) {
  var firstName = author.first_name.split(' ')[0];
  var middleInitial = (author.first_name.split(' ')[1] || '').replace('.', '');
  return knex('authors').returning('*').insert({
    first_name: firstName,
    last_name: author.last_name,
    middle_initial: middleInitial,
    biography: author.biography,
    portrait_url: author.portrait_url
  }).then(function(authors) {
    return Promise.resolve(authors[0]);
  });
}

function addGenre(name) {
  return knex('genres').insert({ name: name });
}

function addBook(book) {
  return knex('genres').where({ name: book.genre }).then(function(genres) {
    return knex('books').returning('*').insert({
      title: book.title,
      description: book.description,
      cover_url: book.cover_url,
      genre_id: genres[0].id
    });
  }).then(function(books) {
    return Promise.resolve(books[0]);
  });
}

function addBookAuthors(dataBooks, books, authors) {
  var promiseStack = dataBooks.reduce(function(promises, book) {
    var dbBook = books.filter(function(eachBook) {
      return eachBook.title == book.title;
    })[0];
    var innerPromises = book.authors.map(function(author) {
      var dbAuthor = authors.filter(function(eachAuthor) {
        return eachAuthor.last_name == author.last_name;
      })[0];
      return knex('book_authors').insert({
        book_id: dbBook.id,
        author_id: dbAuthor.id
      });
    });
    promises.push(Promise.all(innerPromises));
    return promises;
  }, []);
  return Promise.all(promiseStack);
}

function getOrCreateGenre(name) {
  return knex('genres').where({ name: name }).then(function(genres) {
    if (genres.length) {
      return Promise.resolve(genres);
    } else {
      return knex('genres').returning('*').insert({ name: name });
    }
  });
}





function getSeedData(file) {
  return new Promise(function(resolve, reject) {
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        console.error(err);
        return reject(err);
      }
      var table = parse(data);
      var books = getBooks(table);
      var authors = getAuthors(table);
      var genres = table.map(function(record) {
        return record['book genre'];
      });
      for (var i = 0; i < genres.length;) {
        if (genres.slice(i + 1).indexOf(genres[i]) + 1) {
          genres.splice(i, 1);
        } else {
          i++;
        }
      }
      resolve({ books: books, authors: authors, genres: genres });
    });
  });
}

function parse(data) {
  var lines = data.split('\n');
  var keys = lines.shift().split(/(,)(?=(?:[^"]|"[^"]*")*$)/);
  lines.pop();
  return lines.map(function(line) {
    line = line.split(/(,)(?=(?:[^"]|"[^"]*")*$)/);
    return line.reduce(function(newLine, cell, i) {
      newLine[keys[i].toLowerCase()] = cell.replace(/"/g, '');
      return newLine;
    }, {});
  });
}

function getRelevant(table, query) {
  return table.map(function(record) {
    var keys = Object.keys(record).filter(function(key) {
      return key.match(query);
    });
    return keys.reduce(function(item, key) {
      var newKey = key.replace(query, '').replace(/\s/g, '_');
      item[newKey] = record[key];
      return item;
    }, {});
  });
}

function getBooks(table) {
  var books = getRelevant(table, /^book /i);
  books.forEach(function(book, i) {
    book.authors = getAuthors([table[i]]);
  });
  return books;
}

function getAuthors(table) {
  records = getRelevant(table, /^author /i);
  return [/^1_/, /^2_/, /^3_/].reduce(function(authors, pattern) {
    records.forEach(function(record) {
      var keys = Object.keys(record).filter(function(key) {
        return key.match(pattern);
      });
      var author = keys.reduce(function(author, key) {
        var newKey = key.replace(pattern, '');
        author[newKey] = record[key];
        return author;
      }, {});
      var alreadyListed = authors.filter(function(listed) {
        return author.first_name == listed.first_name &&
          author.last_name == listed.last_name;
      }).length;
      if (!alreadyListed && author.first_name && author.last_name) {
        authors.push(author);
      }
    });
    return authors;
  }, []);
}
