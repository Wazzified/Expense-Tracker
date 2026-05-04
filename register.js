import { supabase } from './supabase.js'

function checkStrength(val) {
  const fill = document.getElementById('strength-fill');
  const hint = document.getElementById('strength-hint');

  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { w: '0%',   color: '#e0dfd8', text: 'Masukan password' },
    { w: '25%',  color: '#E24B4A', text: 'Terlalu lemah' },
    { w: '50%',  color: '#EF9F27', text: 'Cukup' },
    { w: '75%',  color: '#1D9E75', text: 'Kuat' },
    { w: '100%', color: '#0F6E56', text: 'Sangat kuat' },
  ];

  const l = levels[score];
  fill.style.width = l.w;
  fill.style.background = l.color;
  hint.textContent = l.text;
  hint.style.color = l.color === '#e0dfd8' ? '#6b6b67' : l.color;
}

window.checkStrength = checkStrength;

document.getElementById('register-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm');

  if (password !== confirm.value) {
    confirm.classList.add('error');
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert('Gagal daftar: ' + error.message);
  } else {
    alert('Akun berhasil dibuat! Cek email kamu untuk verifikasi.');
  }
});