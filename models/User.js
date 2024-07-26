

const pool = require('../db/db'); // Assurez-vous d'avoir configuré correctement votre pool de connexion MySQL
const crypto =require('crypto')
const jwt = require('jsonwebtoken')
class User {
    constructor(user) {
        this.user_id = user.user_id;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.password = user.password;
        this.phone = user.phone;
        this.user_type = user.user_type;
        this.resume_path = user.resume_path;
        this.created_at = user.created_at;
        this.updated_at = user.updated_at;
    }

    // Créer un nouvel utilisateur
    static async create(newUser) {
        const sql = `
      INSERT INTO users (first_name, last_name, email, password, phone, user_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        const values = [newUser.first_name, newUser.last_name, newUser.email, newUser.password, newUser.phone, newUser.user_type];
        const [result] = await pool.query(sql, values);

        const createdUser = {
            user_id: result.insertId, // ID auto-incrémenté
            ...newUser,
        };

        return new User(createdUser);
    }
    // Récupérer un utilisateur par son email
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.query(sql, [email]);
        return rows.length ? new User(rows[0]) : null;
    }
    // Récupérer un utilisateur par son ID
    static async findById(userId) {
        const sql = 'SELECT * FROM users WHERE user_id = ?';
        const [rows] = await pool.query(sql, [userId]);
        return rows.length ? new User(rows[0]) : null; // Retourne un objet User s'il existe, sinon null
    }

    // Récupérer tous les utilisateurs
    static async findAll() {
        const sql = 'SELECT * FROM users';
        const [rows] = await pool.query(sql);
        return rows.map(row => new User(row));
    }


// POST /users/forgot-password - Demande de réinitialisation de mot de passe

static async generateResetToken(email) {
    const resetToken = jwt.sign({ email }, 'VOTRE_CLE_SECRETE', { expiresIn: '1h' }); // Inclure l'email dans le token
    const sql = 'UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?';
    await pool.query(sql, [resetToken, email]);
    return resetToken;
  }
  

  static async findByResetToken(resetToken) {
    try {
      const decoded = jwt.verify(resetToken, 'VOTRE_CLE_SECRETE');
      const email = decoded.email; // Récupérer l'email du token
      const sql = 'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()';
      const [rows] = await pool.query(sql, [email, resetToken]);
      return rows.length ? new User(rows[0]) : null;
    } catch (err) {
      // Le token est invalide ou expiré
      return null;
    }
  }
  

    // Mettre à jour un utilisateur
    static async update(userId, updatedUser) {
        const sql = `
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, password = ?, phone = ?
      WHERE user_id = ?
    `;

        const values = [updatedUser.first_name, updatedUser.last_name, updatedUser.email, updatedUser.password, updatedUser.phone, userId];
        await pool.query(sql, values);
    }

    // Rénitialiser le mot de passe via un lien par mail 

    static async resetPassword(email, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const sql = `
          UPDATE users 
          SET password = ?, reset_token = NULL, reset_token_expires = NULL
          WHERE email = ? 
        `;
        const [result] = await pool.query(sql, [hashedPassword, email]); // Utiliser l'email
        return result.affectedRows > 0;
      }
    


    // Supprimer un utilisateur
    static async delete(userId) {
        const sql = 'DELETE FROM users WHERE user_id = ?';
        await pool.query(sql, [userId]);
    }
}

module.exports = User;
