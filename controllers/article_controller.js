const modelArticle = require('../models/article');

async function getListArticle(req, res) {
  const rawData = await modelArticle.getArticle();
  const data = rawData.rows;
  const count = rawData.rowCount;

  res.status(200).json({ kumpulanArtikel: data });
};

module.exports = { getListArticle }