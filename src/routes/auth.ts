// Routes d'authentification : inscription et connexion
import { Router } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Création d'un routeur Express qui va contenir nos routes /register et /login
const router = Router();
const SUPER_ADMIN_EMAIL = 'admin@univ.com';

function isSuperAdminEmail(email?: string) {
  return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

async function createTransporter() {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass }
    })
  }

  console.log('SMTP not configured — creating Ethereal test account for dev email preview')
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  })
}

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
      if (isSuperAdminEmail(exists.email) && !exists.isSuperAdmin) {
        exists.isSuperAdmin = true;
        if (exists.role !== 'Admin') exists.role = 'Admin';
        await exists.save();
      }
      console.warn('Register attempted for existing user', email)
      // Si l'utilisateur existe déjà et que le mot de passe envoyé correspond,
      // on effectue un auto-login (on renvoie un token) pour simplifier l'expérience.
      const pwMatches = password ? await bcrypt.compare(password, exists.password) : false;
      if (pwMatches) {
        const token = jwt.sign(
          { id: exists._id, role: exists.role, email: exists.email, isSuperAdmin: !!exists.isSuperAdmin },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );
        return res.json({
          token,
          user: { id: exists._id, name: exists.name, email: exists.email, role: exists.role, isSuperAdmin: !!exists.isSuperAdmin },
          autoLogin: true
        });
      }
      // Sinon on demande simplement de se connecter
      return res.status(409).json({ message: 'Un compte existe déjà pour cet email. Si c’est vous, connectez-vous.' });
    }
    // Si tout est ok, on hache le mot de passe puis on crée l'utilisateur
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      isSuperAdmin: isSuperAdminEmail(email)
    });
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, isSuperAdmin: !!user.isSuperAdmin },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
  
  // Envoi d'un email de confirmation : si la configuration SMTP est absente,
  // on crée automatiquement un compte Ethereal (service de test) pour développer.
  let emailSent = false;
  try {
    const transporter = await createTransporter()

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
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, isSuperAdmin: !!user.isSuperAdmin },
    emailSent
  });
  } catch (err) {
    console.error('Error in /api/auth/register', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Route POST /login : authentification utilisateur (connexion)
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Recherche insensible à la casse (emails enregistrés avec majuscules possibles)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (isSuperAdminEmail(user.email) && !user.isSuperAdmin) {
      user.isSuperAdmin = true;
      if (user.role !== 'Admin') user.role = 'Admin';
      await user.save();
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, isSuperAdmin: !!user.isSuperAdmin },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: !!user.isSuperAdmin,
      },
    });
  } catch (err) {
    console.error('Error in POST /api/auth/login', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
});

// Route POST /forgot-password : envoi un lien de réinitialisation
router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ message: 'Email requis' })

    const user = await User.findOne({ email })
    // Réponse générique pour éviter l'énumération des comptes
    if (!user) return res.json({ ok: true, message: 'Si cet email existe, un lien a été envoyé.' })

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1h

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = expires
    await user.save()

    const frontendBase = (
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      'https://projet-dep-maths.onrender.com'
    ).replace(/\/+$/, '')
    const resetLink = `${frontendBase}/reset-password/${rawToken}`

    const transporter = await createTransporter()
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@departement.edu',
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Bonjour ${user.name},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valide 1 heure):\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
      html: `<p>Bonjour <strong>${user.name}</strong>,</p><p>Cliquez sur ce lien pour réinitialiser votre mot de passe (valide 1 heure):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
    })
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) console.log('E-mail preview URL (ethereal):', previewUrl)

    return res.json({ ok: true, message: 'Si cet email existe, un lien a été envoyé.' })
  } catch (err: any) {
    console.error('Error in /api/auth/forgot-password', err)
    return res.status(500).json({ message: err?.message || 'Server error' })
  }
})

// Route POST /reset-password/:token : définit un nouveau mot de passe
router.post('/reset-password/:token', async (req, res) => {
  try {
    const rawToken = String(req.params?.token || '')
    const password = String(req.body?.password || '')
    if (!rawToken || !password) return res.status(400).json({ message: 'Token et mot de passe requis' })
    if (password.length < 6) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' })

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    })
    if (!user) return res.status(400).json({ message: 'Lien invalide ou expiré' })

    user.password = await bcrypt.hash(password, 10)
    user.resetPasswordToken = undefined as any
    user.resetPasswordExpires = undefined as any
    await user.save()

    return res.json({ ok: true, message: 'Mot de passe mis à jour.' })
  } catch (err: any) {
    console.error('Error in /api/auth/reset-password/:token', err)
    return res.status(500).json({ message: err?.message || 'Server error' })
  }
})

export default router;
