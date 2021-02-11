const port = process.env.PORT || 3000;
const express = require('express')
const app = express()
const axios = require('axios');
const rateLimit = require("express-rate-limit");

//10 request per day
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100
});

app.use(limiter);

app.get("/", (req, res) => {
  res.status(403).send("Forbbiden");
})


require('dotenv').config();
const connectionInfo = process.env.NODE_ENV === 'production' ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
    user: process.env.PGHOST,
    database: process.env.PGDATABASE,
    host: process.env.PGHOSTADDR,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  }

console.log(connectionInfo, process.env.NODE_ENV, process.env.PGURL);

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
    if (result !== undefined && result.rows[0].count >= 100) {
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
    res.send(JSON.stringify(result));

  }).catch(err => {
    console.log(err);
  });


  const client = connectToDatabase();
  client.query(`INSERT INTO recentsearch(query) VALUES ('${q}');`, (err, result) => {
    client.end();
    if (err) console.log(err);
  });

  maintainTable();

})
const { Client } = require('pg');

app.get('/recent', (req, res) => {
  const client = connectToDatabase();
  client.query('SELECT query, timestamp FROM recentsearch;', (err, result) => {
    client.end();
    if (err) {
      res.send(err)
      return
    };
    if (result === undefined) {
      console.log(err);
      console.log(result);
      res.send(result);
      return
    }

    res.send(result.rows);
  })
})