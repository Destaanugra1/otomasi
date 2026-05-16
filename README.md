# 🤖 Otomasi GitHub dengan Pantun Comedy

> *Script ini berjalan otomatis setiap 2 jam dan mengupdate README dengan pantun comedy baru.*

---

## 🎭 Pantun Terbaru

> Membuat kode sambil ngemil kue,
> Di server ada bug, oh susahnya,
> Ganti branch di Git, hati-hati,
> Jangan sampai lost, nanti suda-eh.

🤖 *Digenerate oleh GitHub Copilot AI (GitHub Models)* · *Tags: `ai-generated`*

---

## 📊 Statistik

| Keterangan | Data |
|---|---|
| 🔢 Total Commit Otomatis | **31** kali |
| 🕐 Terakhir Update | `Sabtu, 16 Mei 2026 pukul 11.12.14` |
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

*README ini diupdate otomatis oleh bot. Terakhir: Sabtu, 16 Mei 2026 pukul 11.12.14*
