import os
import random
import json
import time
import hashlib
import numpy as np
import librosa
from flask import Flask, render_template, jsonify, send_file, request, session
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.wave import WAVE

app = Flask(__name__)
app.secret_key = 'localbeat_secret_key_vr1l'

# ==========================================
# KONFIGURASI PATH DATABASE (EDIT DI SINI)
# ==========================================
MUSIC_FOLDER = r"D:\PATH\KE\FOLDER\MUSIK\ANDA" 
# ==========================================

CACHE_FILE = 'audio_cache.json'
HISTORY_FILE = 'game_history.json'

def load_json(filename):
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return {}

def save_json(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f)

def get_all_songs():
    songs = []
    for root, dirs, files in os.walk(MUSIC_FOLDER):
        for file in files:
            if file.lower().endswith(('.mp3', '.flac', '.wav')):
                songs.append(os.path.join(root, file))
    return songs

def get_smart_random_song():
    songs = get_all_songs()
    if not songs: return None

    history = load_json(HISTORY_FILE)
    recent_list = history.get('recent', [])

    # Retry mechanism to avoid repetition
    for _ in range(5):
        selected = random.choice(songs)
        
        if selected in recent_list:
            # 15% Chance to allow repeat, 85% chance to reroll
            if random.random() < 0.15:
                return selected
        else:
            return selected
            
    return selected 

def update_history(song_path):
    history = load_json(HISTORY_FILE)
    recent = history.get('recent', [])
    
    recent.append(song_path)
    # Keep memory of last 50 songs
    if len(recent) > 50:
        recent.pop(0)
        
    save_json(HISTORY_FILE, {'recent': recent})

def analyze_drop(file_path, duration):
    cache = load_json(CACHE_FILE)
    if file_path in cache:
        return cache[file_path]

    try:
        # Scan middle of the song to save time
        scan_duration = min(60, duration)
        offset = (duration - scan_duration) / 2
        
        y, sr = librosa.load(file_path, sr=22050, offset=offset, duration=scan_duration, mono=True)
        rms = librosa.feature.rms(y=y)[0]
        
        # Find frame with max energy
        max_frame = np.argmax(rms)
        drop_time = offset + librosa.frames_to_time(max_frame, sr=sr)
        
        cache[file_path] = drop_time
        save_json(CACHE_FILE, cache)
        return drop_time
    except:
        return duration / 2

def get_audio_duration(path):
    try:
        if path.endswith('.mp3'): audio = MP3(path)
        elif path.endswith('.flac'): audio = FLAC(path)
        elif path.endswith('.wav'): audio = WAVE(path)
        else: return 0
        return audio.info.length
    except:
        return 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/quiz')
def quiz_page():
    return render_template('quiz.html')

@app.route('/api/bgm')
def get_bgm():
    song = get_smart_random_song()
    if not song: return jsonify({'error': 'No songs'})
    
    duration = get_audio_duration(song)
    start = random.uniform(0, max(0, duration - 60))
    
    filename = os.path.basename(song)
    title = os.path.splitext(filename)[0]
    
    session['stream_path'] = song
    
    return jsonify({
        'title': title,
        'start': start,
        'path_token': hashlib.md5(song.encode()).hexdigest() 
    })

@app.route('/api/question')
def get_question():
    target_song = get_smart_random_song()
    update_history(target_song)
    session['current_track'] = target_song
    
    duration = get_audio_duration(target_song)
    
    # 20-20-60 Logic
    mode_roll = random.random()
    start_time = 0
    mode = "RANDOM"

    if mode_roll <= 0.2:
        start_time = 0
        mode = "INTRO"
    elif mode_roll <= 0.4:
        start_time = max(0, duration - 30)
        mode = "OUTRO"
    else:
        # Drop Analysis
        start_time = analyze_drop(target_song, duration)
        # Shift back 5 seconds to build up to the drop
        start_time = max(0, start_time - 5)
        mode = "CLIMAX"

    session['start_time'] = start_time

    # Generate Options
    correct_name = os.path.splitext(os.path.basename(target_song))[0]
    folder_clue = os.path.basename(os.path.dirname(target_song))
    
    all_songs = get_all_songs()
    distractors = []
    while len(distractors) < 3:
        s = random.choice(all_songs)
        name = os.path.splitext(os.path.basename(s))[0]
        if name != correct_name and name not in distractors:
            distractors.append(name)
            
    options = distractors + [correct_name]
    random.shuffle(options)
    
    return jsonify({
        'clue': folder_clue,
        'options': options,
        'mode': mode,
        'start_time': start_time,
        'correct_hash': hashlib.md5(correct_name.encode()).hexdigest()
    })

@app.route('/stream_audio')
def stream_audio():
    # Helper to stream active track securely
    path = session.get('current_track')
    # Or specific path for BGM
    if request.args.get('token'):
        path = session.get('stream_path')
        
    if path and os.path.exists(path):
        return send_file(path)
    return "Error", 404

@app.route('/submit_answer', methods=['POST'])
def check_answer():
    data = request.json
    target_path = session.get('current_track')
    correct_name = os.path.splitext(os.path.basename(target_path))[0]
    
    is_correct = data['answer'] == correct_name
    return jsonify({
        'correct': is_correct,
        'correct_answer': correct_name
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')