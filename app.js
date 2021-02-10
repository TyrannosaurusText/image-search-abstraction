const http = require('http');
const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
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
const { Client } = require('pg');

app.get('/recent', async (req, res) => {
  const client = new Client({
    connectionString: 'postgres://wjmjnyeqafhmiy:30c5f277ccd26388a901871dafcf3764f8dad9a5d99a0b402f2dca5a6362eeb4@ec2-35-174-118-71.compute-1.amazonaws.com:5432/d5794lsus7ddne',
  })
  client.connect()
  client.query('SELECT NOW()', (err, result) => {
    console.log(err, result);
    client.end();
    if (err) res.send(err);
    res.send(result);
  })
})