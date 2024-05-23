const express = require('express');
const { Client } = require('pg');
const PORT = 3555;

const app = express();
app.use(express.urlencoded());

// CONFIG DATABASE
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
client.connect(function(error) {
  if(error !== null) {
    console.log(error)
  } else {
    console.log("Connected to database !");
  }
})

// ROUTING
// 1. GET LIST API
app.get('/api/article', async function (req, res) {
  const rawData = await client.query(`
      SELECT id, title
      FROM article
  `);
  const data = rawData.rows;
  const count = rawData.rowCount;
  res.status(200).json({ 
    count,
    data
   })
});
// 2. GET DETAIL API
app.get('/api/article/detail/:id', async function (req, res) {
  const id = req.params.id;
  const rawData = await client.query(`
      SELECT title, body
      FROM article
      WHERE id = $1
  `, [id]);
  const data = rawData.rows[0];
  res.status(200).json({ data })
});
// 3. INSERT ARTICLE API
app.post('/api/article/create', async function (req, res) {
  await client.query('BEGIN');
  try {
    const payload = req.body;
    const title = payload.title;
    const body = payload.body;

    const rawData = await client.query(`
        INSERT INTO article (title, body)
        VALUES ($1, $2)
        RETURNING *;
    `, [title, body]);
    const data = rawData.rows[0];

    await client.query('COMMIT');
    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    await client.query('ROLLBACK');
    res.status(500).send('internal server error');
  }
});
// 4. UPDATE ARTICLE API
app.put('/api/article/update/:id', async function (req, res) {
  await client.query('BEGIN');
  try {
    const payload = req.body;
    const id = req.params.id;

    const rawOldData = await client.query(`
        SELECT title, body
        FROM article
        WHERE id = $1
    `, [id]);
    const oldData = rawOldData.rows[0];

    const title = payload.title || oldData.title;
    const body = payload.body || oldData.body;

    const newRawData = await client.query(`
        UPDATE article
        SET title = $1, body = $2
        WHERE id = $3
        RETURNING *
     `, [title, body, id]);
    const newData = newRawData.rows[0];

    await client.query('COMMIT');
    res.status(200).json({ data: newData })
  } catch (error) {
    console.log(error);
    await client.query('ROLLBACK');
    res.status(500).send('internal server error');
  }
});

// 5. Delete article api
app.delete('/api/article/delete/:id',async function (req, res) {
  await client.query('BEGIN');
  try {
    const id = req.params.id;
    await client.query(`
        DELETE FROM article
        WHERE id = $1
    `, [id]);
    await client.query('COMMIT');
    res.status(200).json({ id });
  } catch (error) {
    console.log(error);
    await client.query('ROLLBACK');
    res.status(500).send('internal server error');
  }
})

app.listen(PORT, function () {
  console.log(`Server berjalan di http://localhost:${PORT}`);
})