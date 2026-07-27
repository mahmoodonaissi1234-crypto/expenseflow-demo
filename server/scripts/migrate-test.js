require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.test') });
require('../src/db/migrate.js');
