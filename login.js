import { supabase } from './supabase.js'

document.querySelector('form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Gagal login: ' + error.message);
  } else {
    alert('Login berhasil!');
    window.location.href = 'dashboard.html';
  }
});