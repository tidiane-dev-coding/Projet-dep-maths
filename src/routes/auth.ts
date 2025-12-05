// Routes d'authentification : inscription et connexion
import { Router } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Création d'un routeur Express qui va contenir nos routes /register et /login
const router = Router();

// Route POST /register : création d'un nouvel utilisateur
router.post('/register', async (req, res) => {
  try {
    // On logue le corps de la requête pour aider au debug (dev only)
    console.log('POST /api/auth/register payload=', req.body)
    const { name, email, password, role } = req.body;
    // Vérification des champs obligatoires
    if (!email || !password) {
      console.warn('Register missing fields', { email, passwordProvided: !!password })
      return res.status(400).json({ message: 'Missing fields' });
    }
    // On empêche la création publique du rôle Admin pour des raisons de sécurité
    if (role === 'Admin') {
      console.warn('Attempt to create Admin via public register:', email)
      return res.status(403).json({ message: 'Creation of Admin accounts is not allowed via public register' })
    }
    // On vérifie si l'email est déjà utilisé
    const exists = await User.findOne({ email });
    if (exists) {
      console.warn('Register attempted for existing user', email)
      // Si l'utilisateur existe déjà et que le mot de passe envoyé correspond,
      // on effectue un auto-login (on renvoie un token) pour simplifier l'expérience.
      const pwMatches = password ? await bcrypt.compare(password, exists.password) : false;
      if (pwMatches) {
        const token = jwt.sign({ id: exists._id, role: exists.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        return res.json({ token, user: { id: exists._id, name: exists.name, email: exists.email, role: exists.role }, autoLogin: true });
      }
      // Sinon on demande simplement de se connecter
      return res.status(409).json({ message: 'Un compte existe déjà pour cet email. Si c’est vous, connectez-vous.' });
    }
    // Si tout est ok, on hache le mot de passe puis on crée l'utilisateur
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  
  // Envoi d'un email de confirmation : si la configuration SMTP est absente,
  // on crée automatiquement un compte Ethereal (service de test) pour développer.
  let emailSent = false;
  try {
    let transporter;
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      // Utilise le serveur SMTP configuré en production
      transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPass } })
    } else {
      // Pas de SMTP : création d'un compte Ethereal pour voir les emails en dev
      console.log('SMTP not configured — creating Ethereal test account for dev email preview')
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, secure: false, auth: { user: testAccount.user, pass: testAccount.pass } })
    }

    // Construction du contenu HTML de l'email (message simple en français)
    const html = `
      <p>Bonjour <strong>${user.name}</strong>,</p>
      <p>Merci pour votre inscription sur la plateforme du département.</p>
      <p>Vous pouvez désormais vous connecter avec votre adresse email.</p>
      <p>Cordialement,<br/>L'équipe du département</p>
    `

    // Envoi réel de l'email (on attend la réponse pour savoir si l'envoi a bien été accepté)
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@departement.edu',
      to: user.email,
      subject: 'Merci pour votre inscription',
      text: `Bonjour ${user.name},\n\nMerci pour votre inscription sur la plateforme du département.\n\nCordialement,\nL'équipe du département`,
      html
    })

    // Log complet de la réponse nodemailer pour faciliter le debug (Gmail/SMTP)
    console.log('Nodemailer sendMail info:', info);

    // Si on utilise Ethereal (dev), nodemailer fournit une URL de prévisualisation
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log('E-mail preview URL (ethereal):', previewUrl)
    }
    console.log('Confirmation email queued for', user.email)
    emailSent = true
  } catch (err) {
    console.error('Failed to send confirmation email', err)
    emailSent = false
  }

  // Enfin on renvoie le token, les informations de l'utilisateur créé et l'état d'envoi de l'email
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role }, emailSent });
  } catch (err) {
    console.error('Error in /api/auth/register', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Route POST /login : authentification utilisateur (connexion)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // On cherche l'utilisateur par email
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  // On compare le mot de passe envoyé avec le hash stocké
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  // Si tout est bon, on crée un token JWT et on le renvoie avec les infos utilisateur
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

export default router;
