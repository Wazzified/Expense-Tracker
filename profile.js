import { supabase } from './supabase.js'

async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { window.location.href = 'login.html'; return }

  const email = user.email
  const username = user.user_metadata?.username || email.split('@')[0]

  document.getElementById('user-email').textContent = email
  document.getElementById('avatar-text').textContent = username[0].toUpperCase()
  document.getElementById('new-username').value = username
}

document.getElementById('username-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const username = document.getElementById('new-username').value.trim()

  if (!username) {
    alert('Username tidak boleh kosong!')
    return
  }

  const { error } = await supabase.auth.updateUser({
    data: { username }
  })

  if (error) {
    alert('Gagal ganti username: ' + error.message)
  } else {
    alert('Username berhasil diganti! Kembali ke dashboard untuk melihat perubahan.')
  }
})

document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const newPass = document.getElementById('new-password').value
  const confirmPass = document.getElementById('confirm-password').value

  if (newPass !== confirmPass) {
    alert('Password tidak cocok!')
    return
  }

  if (newPass.length < 8) {
    alert('Password minimal 8 karakter!')
    return
  }

  const { error } = await supabase.auth.updateUser({ password: newPass })

  if (error) {
    alert('Gagal ganti password: ' + error.message)
  } else {
    alert('Password berhasil diganti!')
    document.getElementById('password-form').reset()
  }
})

document.getElementById('delete-btn').addEventListener('click', async () => {
  const konfirmasi = confirm('Yakin mau hapus akun? Semua data akan hilang!')
  if (!konfirmasi) return
  alert('Fitur hapus akun memerlukan akses admin. Hubungi support.')
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = 'login.html'
})

loadProfile()

const toggleDark = document.getElementById('toggle-dark')

if (localStorage.getItem('darkmode') === 'true') {
  document.body.classList.add('dark')
  toggleDark.textContent = '☀️'
}

toggleDark.addEventListener('click', () => {
  document.body.classList.toggle('dark')
  const isDark = document.body.classList.contains('dark')
  localStorage.setItem('darkmode', isDark)
  toggleDark.textContent = isDark ? '☀️' : '🌙'
})