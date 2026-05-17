const cron = require("node-cron");
const { execFileSync } = require("child_process");
const https = require("https");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  repoPath: __dirname,
  branch: "main",
  commitEvery: "0 */5 * * *",
  readmeFile: "README.md",
  logFile: "commit-log.json",
  timezone: "Asia/Jakarta",
  logRetentionDays: 3,
};

const CONTENT_ORDER = ["puisi", "pantun", "quote"];

const CONTENT_META = {
  puisi: {
    label: "Puisi",
    minLines: 4,
    maxLines: 4,
    systemPrompt:
      "Kamu adalah penulis puisi Indonesia. Tulis puisi yang hangat, sederhana, dan bertema bebas. Jangan menyinggung AI, teknologi, coding, server, git, atau developer life.",
    userPrompt:
      "Buat 1 puisi pendek 4 baris dalam Bahasa Indonesia. Output hanya 4 baris, tanpa judul, tanpa nomor, tanpa tanda kutip.",
  },
  pantun: {
    label: "Pantun Jenaka",
    minLines: 4,
    maxLines: 4,
    systemPrompt:
      "Kamu adalah pembuat pantun jenaka Indonesia. Tulis pantun lucu bertema bebas dengan pola 4 baris. Jangan menyinggung AI, teknologi, coding, server, git, atau developer life.",
    userPrompt:
      "Buat 1 pantun jenaka 4 baris dalam Bahasa Indonesia. Output hanya 4 baris, tanpa nomor, tanpa penjelasan, tanpa tanda kutip.",
  },
  quote: {
    label: "Quote",
    minLines: 1,
    maxLines: 2,
    systemPrompt:
      "Kamu adalah penulis quote Bahasa Indonesia. Tulis quote singkat yang ringan, hangat, dan bertema bebas. Jangan menyinggung AI, teknologi, coding, server, git, atau developer life.",
    userPrompt:
      "Buat 1 quote singkat dalam Bahasa Indonesia. Output hanya 1 sampai 2 baris, tanpa nomor, tanpa tanda kutip.",
  },
};

const CONTENT_LIBRARY = {
  puisi: [
    [
      "Pagi turun pelan di ujung jendela,",
      "Angin singgah membawa kabar sederhana,",
      "Tidak semua jalan harus tergesa,",
      "Kadang tenang adalah cara hati bernyawa.",
    ],
    [
      "Senja menaruh jingga di daun tua,",
      "Burung pulang tanpa banyak suara,",
      "Yang baik tidak selalu datang segera,",
      "Tapi sering tinggal lebih lama dari luka.",
    ],
    [
      "Hujan kecil jatuh di halaman rumah,",
      "Tanah basah menyimpan harum yang ramah,",
      "Kalau hari ini langkah terasa susah,",
      "Besok bisa jadi datang lebih indah.",
    ],
  ],
  pantun: [
    [
      "Pagi-pagi beli roti bakar,",
      "Pulangnya mampir beli pepaya,",
      "Kalau tertawa jangan ditahan sebentar,",
      "Nanti dikira lagi latihan sandiwara.",
    ],
    [
      "Naik sepeda ke pinggir kali,",
      "Singgah sebentar membeli ketan,",
      "Mukanya serius dari tadi pagi,",
      "Padahal sendalnya beda pasangan.",
    ],
    [
      "Beli cilok dekat lampu merah,",
      "Makannya sambil duduk di bangku,",
      "Katanya mau hidup lebih megah,",
      "Bangun siang saja masih berlaku.",
    ],
  ],
  quote: [
    ["Tidak semua hal harus cepat, yang penting tidak berhenti."],
    ["Hari yang tenang sering menyelesaikan lebih banyak daripada hari yang ribut."],
    ["Kalau langkahmu kecil tapi tetap maju, itu tetap kabar baik."],
  ],
};

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickContentType(totalCommit) {
  return CONTENT_ORDER[totalCommit % CONTENT_ORDER.length];
}

function getFallbackContent(type) {
  return {
    type,
    label: CONTENT_META[type].label,
    lines: [...getRandomItem(CONTENT_LIBRARY[type])],
    aiGenerated: false,
  };
}

function normalizeLines(text, maxLines) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);
}

function generateContentAI(type) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Promise.reject(new Error("GITHUB_TOKEN tidak diset"));
  }

  const meta = CONTENT_META[type];
  const body = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: meta.systemPrompt },
      { role: "user", content: meta.userPrompt },
    ],
    max_tokens: 140,
    temperature: 1,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "models.inference.ai.azure.com",
        path: "/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message || "API error"));
              return;
            }

            const text = json.choices?.[0]?.message?.content?.trim();
            if (!text) {
              reject(new Error("Respons AI kosong"));
              return;
            }

            const lines = normalizeLines(text, meta.maxLines);
            if (lines.length < meta.minLines || lines.length > meta.maxLines) {
              reject(new Error(`Format AI tidak valid (${lines.length} baris)`));
              return;
            }

            resolve({
              type,
              label: meta.label,
              lines,
              aiGenerated: true,
            });
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      }
    );

    req.on("error", (error) => reject(new Error(`Network error: ${error.message}`)));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Request timeout (15s)"));
    });
    req.write(body);
    req.end();
  });
}

function formatContentMarkdown(content) {
  return content.lines.map((line) => `> ${line}`).join("\n");
}

function getDisplayTime() {
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

function loadLog() {
  const logPath = path.join(CONFIG.repoPath, CONFIG.logFile);
  if (!fs.existsSync(logPath)) {
    return { totalCommit: 0, riwayat: [] };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(logPath, "utf8"));
    return {
      totalCommit: Number.isFinite(parsed.totalCommit) ? parsed.totalCommit : 0,
      riwayat: Array.isArray(parsed.riwayat) ? parsed.riwayat : [],
    };
  } catch {
    return { totalCommit: 0, riwayat: [] };
  }
}

function saveLog(log) {
  const logPath = path.join(CONFIG.repoPath, CONFIG.logFile);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf8");
}

function getEntryTimestamp(entry) {
  if (typeof entry?.timestamp === "number" && Number.isFinite(entry.timestamp)) {
    return entry.timestamp;
  }

  if (typeof entry?.timestamp === "string" && entry.timestamp.trim()) {
    const asNumber = Number(entry.timestamp);
    if (Number.isFinite(asNumber)) return asNumber;

    const parsedTimestamp = Date.parse(entry.timestamp);
    if (!Number.isNaN(parsedTimestamp)) return parsedTimestamp;
  }

  if (typeof entry?.waktu === "string" && entry.waktu.trim()) {
    const parsedLegacy = Date.parse(entry.waktu.replace(" ", "T"));
    if (!Number.isNaN(parsedLegacy)) return parsedLegacy;
  }

  return Date.now();
}

function pruneOldEntries(log) {
  const retentionMs = CONFIG.logRetentionDays * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  log.riwayat = log.riwayat.filter((entry) => getEntryTimestamp(entry) >= cutoff);
  return log;
}

function countActiveDays(entries) {
  if (!entries.length) return 0;

  const uniqueDays = new Set(
    entries.map((entry) => new Date(getEntryTimestamp(entry)).toDateString())
  );
  return uniqueDays.size;
}

function updateReadme(content, totalCommit, waktu, sourceLabel, logCount) {
  const readmePath = path.join(CONFIG.repoPath, CONFIG.readmeFile);
  const body = formatContentMarkdown(content);

  const readme = `# Otomasi GitHub: Puisi, Pantun, dan Quote

## ${content.label} Terbaru

${body}

*Sumber: ${sourceLabel}*  
*Update: ${waktu}*

## Ringkasan

| Keterangan | Data |
| --- | --- |
| Interval | Setiap 5 jam |
| Rotasi | Puisi -> Pantun Jenaka -> Quote |
| Log aktif | ${logCount} entri terakhir dalam 3 hari |
| Total commit otomatis | ${totalCommit} kali |
| Timezone | Asia/Jakarta (WIB) |

README ini digenerate otomatis dari \`index.js\`.
`;

  fs.writeFileSync(readmePath, readme, "utf8");
}

function gitExec(args) {
  return execFileSync("git", args, {
    cwd: CONFIG.repoPath,
    stdio: "pipe",
    encoding: "utf8",
  }).trim();
}

async function autoCommitPush() {
  const log = pruneOldEntries(loadLog());
  const type = pickContentType(log.totalCommit);
  const meta = CONTENT_META[type];

  let content = getFallbackContent(type);
  let source = "koleksi lokal";

  if (process.env.GITHUB_TOKEN) {
    try {
      content = await generateContentAI(type);
      source = "AI GitHub Models";
    } catch (error) {
      console.log(`[AI] Gagal untuk ${meta.label.toLowerCase()}, pakai koleksi lokal: ${error.message}`);
    }
  }

  const waktu = getDisplayTime();

  log.totalCommit += 1;
  log.riwayat.push({
    timestamp: Date.now(),
    waktu,
    sumber: source,
    jenis: content.type,
    isi: content.lines,
  });
  pruneOldEntries(log);

  console.log(`[RUN] ${waktu} | ${meta.label} | ${source}`);

  try {
    updateReadme(content, log.totalCommit, waktu, source, log.riwayat.length);
    saveLog(log);

    gitExec(["add", CONFIG.readmeFile, CONFIG.logFile]);

    const commitMessage = `${content.label}: ${content.lines.join(" / ")}`;
    gitExec(["commit", "-m", commitMessage]);
    gitExec(["push", "origin", CONFIG.branch]);

    console.log(
      `[OK] Commit #${log.totalCommit} selesai | log aktif: ${log.riwayat.length} | hari aktif: ${countActiveDays(log.riwayat)}`
    );
  } catch (error) {
    console.error(`[ERROR] Commit atau push gagal: ${error.message}`);
    if (error.stderr) {
      console.error(error.stderr.trim());
    }
  }
}

function printStartup(isDev) {
  console.log(`[BOT] Branch   : ${CONFIG.branch}`);
  console.log(`[BOT] Jadwal   : ${CONFIG.commitEvery} (setiap 5 jam)`);
  console.log(`[BOT] Rotasi   : Puisi -> Pantun Jenaka -> Quote`);
  console.log(`[BOT] Log aktif: ${CONFIG.logRetentionDays} hari terakhir`);
  console.log(`[BOT] Mode     : ${isDev ? "DEV" : "CRON"}`);
  console.log(`[BOT] AI       : ${process.env.GITHUB_TOKEN ? "aktif" : "fallback koleksi lokal"}`);
}

const isDev = process.argv.includes("--dev");

printStartup(isDev);

if (isDev) {
  autoCommitPush().catch((error) => {
    console.error(`[FATAL] ${error.message}`);
  });
} else {
  cron.schedule(CONFIG.commitEvery, autoCommitPush, {
    timezone: CONFIG.timezone,
  });

  console.log("[BOT] Scheduler aktif. Menunggu jadwal berikutnya.");
}
