try {
  require('dotenv').load();
} catch(err) {
  console.error(err);
}

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL_DEVELOPMENT
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL_PRODUCTION
  }
};
