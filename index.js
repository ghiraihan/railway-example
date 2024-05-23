const express = require('express');
const methodOverride = require('method-override');
const cors = require('cors');
const PORT = 3555;

const app = express();
app.use(cors());
const client = require('./models/init');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded());
app.use(methodOverride('_method'));

// ROUTING
const articleController = require('./controllers/article_controller')
// 1. GET LIST API
app.get('/api/article', articleController.getListArticle);
// 2. GET DETAIL API
app.get('/api/article/detail/:id', async function (req, res) {
  const id = req.params.id;
  const rawData = await client.query(`
      SELECT title, body
      FROM article
      WHERE id = $1
  `, [id]);
  const data = rawData.rows[0];

  res.status(200).render('detail/index', {
    dataArtikel: data,
    id
  })
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
    res.redirect('/api/article');
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
    res.redirect('/api/article/detail/' + id);
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
    res.redirect('/api/article')
  } catch (error) {
    console.log(error);
    await client.query('ROLLBACK');
    res.status(500).send('internal server error');
  }
})

app.get('/api/article/editor', async function (req, res) {
  const updateId = req.query.update_id;

  const rawData = await client.query(`
      SELECT title, body
      FROM article
      WHERE id = $1
  `, [updateId]);
  const data = rawData.rows[0];

  res.status(200).render('editor/index', { updateId, dataArtikel: data })
})

app.listen(PORT, function () {
  console.log(`Server berjalan di http://localhost:${PORT}`);
})