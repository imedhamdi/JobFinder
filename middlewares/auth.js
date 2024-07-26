const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Le token est généralement envoyé sous la forme "Bearer <token>"

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, 'VOTRE_CLE_SECRETE', (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user; // Stocker l'utilisateur décodé dans la requête
    next(); 
  });
}
