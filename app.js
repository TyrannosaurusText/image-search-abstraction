const http = require('http');
const mysql = require('mysql');
const hostname = '127.0.0.1';
const port = 3000;
const express = require('express')

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/query', (req, res) => {

})

app.get('/recent', async (req, res) => {
  var mysql = require('mysql');
  var connection = mysql.createConnection({
    // host: process.env.DB_HOST,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,
    host: 'localhost',
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    // port: '/var/run/mysqld/mysqld.sock',

  });
  connection.connect();
  connection.query(`SELECT * FROM \`recentsearches\` ORDER BY TIMESTAMP ASC LIMIT 90`, function (error, results, fields) {
    if (error) {
      console.log(error);
    };
    console.log(results);
    res.body = (error, results, fields)
    res.send(results + error + fields);
  });
  connection.end();
})