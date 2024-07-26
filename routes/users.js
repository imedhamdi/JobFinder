const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt'); // Pour le hachage des mots de passe
const pool = require('../db/db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const transporter = require('../config/email');   





// GET /users - Récupérer tous les utilisateurs (probablement à restreindre aux admins)
router.get('/', async (req, res) => {
    try {
        const sql = 'SELECT * FROM users';
        const [rows] = await pool.query(sql);
        const users = rows.map(row => new User(row)); // Mapper les résultats en objets User
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Configuration de multer pour le stockage des CV
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes'); // Dossier de destination des CV
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nom unique pour chaque fichier
    }
});

const upload = multer({ storage: storage });


// POST /users/register - Inscription d'un nouveau utilisateur
router.post('/register', upload.single('resume'), async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, user_type } = req.body;

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Chemin du CV téléchargé (ou null si aucun CV n'a été téléchargé)
        const resumePath = req.file ? req.file.path : null;

        const newUser = await User.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            phone,
            user_type,
            resume_path: resumePath
        });

        res.status(201).json(newUser);
    } catch (err) {

        console.error('Erreur lors de l\'inscription :', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        if (err instanceof multer.MulterError) {
            // Erreur liée au téléchargement du fichier (taille, type, etc.)
            return res.status(400).json({ error: err.message });
        }

        // Autres erreurs (problèmes de base de données, etc.)
        res.status(500).json({ error: 'Erreur serveur' });
    }
});



// GET /users/reset-password/:token - Affichage du formulaire de réinitialisation
// GET /users/reset-password/:token - Affichage du formulaire de réinitialisation
// GET /users/reset-password/:token - Affichage du formulaire de réinitialisation
router.get('/reset-password/:token', async (req, res) => {
    try {
      const resetToken = req.params.token;
  
      // 1. Vérification du token JWT
      jwt.verify(resetToken, 'VOTRE_CLE_SECRETE', async (err, decoded) => {
        if (err) {
          return res.status(400).json({ error: 'Token de réinitialisation invalide ou expiré' });
        }
  
        // 2. Extraction de l'email du token
        const email = decoded.email;
  
        // 3. Vérification de l'utilisateur (optionnel, mais recommandé)
        const user = await User.findByEmail(email);
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
  
        // 4. Affichage du formulaire de réinitialisation
        res.send(`
          <form action="/users/reset-password/${resetToken}" method="POST">
            <input type="password" name="password" placeholder="Nouveau mot de passe">
            <button type="submit">Réinitialiser le mot de passe</button>
          </form>
        `);
      });
    } catch (err) {
      console.error('Erreur lors de l\'affichage du formulaire de réinitialisation :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  // POST /users/reset-password/:token - Réinitialisation du mot de passe
 // POST /users/reset-password/:token - Réinitialisation du mot de passe
// POST /users/reset-password/:token - Réinitialisation du mot de passe

function isValidPassword(password) {
    return password.length >= 8; // Le mot de passe doit avoir au moins 8 caractères
  }
  router.post('/reset-password/:token', async (req, res) => {
    try {
      const { password } = req.body;
      const resetToken = req.params.token;
  
      // 1. Vérification du token JWT
      jwt.verify(resetToken, 'VOTRE_CLE_SECRETE', async (err, decoded) => {
        if (err) {
          return res.status(400).json({ error: 'Token de réinitialisation invalide ou expiré' });
        }
  
        // 2. Extraction de l'email du token
        const email = decoded.email;
  
        // 3. Vérification de la force du mot de passe
        if (!isValidPassword(password)) {
          return res.status(400).json({ error: 'Le mot de passe doit être suffisamment fort (au moins 8 caractères)' });
        }
  
        // 4. Hachage du nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // 5. Mise à jour du mot de passe et réinitialisation du token
        const updateSql = `
          UPDATE users 
          SET password = ?, reset_token = NULL, reset_token_expires = NULL
          WHERE email = ? 
        `;
        const updateValues = [hashedPassword, email];
        const [updateResult] = await pool.query(updateSql, updateValues);
  
        if (updateResult.affectedRows === 0) {
          return res.status(400).json({ error: 'Token de réinitialisation invalide ou expiré' });
        }
  
        // 6. Réponse réussie
        res.json({ message: 'Mot de passe réinitialisé avec succès' });
      });
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du mot de passe :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
// POST /users/forgot-password - Demande de réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error:   
   'Utilisateur non trouvé' });
      }
  
      const resetToken = await User.generateResetToken(email);
      const resetLink = `http://votre-site.com/reset-password/${resetToken}`; // Lien de réinitialisation
  
      // Envoi de l'e-mail 
      await transporter.sendMail({
        from: 'votre_email@gmail.com',
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
      });
  
      res.json({ message: 'Un email de réinitialisation a été envoyé' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });


/// POST /users/login - Connexion d'un utilisateur
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Vérification des champs
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // 2. Recherche de l'utilisateur par email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Email incorrect' }); // Message d'erreur plus précis
        }

        // 3. Vérification du mot de passe
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Mot de passe incorrect'
            }); // Message d'erreur plus précis
        }

        // 4. Génération du token JWT
        const token = jwt.sign({ userId: user.user_id }, 'VOTRE_CLE_SECRETE', { expiresIn: '1h' }); // Remplacez 'VOTRE_CLE_SECRETE' par une clé secrète forte

        // 5. Réponse réussie
        res.json({ message: 'Connexion réussie', token, userId: user.user_id });
    } catch (err) {
        console.error('Erreur lors de la connexion :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// GET /users/:id - Récupérer un utilisateur par son ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ... autres routes pour la mise à jour (PUT), la suppression (DELETE), etc.


// ... (autres routes GET et POST)

// PUT /users/:id - Mettre à jour un utilisateur existant
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { first_name, last_name, email, password, phone } = req.body;

        // Vérifier si l'utilisateur existe
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Hachage du mot de passe si fourni (même si l'utilisateur ne change pas son mot de passe)
        let hashedPassword = existingUser.password; // Par défaut, on garde l'ancien mot de passe
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Mettre à jour les données de l'utilisateur
        const sql = `
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, password = ?, phone = ?
        WHERE user_id = ?
      `;

        const values = [first_name, last_name, email, hashedPassword, phone, userId];
        await pool.query(sql, values);

        // Récupérer l'utilisateur mis à jour
        const updatedUser = await User.findById(userId);
        res.json(updatedUser);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') { // Doublon d'email
            res.status(409).json({ error: 'Cet email est déjà utilisé' });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
});

// DELETE /users/:id - Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Vérifier si l'utilisateur existe
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Supprimer l'utilisateur
        const sql = 'DELETE FROM users WHERE user_id = ?';
        await pool.query(sql, [userId]);

        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
