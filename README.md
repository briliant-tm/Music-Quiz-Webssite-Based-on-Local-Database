# 🎵 LocalBeat: High-Octane Local Music Quiz

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-Python%20%7C%20Flask%20%7C%20Librosa-blueviolet)
![Vibe](https://img.shields.io/badge/Vibe-Cyberpunk%20%2F%20Arcade-ff0055)

<p align="center">
  <a href="#-english-version">🇺🇸 English Version</a> | 
  <a href="#-versi-bahasa-indonesia">🇮🇩 Versi Bahasa Indonesia</a>
</p>

---

<div id="-english-version"></div>

## 🇺🇸 English Version

> **"Turn your 3GB music folder into a Rhythm Arcade Game without lifting a finger."**

**LocalBeat** is a Python-based web application (Flask) that transforms your local music collection (MP3/FLAC/WAV) into an interactive, intelligent, and visually stunning music quiz game. No SQL database required, no manual metadata editing needed. **Just run and play.**

### ✨ Key Features

#### 🧠 The Brain (Backend Intelligence)
* **Auto-Scan Database:** Recursively scans thousands of songs from your local folder.
* **Smart "Drop" Detection:** Uses **Librosa AI** to analyze waveforms and automatically find the loudest/busiest part of a song (Climax/Drop).
* **The 20-20-60 Rule:** Dynamic question generation:
    * 20% Intro Guess (00:00).
    * 20% Outro Guess (Ending).
    * 60% Climax Guess (AI Analyzed).
* **Smart Caching:** Heavy audio analysis is done once and cached to JSON for instant replay.
* **Clean Name Protocol:** Automatically strips file extensions (`.mp3`) and detects separators (` - `) to split Artist and Title.

#### 👁️ The Eye (Visual Experience)
* **Mirror Visualizer:** Real-time audio spectrum that reflects symmetrically in the center of the screen (Web Audio API).
* **Dynamic Background:** The background reacts to the song's *Bass* intensity.
* **Glitch & CRT Transitions:** Aggressive *Cyberpunk Glitch* and *TV Switch-off* effects between questions.
* **Lobby Jukebox:** The landing page doubles as a music player with particle effects and Osu!-style "Now Playing" notifications.

### 🎮 Game Modes

1.  **CLASSIC MODE (Multiple Choice)**
    * Casual gameplay. 1 Correct Answer vs 3 Distractors.
    * Real-time progress bar (no fake CSS animations).
    * 3x Replay limit per question.

2.  **HARDCORE MODE (Typing Test)**
    * **Smart Parsing:** Guess Artist and Title separately.
    * **Split Scoring:** Artist points (50) are split evenly if there are collaborations (feat/&), Title points (50).
    * **Foreign Detection:** Files with Japanese/Korean/Foreign characters automatically switch to **"Guess the Folder Name"** mode.

### 🛠️ Tech Stack
* **Backend:** Python 3.x (Flask)
* **Audio Processing:** Librosa, NumPy, Mutagen
* **Frontend:** HTML5, CSS3 (Keyframes Animation), Vanilla JS
* **Audio Engine:** Web Audio API (Client-side Visualizer)

### 🚀 Installation & Usage

1.  **Clone & Setup**
    ```bash
    git clone [https://github.com/username/LocalBeat.git](https://github.com/briliant-tm/LocalBeat.git)
    cd LocalBeat
    pip install -r requirements.txt
    ```

2.  **Configure Music Path (IMPORTANT!)**
    Open `app.py` and find this line at the top:
    ```python
    # REPLACE WITH YOUR MUSIC FOLDER PATH
    MUSIC_FOLDER = r"D:\MyMusicCollection"
    ```

3.  **Run the Game**
    For the best experience (silent console), double-click:
    👉 **`Launcher.vbs`**
    
    *(Or run `python app.py` manually).*

---

<div id="-versi-bahasa-indonesia"></div>

## 🇮🇩 Versi Bahasa Indonesia

> **"Ubah folder musik 3GB-mu jadi game ritme arcade tanpa ribet."**

**LocalBeat** adalah aplikasi web berbasis Python (Flask) yang mengubah koleksi musik lokal (MP3/FLAC/WAV) menjadi game kuis tebak lagu yang interaktif, cerdas, dan visualnya memukau. Tidak perlu database SQL, tidak perlu edit metadata manual. **Tinggal run dan main.**

### ✨ Fitur Utama

#### 🧠 Otak (Kecerdasan Backend)
* **Auto-Scan Database:** Membaca ribuan lagu dari folder lokal secara rekursif.
* **Deteksi "Drop" Pintar:** Menggunakan **Librosa AI** untuk menganalisis waveform dan mencari bagian lagu yang paling "ramai" (Reff/Drop) secara otomatis.
* **Aturan 20-20-60:** Variasi soal dinamis:
    * 20% Tebak Intro (00:00).
    * 20% Tebak Outro (Ending).
    * 60% Tebak Climax (Hasil Analisis AI).
* **Smart Caching:** Analisis audio berat hanya dilakukan sekali, lalu disimpan ke JSON agar gameplay berikutnya instan.
* **Protokol Nama Bersih:** Otomatis membuang ekstensi (`.mp3`) dan mendeteksi pemisah (` - `) untuk memisahkan Artis dan Judul.

#### 👁️ Mata (Pengalaman Visual)
* **Visualizer Cermin:** Spektrum audio *real-time* yang memantul simetris di tengah layar (Web Audio API).
* **Background Dinamis:** Latar belakang bereaksi terhadap intensitas *Bass* lagu.
* **Transisi Glitch & CRT:** Transisi antar-soal menggunakan efek *Cyberpunk Glitch* dan *TV Switch-off* yang agresif ("Watahel" moment).
* **Lobby Jukebox:** Landing page berfungsi sebagai music player dengan partikel debu dan notifikasi "Now Playing" ala Osu!.

### 🎮 Mode Permainan

1.  **MODE KLASIK (Pilihan Ganda)**
    * Gameplay santai. 1 Jawaban Benar vs 3 Pengecoh.
    * Progress bar *real-time* (bukan animasi CSS palsu).
    * Batas 3x Replay per soal.

2.  **MODE HARDCORE (Ujian Mengetik)**
    * **Smart Parsing:** Menebak Artis dan Judul secara terpisah.
    * **Split Scoring:** Poin Artis (50) dibagi rata jika ada kolaborasi (feat/&), Poin Judul (50).
    * **Deteksi Asing:** File dengan karakter Jepang/Korea/Asing otomatis beralih ke mode **"Tebak Nama Folder"**.

### 🛠️ Teknologi
* **Backend:** Python 3.x (Flask)
* **Audio Processing:** Librosa, NumPy, Mutagen
* **Frontend:** HTML5, CSS3 (Keyframes Animation), Vanilla JS
* **Audio Engine:** Web Audio API (Client-side Visualizer)

### 🚀 Cara Install & Main

1.  **Clone & Setup**
    ```bash
    git clone [https://github.com/username/LocalBeat.git](https://github.com/briliant-tm/LocalBeat.git)
    cd LocalBeat
    pip install -r requirements.txt
    ```

2.  **Konfigurasi Folder Musik (PENTING!)**
    Buka file `app.py` dan cari baris ini di bagian atas:
    ```python
    # GANTI DENGAN PATH FOLDER MUSIK KAMU
    MUSIC_FOLDER = r"D:\KoleksiLagu\GedeBanget"
    ```

3.  **Jalankan Game**
    Untuk pengalaman terbaik tanpa jendela CMD yang mengganggu, klik dua kali file:
    👉 **`Launcher.vbs`**
    
    *(Atau jalankan `python app.py` secara manual di terminal).*

---

## 🕹️ Gameplay Mechanics (Mekanisme Skor)

Sistem penilaian **Hardcore Mode** LocalBeat sangat adil dan mendetail:

| Case / Kasus | Input User | Score | Logic / Logika |
| :--- | :--- | :--- | :--- |
| **Title / Judul** | "Numb" (Target: Numb) | **+50** | Fuzzy Match |
| **Solo Artist** | "Tulus" (Target: Tulus) | **+50** | Exact Match |
| **Duo Artist** | "Skrillex" (Target: Skrillex, Diplo) | **+25** | 50 Poin / 2 Artists |
| **Foreign/Folder** | "Anime" (Target: Folder Anime) | **+100** | Fallback Mode |

## 📂 Project Structure

```text
LocalBeat/
├── app.py              # Main Brain (Flask Server & Audio Logic)
├── audio_cache.json    # Librosa analysis cache (Auto-gen)
├── game_history.json   # Song history to avoid repetition (Auto-gen)
├── Launcher.vbs        # Silent Mode Launcher
├── Play.bat            # Batch file executor
├── static/
│   ├── css/style.css   # Styling (Glitch, Animations, Layout)
│   └── js/             # Frontend Logic (Visualizer, Game Loop)
└── templates/          # HTML Pages (Lobby & Arena)

```

---

## 📜 License

Project ini dibuat untuk tujuan edukasi dan hiburan pribadi ("Project Iseng").
**V-R1L Production © 2026**

Enjoy the beat! 🎧🔥

```

```
