// test_register.js
// Script pour tester l'inscription et forcer l'envoi d'email (Ethereal fallback si SMTP non configuré)
(async () => {
  const url = 'http://localhost:5000/api/auth/register'
  const payload = {
    name: 'Test Utilisateur',
    email: `test+auto_${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'Student'
  }

  const maxRetries = 20
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const text = await res.text()
      console.log('HTTP', res.status)
      console.log(text)
      process.exit(0)
    } catch (err) {
      console.log('Request failed, retrying...', i+1, err.message)
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  console.error('Failed to contact server after retries')
  process.exit(1)
})()
