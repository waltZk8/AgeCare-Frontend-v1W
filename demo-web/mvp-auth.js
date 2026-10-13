// Cuentas públicas para seleccionar un perfil ficticio; no es autenticación real.
const AgeCareMvpAuth = (() => {
  const mvpAccounts = Object.freeze({
    'familia@agecare.mvp': { role: 'Familia', password: 'Familia123!' },
    'cuidador@agecare.mvp': { role: 'Cuidador', password: 'Cuidador123!', caregiverId:'cg1' },
    'medico@agecare.mvp': { role: 'Médico', password: 'Medico123!' },
    'elena@agecare.mvp': { role: 'Adulto mayor', password: 'Adulto123!' },
    'ana@agecare.mvp': { role:'Cuidador', password:'Ana123!', caregiverId:'cg2' },
    'lucia@agecare.mvp': { role:'Cuidador', password:'Lucia123!', caregiverId:'cg3' },
    'marta@agecare.mvp': { role:'Cuidador', password:'Marta123!', caregiverId:'cg4' },
    'patricia@agecare.mvp': { role:'Cuidador', password:'Patricia123!', caregiverId:'cg5' },
    'carmen@agecare.mvp': { role:'Cuidador', password:'Carmen123!', caregiverId:'cg6' },
    'daniela@agecare.mvp': { role:'Cuidador', password:'Daniela123!', caregiverId:'cg7' },
  });

  function authenticateMvp(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string') return null;
    const account = mvpAccounts[email.trim().toLowerCase()];
    return account && account.password === password ? account.role : null;
  }

  return Object.freeze({ mvpAccounts, authenticateMvp });
})();

if (typeof module !== 'undefined') module.exports = AgeCareMvpAuth;
