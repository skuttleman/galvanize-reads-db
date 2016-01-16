try {
  require('dotenv').load();
} catch(err) {
  console.error(err);
}

var knex = require('knex');
var config = require('../knexfile');
var environment = process.env.NODE_ENV || 'development';
module.exports = knex(config[environment]);
