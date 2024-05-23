const client = require('./init');

async function getArticle() {
  const rawData = await client.query(`
    SELECT id, title
    FROM article
` );

  return rawData
}

module.exports = { getArticle }