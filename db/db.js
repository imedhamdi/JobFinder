const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database:  'job_board',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkConnection() {
  try {
    await pool.query('SELECT 1'); // Exécute une requête simple pour tester la connexion
    console.log('Connexion à la base de données réussie !');
    return true; // La connexion est OK
  } catch (error) {
    console.error('Erreur de connexion à la base de données :', error);
    return false; // La connexion a échoué
  }
}

// Exportez la fonction de vérification avec le pool
module.exports = {
  pool: pool.promise(),
  checkConnection
};
module.exports = pool.promise();