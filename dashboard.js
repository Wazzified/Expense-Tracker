import { supabase } from './supabase.js'

const categoryColors = {
  'Makan & minum': '#1D9E75',
  'Transport': '#378ADD',
  'Belanja': '#EF9F27',
  'Hiburan': '#D4537E',
  'Gaji': '#534AB7',
  'Lainnya': '#888780'
}

const categoryIcons = {
  'Makan & minum': '🍜',
  'Transport': '🚗',
  'Belanja': '🛒',
  'Hiburan': '🎮',
  'Gaji': '💰',
  'Lainnya': '📌'
}

const categoryOptions = {
  income: ['Gaji', 'Lainnya'],
  expense: ['Makan & minum', 'Transport', 'Belanja', 'Hiburan', 'Lainnya']
}

const notePlaceholders = {
  income: 'Contoh: Gaji bulan Mei',
  expense: 'Contoh: Makan siang di warteg'
}

const modalTitles = {
  income: 'Tambah Pemasukan',
  expense: 'Tambah Pengeluaran'
}

const categoryLabels = {
  income: 'Sumber dana',
  expense: 'Kategori'
}

function formatRupiah(angka) {
  return 'Rp ' + Math.abs(angka).toLocaleString('id-ID')
}

let allTransactions = []

function openModal(type) {
  document.getElementById('modal-title').textContent = modalTitles[type]
  document.getElementById('tx-type').value = type
  document.getElementById('tx-note').placeholder = notePlaceholders[type]
  document.getElementById('tx-date').valueAsDate = new Date()
  document.getElementById('category-label').textContent = categoryLabels[type]

  const select = document.getElementById('tx-category')
  select.innerHTML = categoryOptions[type].map(opt =>
    `<option value="${opt}">${opt}</option>`
  ).join('')

  document.getElementById('modal-overlay').classList.add('active')
}

function openEditModal(tx) {
  document.getElementById('edit-id').value = tx.id
  document.getElementById('edit-type').value = tx.type
  document.getElementById('edit-amount').value = tx.amount
  document.getElementById('edit-note').value = tx.note || ''
  document.getElementById('edit-date').value = tx.date

  const editCategoryLabel = document.getElementById('edit-category-label')
  const editCategoryField = document.getElementById('edit-category-field')
  const editSelect = document.getElementById('edit-category')

  editCategoryField.style.display = 'block'

  if (tx.type === 'expense') {
    editCategoryLabel.textContent = 'Kategori'
    editSelect.innerHTML = categoryOptions.expense.map(opt =>
      `<option value="${opt}" ${opt === tx.category ? 'selected' : ''}>${opt}</option>`
    ).join('')
  } else {
    editCategoryLabel.textContent = 'Sumber dana'
    editSelect.innerHTML = categoryOptions.income.map(opt =>
      `<option value="${opt}" ${opt === tx.category ? 'selected' : ''}>${opt}</option>`
    ).join('')
  }

  document.getElementById('edit-overlay').classList.add('active')
}

document.getElementById('btn-pemasukan').addEventListener('click', () => openModal('income'))
document.getElementById('btn-pengeluaran').addEventListener('click', () => openModal('expense'))

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.remove('active')
  document.getElementById('tx-form').reset()
})

document.getElementById('edit-close').addEventListener('click', () => {
  document.getElementById('edit-overlay').classList.remove('active')
  document.getElementById('edit-form').reset()
})

document.getElementById('tx-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const { data: { user } } = await supabase.auth.getUser()
  const type = document.getElementById('tx-type').value
  const amount = parseFloat(document.getElementById('tx-amount').value)
  const note = document.getElementById('tx-note').value
  const date = document.getElementById('tx-date').value
  const category = document.getElementById('tx-category').value

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type,
    amount,
    category,
    note,
    date
  })

  if (error) {
    alert('Gagal simpan: ' + error.message)
  } else {
    document.getElementById('modal-overlay').classList.remove('active')
    document.getElementById('tx-form').reset()
    loadDashboard()
  }
})

document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const id = document.getElementById('edit-id').value
  const amount = parseFloat(document.getElementById('edit-amount').value)
  const note = document.getElementById('edit-note').value
  const date = document.getElementById('edit-date').value
  const category = document.getElementById('edit-category').value

  const { error } = await supabase.from('transactions').update({
    amount,
    category,
    note,
    date
  }).eq('id', id)

  if (error) {
    alert('Gagal edit: ' + error.message)
  } else {
    document.getElementById('edit-overlay').classList.remove('active')
    document.getElementById('edit-form').reset()
    loadDashboard()
  }
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = 'login.html'
})

document.getElementById('tx-list').addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.tx-btn-edit')
  const hapusBtn = e.target.closest('.tx-btn-hapus')

  if (editBtn) {
    const id = editBtn.dataset.id
    const tx = allTransactions.find(t => t.id === id)
    if (tx) openEditModal(tx)
  }

  if (hapusBtn) {
    const id = hapusBtn.dataset.id
    const konfirmasi = confirm('Yakin mau hapus transaksi ini?')
    if (!konfirmasi) return

    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
    } else {
      loadDashboard()
    }
  }
})

async function loadDashboard() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { window.location.href = 'login.html'; return }

  const username = user.user_metadata?.username || user.email.split('@')[0]
  document.getElementById('user-name').textContent = username

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (!transactions) return

  allTransactions = transactions

  let totalIncome = 0
  let totalExpense = 0
  const categoryTotals = {}

  transactions.forEach(tx => {
    if (tx.type === 'income') {
      totalIncome += tx.amount
    } else {
      totalExpense += tx.amount
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount
    }
  })

  document.getElementById('saldo').textContent = formatRupiah(totalIncome - totalExpense)
  document.getElementById('pemasukan').textContent = formatRupiah(totalIncome)
  document.getElementById('pengeluaran').textContent = formatRupiah(totalExpense)

  const barWrap = document.getElementById('bar-wrap')
  if (Object.keys(categoryTotals).length === 0) {
    barWrap.innerHTML = '<div class="empty-state">Belum ada pengeluaran</div>'
  } else {
    const maxVal = Math.max(...Object.values(categoryTotals))
    barWrap.innerHTML = Object.entries(categoryTotals).map(([cat, val]) => `
      <div class="bar-row">
        <div class="bar-meta"><span>${cat}</span><span>${formatRupiah(val)}</span></div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(val/maxVal)*100}%; background:${categoryColors[cat] || '#888780'};"></div>
        </div>
      </div>
    `).join('')
  }

  const txList = document.getElementById('tx-list')
  if (transactions.length === 0) {
    txList.innerHTML = '<div class="empty-state">Belum ada transaksi</div>'
  } else {
    txList.innerHTML = transactions.slice(0, 5).map(tx => `
      <div class="tx-item">
        <div class="tx-icon" style="background:${tx.type === 'income' ? '#E1F5EE' : '#FAEEDA'}">
          ${categoryIcons[tx.category] || '📌'}
        </div>
        <div class="tx-info">
          <div class="tx-name">${tx.note || tx.category}</div>
          <div class="tx-date">${new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div class="tx-amount ${tx.type === 'income' ? 'inc' : 'exp'}">
          ${tx.type === 'income' ? '+' : '-'}${formatRupiah(tx.amount)}
        </div>
        <div class="tx-actions">
          <button class="tx-btn-edit" data-id="${tx.id}">✏️</button>
          <button class="tx-btn-hapus" data-id="${tx.id}">🗑️</button>
        </div>
      </div>
    `).join('')
  }

  const bulanLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const incomePerBulan = Array(12).fill(0)
  const expensePerBulan = Array(12).fill(0)

  transactions.forEach(tx => {
    const bulan = new Date(tx.date).getMonth()
    if (tx.type === 'income') incomePerBulan[bulan] += tx.amount
    else expensePerBulan[bulan] += tx.amount
  })

  const ctx = document.getElementById('chart-bulanan')
  if (window.chartBulanan) window.chartBulanan.destroy()

  window.chartBulanan = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bulanLabels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomePerBulan,
          backgroundColor: '#1D9E75',
          borderRadius: 6
        },
        {
          label: 'Pengeluaran',
          data: expensePerBulan,
          backgroundColor: '#E24B4A',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          ticks: {
            callback: val => 'Rp ' + val.toLocaleString('id-ID')
          }
        }
      }
    }
  })
}

loadDashboard()

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