// ==============================================
// SCRIPT.JS — To-Do List
// ==============================================

// -----------------------------------------------
// 1. SELEKSI ELEMEN DOM
// Ambil referensi ke elemen HTML yang akan kita
// manipulasi. querySelector() mencari satu elemen,
// getElementById() mencari via id.
// -----------------------------------------------
const taskForm    = document.getElementById('task-form');
const taskInput   = document.getElementById('task-input');
const taskList    = document.getElementById('task-list');
const taskCount   = document.getElementById('task-count');
const emptyMsg    = document.getElementById('empty-msg');
const clearBtn    = document.getElementById('clear-completed');
const filterBtns  = document.querySelectorAll('.filter-btn'); // NodeList semua tombol filter

// -----------------------------------------------
// 2. STATE APLIKASI
// tasks  : array semua objek tugas
// currentFilter : filter aktif ('all' | 'active' | 'completed')
// -----------------------------------------------
let tasks         = [];
let currentFilter = 'all';

// -----------------------------------------------
// 3. LOAD DATA DARI LOCALSTORAGE
// localStorage adalah penyimpanan di browser yang
// bertahan walau halaman ditutup/di-refresh.
// JSON.parse() mengubah string JSON kembali ke array JS.
// -----------------------------------------------
function loadFromStorage() {
  const saved = localStorage.getItem('tasks');
  // Jika ada data tersimpan, parse; jika tidak, pakai array kosong
  tasks = saved ? JSON.parse(saved) : [];
}

// -----------------------------------------------
// 4. SIMPAN DATA KE LOCALSTORAGE
// JSON.stringify() mengubah array JS menjadi string JSON
// agar bisa disimpan di localStorage.
// -----------------------------------------------
function saveToStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// -----------------------------------------------
// 5. RENDER DAFTAR TUGAS KE DOM
// Fungsi ini membersihkan <ul> lalu mengisi ulang
// berdasarkan array tasks & filter aktif.
// -----------------------------------------------
function render() {
  // Filter tasks sesuai pilihan aktif
  const filtered = tasks.filter(task => {
    if (currentFilter === 'active')    return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  // Kosongkan daftar sebelum diisi ulang
  taskList.innerHTML = '';

  // Tampilkan/sembunyikan pesan kosong
  emptyMsg.style.display = filtered.length === 0 ? 'block' : 'none';

  // Buat elemen <li> untuk setiap tugas yang lolos filter
  filtered.forEach(task => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
  });

  // Hitung & tampilkan jumlah tugas yang belum selesai
  const activeCount = tasks.filter(t => !t.completed).length;
  taskCount.textContent = activeCount;
}

// -----------------------------------------------
// 6. BUAT ELEMEN <li> UNTUK SATU TUGAS
// Mengembalikan elemen DOM siap pakai.
// -----------------------------------------------
function createTaskElement(task) {
  const li = document.createElement('li');
  // Tambahkan class 'completed' jika tugas sudah selesai
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.dataset.id = task.id; // simpan id di atribut data-id

  li.innerHTML = `
    <!-- Checkbox: menandai selesai/belum -->
    <input
      type="checkbox"
      class="task-item__check"
      ${task.completed ? 'checked' : ''}
      aria-label="Tandai selesai"
    />

    <!-- Teks tugas -->
    <span class="task-item__text">${escapeHtml(task.text)}</span>

    <!-- Tombol Edit & Hapus -->
    <div class="task-item__actions">
      <button class="action-btn edit-btn"  title="Edit tugas">✏️</button>
      <button class="action-btn delete-btn" title="Hapus tugas">🗑️</button>
    </div>
  `;

  // Pasang event listener di tiap elemen interaktif
  li.querySelector('.task-item__check').addEventListener('change', () => toggleTask(task.id));
  li.querySelector('.edit-btn').addEventListener('click',          () => startEdit(task.id, li));
  li.querySelector('.delete-btn').addEventListener('click',        () => deleteTask(task.id, li));

  return li;
}

// -----------------------------------------------
// 7. TAMBAH TUGAS BARU
// -----------------------------------------------
function addTask(text) {
  // Buat objek tugas baru
  const newTask = {
    id:        Date.now(),    // ID unik berdasarkan waktu (millisecond)
    text:      text.trim(),   // hapus spasi di awal/akhir
    completed: false
  };

  tasks.push(newTask);  // tambahkan ke array
  saveToStorage();
  render();
}

// -----------------------------------------------
// 8. TOGGLE SELESAI / BELUM SELESAI
// -----------------------------------------------
function toggleTask(id) {
  // Cari tugas dengan id yang cocok, lalu balik nilai completed
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToStorage();
    render();
  }
}

// -----------------------------------------------
// 9. HAPUS TUGAS (dengan animasi)
// -----------------------------------------------
function deleteTask(id, liElement) {
  // Tambahkan class 'removing' untuk trigger animasi CSS fadeOut
  liElement.classList.add('removing');

  // Tunggu animasi selesai (200ms) baru hapus dari array
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    render();
  }, 200);
}

// -----------------------------------------------
// 10. MODE EDIT TUGAS (inline editing)
// Mengganti <span> teks dengan <input> sementara.
// -----------------------------------------------
function startEdit(id, liElement) {
  const task     = tasks.find(t => t.id === id);
  if (!task) return;

  const textEl   = liElement.querySelector('.task-item__text');
  const actionsEl = liElement.querySelector('.task-item__actions');

  // Buat input edit inline
  const editInput = document.createElement('input');
  editInput.type  = 'text';
  editInput.value = task.text;
  editInput.className = 'task-item__edit-input';
  editInput.maxLength = 120;

  // Sembunyikan teks asli, masukkan input
  textEl.replaceWith(editInput);

  // Ganti tombol edit/hapus dengan Save & Cancel
  actionsEl.innerHTML = `
    <button class="action-btn save-btn"   title="Simpan">💾</button>
    <button class="action-btn cancel-btn" title="Batal">✖️</button>
  `;

  // Fokus ke input & tempatkan kursor di akhir
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  // Simpan perubahan
  function saveEdit() {
    const newText = editInput.value.trim();
    if (newText) {
      task.text = newText;
      saveToStorage();
    }
    render(); // re-render kembali ke tampilan normal
  }

  // Tangani klik Save
  actionsEl.querySelector('.save-btn').addEventListener('click', saveEdit);

  // Tangani klik Cancel (render ulang tanpa simpan)
  actionsEl.querySelector('.cancel-btn').addEventListener('click', render);

  // Simpan juga dengan tekan Enter, batalkan dengan Escape
  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveEdit();
    if (e.key === 'Escape') render();
  });
}

// -----------------------------------------------
// 11. HAPUS SEMUA TUGAS SELESAI
// -----------------------------------------------
function clearCompleted() {
  // filter() membuat array baru yang hanya berisi yang NOT completed
  tasks = tasks.filter(t => !t.completed);
  saveToStorage();
  render();
}

// -----------------------------------------------
// 12. FUNGSI UTILITAS: Escape HTML
// Mencegah XSS — jika pengguna mengetik karakter
// seperti <script>, karakter itu tidak akan dieksekusi.
// -----------------------------------------------
function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// -----------------------------------------------
// 13. EVENT LISTENERS
// -----------------------------------------------

// Submit form → tambah tugas
taskForm.addEventListener('submit', e => {
  e.preventDefault(); // cegah reload halaman (default form HTML)
  const text = taskInput.value.trim();
  if (!text) return;  // abaikan jika input kosong
  addTask(text);
  taskInput.value = ''; // kosongkan input setelah tambah
  taskInput.focus();    // kembalikan fokus ke input
});

// Klik tombol filter
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Hapus class 'active' dari semua tombol
    filterBtns.forEach(b => b.classList.remove('active'));
    // Tambah class 'active' ke tombol yang diklik
    btn.classList.add('active');
    // Simpan filter yang dipilih lalu render ulang
    currentFilter = btn.dataset.filter;
    render();
  });
});

// Klik "Hapus Selesai"
clearBtn.addEventListener('click', clearCompleted);

// -----------------------------------------------
// 14. INISIALISASI APLIKASI
// Dipanggil sekali saat halaman pertama kali dimuat.
// -----------------------------------------------
loadFromStorage();
render();
