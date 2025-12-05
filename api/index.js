import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { player } = req.query;

  if (!player) {
    return res.status(400).json({ error: 'No player specified' });
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'uk02-sql.pebblehost.com',
      user: 'customer_1134473_Slashup',
      password: 'ZXC8^be^+^lVBZ+IIomjAyh9',
      database: 'customer_1134473_Slashup',
      port: 3306
    });

    const [statsRows] = await connection.execute(
      'SELECT * FROM slashup_stats WHERE name = ?',
      [player]
    );

    if (statsRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Player not found' });
    }

    const [matchRows] = await connection.execute(
      'SELECT winner_name, loser_name, match_time FROM slashup_matches WHERE winner_name = ? OR loser_name = ? ORDER BY id DESC LIMIT 5',
      [player, player]
    );

    await connection.end();

    res.status(200).json({
      stats: statsRows[0],
      matches: matchRows
    });

  } catch (error) {
    if(connection) await connection.end();
    console.error(error);
    res.status(500).json({ error: 'Database connection failed' });
  }
}
