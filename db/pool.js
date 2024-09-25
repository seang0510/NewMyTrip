const mysql = require('mysql2/promise');

const dbInfo = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    insecureAuth: true,
    connectionLimit: process.env.DB_CONN_LIMIT,
};

const pool = mysql.createPool(dbInfo);

module.exports = pool;