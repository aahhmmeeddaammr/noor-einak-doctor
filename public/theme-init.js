(() => {
  let theme;
  try {
    const saved = JSON.parse(localStorage.getItem('doctor-portal-ui') || 'null')?.state?.theme;
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch { /* Storage may be unavailable. Use the system preference. */ }
  theme ||= window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
})();
