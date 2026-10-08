// Cuentas públicas para seleccionar un perfil ficticio; no es autenticación real.
const AgeCareDemoAuth = (() => {
  const demoAccounts = Object.freeze({
    'familia@agecare.demo': { role: 'Familia', password: 'Familia123!' },
    'cuidador@agecare.demo': { role: 'Cuidador', password: 'Cuidador123!' },
    'medico@agecare.demo': { role: 'Médico', password: 'Medico123!' },
    'elena@agecare.demo': { role: 'Adulto mayor', password: 'Adulto123!' },
  });

  function authenticateDemo(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string') return null;
    const account = demoAccounts[email.trim().toLowerCase()];
    return account && account.password === password ? account.role : null;
  }

  return Object.freeze({ demoAccounts, authenticateDemo });
})();

if (typeof module !== 'undefined') module.exports = AgeCareDemoAuth;
