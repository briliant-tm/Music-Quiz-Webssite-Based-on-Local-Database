import os
import random
import json
import time
import hashlib
import threading
import webbrowser
import numpy as np
import librosa
from flask import Flask, render_template, jsonify, send_file, request, session

app = Flask(__name__)
app.secret_key = 'localbeat_secret_key_vr1l_secure'

# ==========================================
# GANTI PATH DI BAWAH INI DENGAN LOKASI FOLDER MUSIKMU
# ==========================================
MUSIC_FOLDER = r"D:\PATH\KE\FOLDER\MUSIK\ANDA" 
# ==========================================

CACHE_FILE = 'audio_cache.json'
HISTORY_FILE = 'game_history.json'

def load_json(filename):
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f: return json.load(f)
        except: return {}
    return {}

def save_json(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f)

def get_all_songs():
    songs = []
    if not os.path.exists(MUSIC_FOLDER): return []
    for root, dirs, files in os.walk(MUSIC_FOLDER):
        for file in files:
            if file.lower().endswith(('.mp3', '.flac', '.wav', '.ogg')):
                songs.append(os.path.join(root, file))
    return songs

def get_smart_random_song():
    songs = get_all_songs()
    if not songs: return None

    history = load_json(HISTORY_FILE)
    recent_list = history.get('recent', [])

    for _ in range(10):
        selected = random.choice(songs)
        if selected in recent_list:
            if random.random() < 0.15: 
                return selected
        else:
            return selected
    return selected 

def update_history(song_path):
    history = load_json(HISTORY_FILE)
    recent = history.get('recent', [])
    if song_path in recent:
        recent.remove(song_path)
    recent.append(song_path)
    if len(recent) > 20: recent.pop(0)
    save_json(HISTORY_FILE, {'recent': recent})

def analyze_drop(file_path, duration):
    cache = load_json(CACHE_FILE)
    if file_path in cache: return cache[file_path]

    try:
        scan_dur = min(45, duration)
        offset = (duration - scan_dur) / 2
        y, sr = librosa.load(file_path, sr=22050, offset=offset, duration=scan_dur, mono=True)
        rms = librosa.feature.rms(y=y)[0]
        max_frame = np.argmax(rms)
        drop_time = offset + librosa.frames_to_time(max_frame, sr=sr)
        
        cache[file_path] = drop_time
        save_json(CACHE_FILE, cache)
        return drop_time
    except:
        return duration / 2

def get_audio_duration(path):
    try:
        return librosa.get_duration(path=path)
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
    if not song: return jsonify({'error': 'No songs found'})
    
    dur = get_audio_duration(song)
    start = random.uniform(0, max(0, dur - 40))
    
    filename = os.path.basename(song)
    title = os.path.splitext(filename)[0]
    session['bgm_path'] = song
    
    return jsonify({
        'title': title,
        'start': start,
        'token': hashlib.md5(str(time.time()).encode()).hexdigest()
    })

@app.route('/api/question')
def get_question():
    target = get_smart_random_song()
    if not target: return jsonify({'error': 'Database Empty'})
    
    update_history(target)
    session['quiz_path'] = target
    dur = get_audio_duration(target)
    
    roll = random.random()
    start = 0
    mode = "RANDOM"

    if roll <= 0.2:
        start = 0
        mode = "INTRO"
    elif roll <= 0.4:
        start = max(0, dur - 30)
        mode = "OUTRO"
    else:
        drop = analyze_drop(target, dur)
        start = max(0, drop - 5)
        mode = "CLIMAX"

    session['start_time'] = start
    
    correct = os.path.splitext(os.path.basename(target))[0]
    folder = os.path.basename(os.path.dirname(target))
    
    all_s = get_all_songs()
    opts = [correct]
    while len(opts) < 4:
        s = random.choice(all_s)
        n = os.path.splitext(os.path.basename(s))[0]
        if n not in opts: opts.append(n)
    
    random.shuffle(opts)
    
    return jsonify({
        'clue': folder,
        'options': opts,
        'mode': mode,
        'start_time': start,
        'duration': dur
    })

@app.route('/stream_audio')
def stream_audio():
    mode = request.args.get('type')
    path = session.get('bgm_path') if mode == 'bgm' else session.get('quiz_path')
    
    if path and os.path.exists(path):
        return send_file(path)
    return "Error", 404

@app.route('/submit_answer', methods=['POST'])
def check_answer():
    data = request.json
    target = session.get('quiz_path')
    correct = os.path.splitext(os.path.basename(target))[0]
    is_correct = data.get('answer') == correct
    return jsonify({'correct': is_correct, 'correct_answer': correct})

@app.route('/shutdown', methods=['POST'])
def shutdown():
    os._exit(0)

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == '__main__':
    threading.Timer(1.5, open_browser).start()
    app.run(host='0.0.0.0', debug=False)