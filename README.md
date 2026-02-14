# 🎵 LocalBeat: High-Octane Local Music Quiz

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-Python%20%7C%20Flask%20%7C%20Librosa-blueviolet)
![Vibe](https://img.shields.io/badge/Vibe-Cyberpunk%20%2F%20Arcade-ff0055)

> **"Turn your 3GB music folder into a Rhythm Arcade Game without lifting a finger."**

LocalBeat adalah aplikasi web berbasis Python (Flask) yang mengubah koleksi musik lokal (MP3/FLAC/WAV) menjadi game kuis tebak lagu yang interaktif, cerdas, dan visualnya memukau. Tidak perlu database SQL, tidak perlu edit metadata manual. *Just run and play.*

---

## ✨ Segudang Fitur (Features)

### 🧠 The Brain (Backend Intelligence)
* **Auto-Scan Database:** Membaca ribuan lagu dari folder lokal secara rekursif.
* **Smart "Drop" Detection:** Menggunakan **Librosa AI** untuk menganalisis waveform dan mencari bagian lagu yang paling "ramai" (Climax/Drop) secara otomatis.
* **The 20-20-60 Rule:** Variasi soal dinamis:
    * 20% Tebak Intro (00:00).
    * 20% Tebak Outro (Ending).
    * 60% Tebak Climax (AI Analyzed).
* **Smart Caching:** Analisis audio berat hanya dilakukan sekali, lalu disimpan ke JSON agar gameplay berikutnya instan.
* **Clean Name Protocol:** Otomatis membersihkan ekstensi `.mp3` dan mendeteksi separator ` - ` untuk memisahkan Artis dan Judul.

### 👁️ The Eye (Visual Experience)
* **Mirror Visualizer:** Spektrum audio *real-time* yang memantul simetris di tengah layar (Web Audio API).
* **Dynamic Background:** Latar belakang bereaksi terhadap intensitas *Bass* lagu.
* **Glitch & CRT Transitions:** Transisi antar-soal menggunakan efek *Cyberpunk Glitch* dan *TV Switch-off* yang agresif.
* **Lobby Jukebox:** Landing page berfungsi sebagai music player dengan partikel debu dan notifikasi "Now Playing" ala Osu!.

### 🎮 Game Modes
1.  **CLASSIC MODE (Pilihan Ganda)**
    * Santai. 1 Jawaban Benar vs 3 Pengecoh.
    * Progress bar *real-time* (bukan animasi CSS palsu).
    * 3x Replay per soal.

2.  **HARDCORE MODE (Typing Test)**
    * **Smart Parsing:** Menebak Artis dan Judul secara terpisah.
    * **Split Scoring:** Poin Artis (50) dibagi rata jika ada kolaborasi (feat/&), Poin Judul (50).
    * **Foreign Detection:** File dengan karakter Jepang/Korea/Asing otomatis beralih ke mode **"Tebak Nama Folder"**.

---

## 🛠️ Tech Stack

* **Backend:** Python 3.x (Flask)
* **Audio Processing:** Librosa, NumPy, Mutagen
* **Frontend:** HTML5, CSS3 (Keyframes Animation), Vanilla JS
* **Audio Engine:** Web Audio API (Client-side Visualizer)

---

## 🚀 Cara Install & Main (Installation)

### Prasyarat
Pastikan kamu sudah menginstall [Python](https://www.python.org/downloads/) dan [FFmpeg](https://ffmpeg.org/download.html) (opsional, tapi disarankan untuk Librosa).

### 1. Clone & Setup
```bash
git clone [https://github.com/username/LocalBeat.git](https://github.com/username/LocalBeat.git)
cd LocalBeat
pip install -r requirements.txt
