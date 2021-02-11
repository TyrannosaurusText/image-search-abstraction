const port = process.env.PORT || 3000;
const express = require('express')
const app = express()
const axios = require('axios');
require('dotenv').config();
const connectionInfo = process.env.NODE_ENV === 'production' ? {
  connectionString: process.env.PGURL,
} : {
    user: process.env.PGHOST,
    database: process.env.PGDATABASE,
    host: process.env.PGHOSTADDR,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  }

const connectToDatabase = () => {
  try {
    const client = new Client(connectionInfo);
    client.connect()
    return client;
  }
  catch (e) {
    console.log("Could not connect to database.");
  }
}

const maintainTable = () => {
  const client = connectToDatabase();
  client.query(`
  SELECT COUNT(*) FROM recentsearch WHERE id IN (SELECT id FROM recentsearch ORDER BY id DESC LIMIT 100 OFFSET 100);
  `, (err, result) => {
    if (err) console.log(err)
    client.end();
    if (result.rows[0].count >= 100) {
      const client = connectToDatabase();
      client.query(`
      DELETE FROM recentsearch WHERE id IN (SELECT id FROM recentsearch ORDER BY id DESC LIMIT 100 OFFSET 100);
      `, (err, result) => {
        client.end();
      })
    }
  })
}

const getImg = (item) => {
  return {
    type: item.mime,
    width: item.image.width,
    height: item.image.height,
    size: item.image.byteSize,
    url: item.link,
    thumbnail: {
      url: item.image.thumbnailLink,
      height: item.image.thumbnailHeight,
      width: item.image.thumbnailWidth,
    },
    description: item.title,
    parentPage: item.contextLink,
  };
};


app.listen(port)

app.get('/query/:searchterm', (req, res) => {
  const url = "https://www.googleapis.com/customsearch/v1?";
  const key = process.env.GOOGLE_SEARCH_API;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const q = req.params.searchterm;
  const qs = req.query.page || 1;
  axios({
    method: "get",
    url: url,
    params: {
      key: key,
      cx: cx,
      q: q,
      searchType: "image",
      safe: "active",
      start: 10 * (qs - 1),
    },
  }).then(response => {
    const data = response.data.items;
    const result = data.map((item) => getImg(item));
    res.send(JSON.stringify(result, 2));

  }).catch(err => {
    console.log(err);
  });


  const client = connectToDatabase();
  client.query(`INSERT INTO recentsearch(query) VALUES ('${q}');`, (err, result) => {
    client.end();
    if (err) res.send(err);
  });

  maintainTable();

})
const { Client } = require('pg');

app.get('/recent', (req, res) => {
  const client = connectToDatabase();
  client.query('SELECT query, timestamp FROM recentsearch;', (err, result) => {
    client.end();
    if (err) res.send(err);
    res.send(result.rows);
  })
})

app.get('/makeTable', (req, res) => {
  const client = connectToDatabase();
  client.query(`
  CREATE TABLE IF NOT EXISTS recentsearch (
    Id serial primary key, 
    Timestamp timestamptz NOT NULL DEFAULT NOW(), 
    Query text NOT NULL
    );`
    , (err) => {
      client.end();
      if (err) res.send(err);
      res.send("Cannot GET /makeTab");
    })
})