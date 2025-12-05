const mysql = require('mysql2/promise');

module.exports = async (req, res) => {
  // 1. Enable CORS
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
      port: 3306,
      connectTimeout: 10000
    });

    // --- VIEW COUNT LOGIC (Anti-Spam) ---
    const cookieName = `viewed_${player.toLowerCase()}`;
    const cookies = req.headers.cookie || "";
    const hasViewed = cookies.includes(cookieName);

    if (!hasViewed) {
        // If they haven't viewed this player recently, increment the DB
        await connection.execute(
            'UPDATE slashup_stats SET views = views + 1 WHERE name = ?',
            [player]
        );
        
        // Set a cookie that expires in 1 hour (3600 seconds)
        // This prevents them from adding another view for 1 hour
        res.setHeader('Set-Cookie', `${cookieName}=true; Max-Age=3600; Path=/; SameSite=None; Secure`);
    }
    // ------------------------------------

    const [statsRows] = await connection.execute(
      'SELECT * FROM slashup_stats WHERE name = ?',
      [player]
    );

    if (statsRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Player not found' });
    }

    const [rankRows] = await connection.execute(
        'SELECT COUNT(*) + 1 as rank FROM slashup_stats WHERE wins > ?',
        [statsRows[0].wins]
    );
    const exactRank = rankRows[0].rank;

    const [matchRows] = await connection.execute(
      'SELECT winner_name, loser_name, match_time FROM slashup_matches WHERE winner_name = ? OR loser_name = ? ORDER BY id DESC LIMIT 5',
      [player, player]
    );

    await connection.end();

    res.status(200).json({
      stats: { ...statsRows[0], rank: exactRank },
      matches: matchRows
    });

  } catch (error) {
    console.error("[API ERROR]", error);
    if(connection) await connection.end();
    res.status(500).json({ error: 'Database Error: ' + error.message });
  }
};
