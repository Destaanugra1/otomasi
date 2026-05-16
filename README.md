# 🤖 Otomasi GitHub dengan Pantun Comedy

> *Script ini berjalan otomatis setiap 2 jam dan mengupdate README dengan pantun comedy baru.*

---

## 🎭 Pantun Terbaru

> Beli bakso di pinggir jalan,
> Ditambah saos pedas manis,
> Commit message sudah dijalankan,
> Isinya pantun, bukan yang serius.

📚 *Dari koleksi hardcoded (AI tidak tersedia)* · *Tags: `commit` · `lucu`*

---

## 📊 Statistik

| Keterangan | Data |
|---|---|
| 🔢 Total Commit Otomatis | **22** kali |
| 🕐 Terakhir Update | `Sabtu, 16 Mei 2026 pukul 11.06.47` |
| ⏰ Interval | Setiap **2 jam** sekali |
| 🌏 Timezone | Asia/Jakarta (WIB) |

---

## 🛠️ Cara Kerja

```
┌─────────────────────────────────────────┐
│  node-cron  →  pilih pantun random      │
│      ↓                                  │
│  update README.md  →  git add           │
│      ↓                                  │
│  git commit (isi pantun)  →  git push   │
└─────────────────────────────────────────┘
```

- Jadwal: `0 */2 * * *` (setiap 2 jam)
- Bahasa: Node.js (ringan, ~500MB VPS aman)
- Commit message: pantun comedy (AI-generated atau dari koleksi 25 pantun hardcoded)
- AI: GitHub Models API (`gpt-4o-mini`) via `GITHUB_TOKEN`

---

## 📜 Koleksi Pantun

Script ini punya **25 pantun comedy hardcoded** sebagai fallback jika AI tidak tersedia.

---

*README ini diupdate otomatis oleh bot. Terakhir: Sabtu, 16 Mei 2026 pukul 11.06.47*
