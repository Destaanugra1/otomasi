const cron = require("node-cron");
const { execSync } = require("child_process");
const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── KONFIGURASI ──────────────────────────────────────────────────────────────
const CONFIG = {
  repoPath: __dirname,
  branch: "main",
  // commitEvery: "0 */2 * * *", 
  commitEvery: "* * * * * *", // setiap detik (TESTING ONLY)
  readmeFile: "README.md",
  logFile: "commit-log.json",
  timezone: "Asia/Jakarta",
};
// ──────────────────────────────────────────────────────────────────────────────

// ─── ENV LOADER ──────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}
loadEnv();
// ──────────────────────────────────────────────────────────────────────────────

// ─── KOLEKSI PANTUN COMEDY ────────────────────────────────────────────────────
const PANTUN_LIST = [
  {
    bait: [
      "Jalan-jalan ke kota Medan,",
      "Beli roti sama teh manis,",
      "Git push lagi sudah kebiasaan,",
      "Bug-nya mana? Itu urusan angin.",
    ],
    tags: ["git", "santai"],
  },
  {
    bait: [
      "Naik becak keliling kampung,",
      "Beli onde-onde tiga biji,",
      "Server jalan terus tak terganggu,",
      "RAM sisa 500MB, masih berani.",
    ],
    tags: ["server", "vps"],
  },
  {
    bait: [
      "Pergi ke warung beli es teh,",
      "Duduk santai di bawah pohon,",
      "Deploy selesai tanpa hambatan,",
      "Programmernya tidur, kodenya jalan.",
    ],
    tags: ["deploy", "tidur"],
  },
  {
    bait: [
      "Beli bakso di pinggir jalan,",
      "Ditambah saos pedas manis,",
      "Commit message sudah dijalankan,",
      "Isinya pantun, bukan yang serius.",
    ],
    tags: ["commit", "lucu"],
  },
  {
    bait: [
      "Makan nasi dengan lauk ayam,",
      "Minum jus mangga di sore hari,",
      "Kode jalan terus sampai malam,",
      "Programmernya? Entah ada di mana.",
    ],
    tags: ["malam", "programmer"],
  },
  {
    bait: [
      "Anak kecil main layang-layang,",
      "Terbang tinggi sampai awan biru,",
      "Cronjob jalan tanpa dihayang,",
      "Otomasi emang raja waktu.",
    ],
    tags: ["otomasi", "cron"],
  },
  {
    bait: [
      "Pergi ke sawah pagi-pagi,",
      "Bawa cangkul sama topi,",
      "GitHub hijau setiap hari,",
      "Padahal cuma update README ini.",
    ],
    tags: ["github", "contribution"],
  },
  {
    bait: [
      "Kucing tidur di atas meja,",
      "Tikus lewat dia tak peduli,",
      "Script jalan tanpa diawasi,",
      "Inilah arti otomasi sejati.",
    ],
    tags: ["otomasi", "tidur"],
  },
  {
    bait: [
      "Beli durian di pasar malam,",
      "Baunya menyengat ke mana-mana,",
      "Kode ini jalan siang dan malam,",
      "Siapa yang nulis? Nggak ada yang tanya.",
    ],
    tags: ["malam", "kode"],
  },
  {
    bait: [
      "Naik motor ke pantai selatan,",
      "Bawa bekal nasi goreng,",
      "VPS hemat RAM sejengkal,",
      "Tapi commit-nya tetap kenceng.",
    ],
    tags: ["vps", "hemat"],
  },
  {
    bait: [
      "Hujan deras di bulan Mei,",
      "Atap bocor sedikit ngeri,",
      "Commit message pakai pantun hari ini,",
      "Biar GitHub-nya tampak bervariasi.",
    ],
    tags: ["hujan", "variasi"],
  },
  {
    bait: [
      "Kakek tua jalan pelan-pelan,",
      "Bawa tongkat kayu jati,",
      "Otomasi ini jalan plan by plan,",
      "Setiap dua jam, tanpa henti.",
    ],
    tags: ["konsisten", "plan"],
  },
  {
    bait: [
      "Matahari terbit di ufuk timur,",
      "Sinarnya hangat menyapa bumi,",
      "Script ini jalan walau tanpa tidur,",
      "Karena Node.js tidak kenal ngantuk.",
    ],
    tags: ["pagi", "nodejs"],
  },
  {
    bait: [
      "Pedagang keliling bawa dagangan,",
      "Teriak-teriak menawarkan barang,",
      "README-ku update tiap putaran,",
      "Isinya pantun, yang lain belakang.",
    ],
    tags: ["readme", "update"],
  },
  {
    bait: [
      "Semut merah berbaris rapi,",
      "Gotong royong tanpa kenal capek,",
      "Script ini pun bekerja sendiri,",
      "Commit terus walau tak ada yang ngecek.",
    ],
    tags: ["kerja", "semut"],
  },
  {
    bait: [
      "Ikan mas berenang di kolam,",
      "Melompat tinggi kena jaring,",
      "Error 500 muncul tengah malam,",
      "Restart server, beres, lanjut pindang.",
    ],
    tags: ["error", "server"],
  },
  {
    bait: [
      "Pohon mangga berbuah lebat,",
      "Dipetik anak-anak sore hari,",
      "GitHub streak tidak akan terlambat,",
      "Ada otomasi yang menjaga diri.",
    ],
    tags: ["streak", "github"],
  },
  {
    bait: [
      "Burung pipit hinggap di dahan,",
      "Bernyanyi merdu sambil terbang,",
      "Commit message berisi pantun,",
      "Biar hidup terasa lapang.",
    ],
    tags: ["merdu", "lapang"],
  },
  {
    bait: [
      "Anak sekolah pulang siang,",
      "Mampir warung beli es lilin,",
      "Cron job jalan terus bersaing,",
      "Sama waktu, dia pasti menang.",
    ],
    tags: ["cron", "waktu"],
  },
  {
    bait: [
      "Nenek tua rajin menenun,",
      "Kain batik indah warnanya,",
      "Script ini pun rajin bekerja,",
      "Tanpa upah, tanpa hari tua.",
    ],
    tags: ["rajin", "kerja"],
  },
  {
    bait: [
      "Main congklak di teras rumah,",
      "Sambil ngemil kerupuk udang,",
      "Push ke GitHub sudah menjamah,",
      "Contribution graph makin melentang.",
    ],
    tags: ["contribution", "graph"],
  },
  {
    bait: [
      "Sapi makan rumput di padang,",
      "Tenang saja tidak tergesa,",
      "Server VPS pun sama adatnya,",
      "Jalan pelan tapi tak pernah lupa.",
    ],
    tags: ["vps", "stabil"],
  },
  {
    bait: [
      "Hujan gerimis di pagi buta,",
      "Katak melompat ke kolam ikan,",
      "AI yang nulis pantun ini semua,",
      "Manusianya tinggal buka GitHub-an.",
    ],
    tags: ["ai", "humor"],
  },
  {
    bait: [
      "Tukang cukur buka jam tujuh,",
      "Pelanggan antri panjang sekali,",
      "Otomasi ini tidak pernah luluh,",
      "Push tepat waktu setiap hari.",
    ],
    tags: ["tepat waktu", "disiplin"],
  },
  {
    bait: [
      "Nasi uduk dibungkus daun pisang,",
      "Dimakan hangat-hangat enak sekali,",
      "Commit ini datang tiap dua jam,",
      "Rajin pangkal pandai, malas? Ya sudahlah.",
    ],
    tags: ["rajin", "nasi uduk"],
  },
];
// ──────────────────────────────────────────────────────────────────────────────

// ─── AI PANTUN GENERATOR ─────────────────────────────────────────────────────

function generatePantunAI() {
  return new Promise((resolve, reject) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return reject(new Error("GITHUB_TOKEN tidak diset"));

    const body = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah pembuat pantun comedy Indonesia yang kreatif dan lucu. Selalu buat pantun 4 baris dengan pola rima ABAB. Sampiran di baris 1-2, isi/pesan di baris 3-4. Topik: pemrograman, server, VPS, git, atau developer life.",
        },
        {
          role: "user",
          content:
            "Buat 1 pantun comedy 4 baris dalam Bahasa Indonesia. Output HANYA 4 baris pantun, tanpa nomor, tanpa penjelasan, tanpa tanda kutip. Setiap baris diakhiri koma kecuali baris terakhir yang diakhiri titik.",
        },
      ],
      max_tokens: 120,
      temperature: 0.95,
    });

    const options = {
      hostname: "models.inference.ai.azure.com",
      path: "/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || "API error"));
          const text = json.choices[0].message.content.trim();
          const baris = text
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .slice(0, 4);
          if (baris.length !== 4) {
            return reject(new Error(`Format AI tidak valid (${baris.length} baris)`));
          }
          resolve({ bait: baris, tags: ["ai-generated"], aiGenerated: true });
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on("error", (e) => reject(new Error(`Network error: ${e.message}`)));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Request timeout (15s)"));
    });
    req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────────────────────────────────────

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function getRandomPantun() {
  const idx = Math.floor(Math.random() * PANTUN_LIST.length);
  return PANTUN_LIST[idx];
}

function formatPantunText(pantun) {
  return pantun.bait.join("\n");
}

function formatPantunMarkdown(pantun) {
  return pantun.bait.map((line) => `> ${line}`).join("\n");
}

function getWaktuSekarang() {
  return new Date().toLocaleString("id-ID", {
    timeZone: CONFIG.timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getISOWaktu() {
  return new Date().toLocaleString("sv-SE", {
    timeZone: CONFIG.timezone,
  });
}

function loadLog() {
  const logPath = path.join(CONFIG.repoPath, CONFIG.logFile);
  if (fs.existsSync(logPath)) {
    try {
      return JSON.parse(fs.readFileSync(logPath, "utf8"));
    } catch {
      return { totalCommit: 0, riwayat: [] };
    }
  }
  return { totalCommit: 0, riwayat: [] };
}

function saveLog(log) {
  const logPath = path.join(CONFIG.repoPath, CONFIG.logFile);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf8");
}

function hitungHariAktif(riwayat) {
  if (!riwayat.length) return 0;
  const hariUnik = new Set(
    riwayat.map((r) => new Date(r.waktu).toDateString())
  );
  return hariUnik.size;
}

// ──────────────────────────────────────────────────────────────────────────────

// ─── UPDATE README ────────────────────────────────────────────────────────────

function updateReadme(pantun, totalCommit, waktu, sumber = "hardcoded") {
  const readmePath = path.join(CONFIG.repoPath, CONFIG.readmeFile);
  const baris = formatPantunMarkdown(pantun);
  const tags = pantun.tags.map((t) => `\`${t}\``).join(" · ");
  const aiBadge =
    sumber === "ai"
      ? "🤖 *Digenerate oleh GitHub Copilot AI (GitHub Models)*"
      : "📚 *Dari koleksi hardcoded (AI tidak tersedia)*";

  const isiReadme = `# 🤖 Otomasi GitHub dengan Pantun Comedy

> *Script ini berjalan otomatis setiap 2 jam dan mengupdate README dengan pantun comedy baru.*

---

## 🎭 Pantun Terbaru

${baris}

${aiBadge} · *Tags: ${tags}*

---

## 📊 Statistik

| Keterangan | Data |
|---|---|
| 🔢 Total Commit Otomatis | **${totalCommit}** kali |
| 🕐 Terakhir Update | \`${waktu}\` |
| ⏰ Interval | Setiap **2 jam** sekali |
| 🌏 Timezone | Asia/Jakarta (WIB) |

---

## 🛠️ Cara Kerja

\`\`\`
┌─────────────────────────────────────────┐
│  node-cron  →  pilih pantun random      │
│      ↓                                  │
│  update README.md  →  git add           │
│      ↓                                  │
│  git commit (isi pantun)  →  git push   │
└─────────────────────────────────────────┘
\`\`\`

- Jadwal: \`0 */2 * * *\` (setiap 2 jam)
- Bahasa: Node.js (ringan, ~500MB VPS aman)
- Commit message: pantun comedy (AI-generated atau dari koleksi ${PANTUN_LIST.length} pantun hardcoded)
- AI: GitHub Models API (\`gpt-4o-mini\`) via \`GITHUB_TOKEN\`

---

## 📜 Koleksi Pantun

Script ini punya **${PANTUN_LIST.length} pantun comedy hardcoded** sebagai fallback jika AI tidak tersedia.

---

*README ini diupdate otomatis oleh bot. Terakhir: ${waktu}*
`;

  fs.writeFileSync(readmePath, isiReadme, "utf8");
  console.log(`[README] ✅ README.md berhasil diupdate`);
}

// ──────────────────────────────────────────────────────────────────────────────

// ─── GIT OPERATIONS ───────────────────────────────────────────────────────────

function gitExec(perintah) {
  return execSync(perintah, {
    cwd: CONFIG.repoPath,
    stdio: "pipe",
    encoding: "utf8",
  }).trim();
}

async function autoCommitPush() {
  let pantun;
  let sumber = "hardcoded";

  if (process.env.GITHUB_TOKEN) {
    try {
      console.log(`[AI] 🤖 Mencoba generate pantun via GitHub Copilot AI...`);
      pantun = await generatePantunAI();
      sumber = "ai";
      console.log(`[AI] ✅ Pantun berhasil digenerate oleh AI`);
    } catch (err) {
      console.warn(`[AI] ⚠️  AI gagal (${err.message}), fallback ke hardcoded`);
      pantun = getRandomPantun();
    }
  } else {
    console.log(`[AI] ℹ️  GITHUB_TOKEN tidak diset, pakai pantun hardcoded`);
    pantun = getRandomPantun();
  }

  const waktu = getWaktuSekarang();
  const isoWaktu = getISOWaktu();
  const log = loadLog();

  log.totalCommit += 1;
  log.riwayat.push({
    waktu: isoWaktu,
    sumber,
    pantun: pantun.bait,
    tags: pantun.tags,
  });

  // Simpan hanya 100 riwayat terakhir biar file tidak membengkak
  if (log.riwayat.length > 100) {
    log.riwayat = log.riwayat.slice(-100);
  }

  console.log(`\n[${waktu}] 🚀 Memulai auto commit #${log.totalCommit} (sumber: ${sumber})...`);
  console.log(`[PANTUN] 📜\n${formatPantunText(pantun)}\n`);

  try {
    // Update README dan log
    updateReadme(pantun, log.totalCommit, waktu, sumber);
    saveLog(log);

    // Git add
    gitExec(`git add ${CONFIG.readmeFile} ${CONFIG.logFile}`);
    console.log(`[GIT] ✅ git add selesai`);

    // Git commit dengan pantun sebagai message
    const commitMsg = formatPantunText(pantun);
    gitExec(`git commit -m "${commitMsg.replace(/"/g, "'")}"`);
    console.log(`[GIT] ✅ git commit selesai`);

    // Git push
    gitExec(`git push origin ${CONFIG.branch}`);
    console.log(`[GIT] ✅ git push ke branch '${CONFIG.branch}' selesai`);

    console.log(
      `[✅] Commit #${log.totalCommit} berhasil! Sumber: ${sumber} | Hari aktif: ${hitungHariAktif(log.riwayat)} hari\n`
    );
  } catch (err) {
    console.error(`[❌] Error saat commit/push:`, err.message);
    if (err.stderr) console.error(`[STDERR]`, err.stderr);
  }
}

// ──────────────────────────────────────────────────────────────────────────────

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const isDev = process.argv.includes("--dev");

console.log("╔═══════════════════════════════════════════╗");
console.log("║  🤖 Otomasi GitHub - Pantun Comedy Bot   ║");
console.log("╚═══════════════════════════════════════════╝");
console.log(`[INFO] Repo  : ${CONFIG.repoPath}`);
console.log(`[INFO] Branch: ${CONFIG.branch}`);
console.log(`[INFO] Jadwal: ${CONFIG.commitEvery} (setiap 2 jam)`);
console.log(`[INFO] Mode  : ${isDev ? "DEV (langsung jalan sekali)" : "PRODUCTION"}`);
console.log(`[INFO] AI    : ${process.env.GITHUB_TOKEN ? "✅ GITHUB_TOKEN terdeteksi" : "⚠️  Tidak ada token, pakai hardcoded"}`);
console.log(`[INFO] Waktu : ${getWaktuSekarang()}\n`);

if (isDev) {
  // Mode dev: langsung jalankan sekali tanpa nunggu cron
  console.log("[DEV] Menjalankan commit sekali untuk test...\n");
  autoCommitPush().catch((err) => console.error("[DEV] Fatal error:", err.message));
} else {
  // Mode production: jalankan cron setiap 2 jam
  cron.schedule(
    CONFIG.commitEvery,
    async () => {
      await autoCommitPush();
    },
    {
      timezone: CONFIG.timezone,
    }
  );

  console.log(
    `[CRON] ✅ Scheduler aktif. Akan commit otomatis setiap 2 jam.`
  );
  console.log(`[CRON] ⏳ Menunggu jadwal berikutnya...\n`);
}
// ──────────────────────────────────────────────────────────────────────────────
