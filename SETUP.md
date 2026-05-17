# 🚀 Panduan Setup di VPS

## Kebutuhan

- Node.js >= 16 (cek: `node -v`)
- Git sudah terkonfigurasi di VPS
- Akses push ke repo GitHub

---

## Langkah 1 — Clone & Install

```bash
# Clone repo ini ke VPS
git clone https://github.com/USERNAME/REPO-INI.git
cd REPO-INI

# Install dependency (hanya node-cron, sangat ringan)
npm install
```

---

## Langkah 2 — Konfigurasi Git di VPS

```bash
# Set identitas git (wajib untuk commit)
git config --global user.name "Nama Kamu"
git config --global user.email "email@kamu.com"
```

### Autentikasi GitHub (pilih salah satu):

**Opsi A — SSH Key (Rekomendasi)**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "email@kamu.com"

# Tampilkan public key, copy ke GitHub > Settings > SSH Keys
cat ~/.ssh/id_ed25519.pub

# Test koneksi
ssh -T git@github.com

# Ubah remote ke SSH
git remote set-url origin git@github.com:USERNAME/REPO.git
```

**Opsi B — Personal Access Token**
```bash
# Buat token di: GitHub > Settings > Developer Settings > Personal Access Tokens
# Lalu simpan ke git credential store
git config --global credential.helper store
git push  # masukkan username & token sekali, tersimpan otomatis
```

---

## Langkah 3 — Ubah Konfigurasi (opsional)

Edit bagian `CONFIG` di `index.js` jika perlu:

```js
const CONFIG = {
  branch: "main",          // ganti jika branch kamu "master"
  commitEvery: "0 */5 * * *",  // ubah jadwal jika mau
  timezone: "Asia/Jakarta",    // sesuaikan timezone
};
```

---

## Langkah 4 — Test Sekali

```bash
# Jalankan sekali untuk test (real commit + push, tidak nunggu cron)
node index.js --dev
```

Jika berhasil, cek GitHub — README.md dan commit-log.json akan terupdate.

---

## Langkah 5 — Jalankan Permanen dengan PM2

```bash
# Install PM2 (process manager, ringan)
npm install -g pm2

# Jalankan script
pm2 start index.js --name "pantun-bot"

# Auto-start saat VPS reboot
pm2 startup
pm2 save

# Cek status
pm2 status

# Lihat log
pm2 logs pantun-bot
```

---

## Perintah PM2 Berguna

| Perintah | Fungsi |
|---|---|
| `pm2 status` | Cek apakah bot jalan |
| `pm2 logs pantun-bot` | Lihat log real-time |
| `pm2 restart pantun-bot` | Restart bot |
| `pm2 stop pantun-bot` | Hentikan bot |
| `pm2 delete pantun-bot` | Hapus dari PM2 |

---

## Troubleshooting

**Error: `remote: Permission denied`**
→ Belum setup SSH key atau token, ikuti Langkah 2.

**Error: `nothing to commit`**
→ Tidak mungkin terjadi karena README selalu diupdate dengan timestamp baru.

**Error: `could not read Username`**
→ Gunakan SSH key (Opsi A di Langkah 2).

---

## Estimasi Resource VPS

| Resource | Konsumsi |
|---|---|
| RAM | ~30–50 MB (Node.js idle) |
| CPU | ~0% (idle), spike kecil saat commit |
| Disk | Bertambah sangat kecil (log JSON ~5KB/100 commit) |

> ✅ **Aman di VPS 500MB RAM** — node-cron + script ini sangat ringan.
