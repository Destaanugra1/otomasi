#!/usr/bin/env python3
import json
import os
import random
import subprocess
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# === UBAH INI SESUAI LOKASI REPO KAMU ===
REPO_DIR = Path("/home/ubuntu/myrepo")
README_FILE = REPO_DIR / "README.md"
ENV_FILE = Path("/home/ubuntu/auto-git.env")

GITHUB_MODELS_URL = "https://models.github.ai/inference/chat/completions"

FALLBACK_PANTUN = [
    "Jalan ke pasar beli pepaya,\nCommit jalan tanpa banyak gaya.",
    "Burung nuri hinggap di dahan,\nPush otomatis penuh keindahan.",
    "Makan bakso dekat jembatan,\nREADME update demi masa depan.",
    "Ke warung beli es kelapa,\nBot menulis biar repo tak hampa.",
    "Ikan lele main gitar,\nCommit kecil biar repo bersinar.",
    "Naik sepeda ke kota tua,\nPush dua jam sekali, santai saja.",
    "Ada cicak di atas papan,\nKode bergerak penuh harapan.",
    "Beli ketan di hari Senin,\nRepo update walau admin lagi rebahan.",
]

COMMIT_MESSAGES = [
    "pantun ngopi dari robot gabut",
    "update receh tapi niat",
    "bot rebahan tetap berkarya",
    "readme disapa pantun random",
    "push otomatis anti bengong",
    "commit kecil penuh canda",
    "pantun masuk repo lagi",
    "robot nulis biar tidak sepi",
]


def load_env_file(path: Path):
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and value and key not in os.environ:
            os.environ[key] = value


def run(cmd):
    result = subprocess.run(
        cmd,
        cwd=REPO_DIR,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())

    return result.stdout.strip()


def ask_ai():
    token = os.environ.get("GITHUB_MODELS_TOKEN")
    model = os.environ.get("GITHUB_MODEL", "openai/gpt-4.1")

    if not token:
        raise RuntimeError("GITHUB_MODELS_TOKEN belum diset")

    prompt = (
        "Buat satu pantun komedi pendek berbahasa Indonesia untuk update README GitHub. "
        "Tema: VPS gabut, bot otomatis, coding santai. "
        "Format hanya 2 baris pantun, lucu, tidak toxic, tidak panjang, tanpa markdown."
    )

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "Kamu penulis pantun komedi Indonesia yang singkat dan ringan.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.9,
        "max_tokens": 80,
    }

    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        GITHUB_MODELS_URL,
        data=data,
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )

    with urllib.request.urlopen(request, timeout=25) as response:
        raw = response.read().decode("utf-8")
        parsed = json.loads(raw)

    content = parsed["choices"][0]["message"]["content"].strip()

    if not content:
        raise RuntimeError("AI memberi respons kosong")

    return content


def get_pantun():
    try:
        pantun = ask_ai()
        source = "AI"
    except Exception as error:
        pantun = random.choice(FALLBACK_PANTUN)
        source = f"Fallback: {error}"

    return pantun, source


def update_readme(pantun: str, source: str):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if README_FILE.exists():
        old_content = README_FILE.read_text(encoding="utf-8")
    else:
        old_content = "# Auto README\n\n"

    block = (
        "\n\n---\n"
        f"### Auto Pantun Update\n\n"
        f"**Waktu:** {now}\n\n"
        f"{pantun}\n\n"
        f"<!-- source: {source} -->\n"
    )

    README_FILE.write_text(old_content.rstrip() + block + "\n", encoding="utf-8")


def has_changes():
    status = run(["git", "status", "--porcelain"])
    return bool(status)


def main():
    load_env_file(ENV_FILE)

    if not REPO_DIR.exists():
        raise FileNotFoundError(f"Repo tidak ditemukan: {REPO_DIR}")

    pantun, source = get_pantun()
    update_readme(pantun, source)

    if not has_changes():
        print("Tidak ada perubahan. Commit dilewati.")
        return

    commit_message = random.choice(COMMIT_MESSAGES)

    run(["git", "add", "README.md"])
    run(["git", "commit", "-m", commit_message])
    run(["git", "push"])

    print("Berhasil push.")
    print(f"Commit message: {commit_message}")
    print(f"Sumber pantun: {source}")


if __name__ == "__main__":
    main()