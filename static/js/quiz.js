const urlParams = new URLSearchParams(window.location.search);
const TOTAL_Q = parseInt(urlParams.get('count')) || 10;
const MODE = urlParams.get('mode') || 'CLASSIC';

let currentQ = 0;
let score = 0;
let replays = 3;
let currentPhase = 'INIT'; // LISTEN, ANSWER, RESULT
let nextData = null;
let timerInt = null;
let timeLeft = 30;

// AUDIO & VISUAL
const audio = document.getElementById('game-audio');
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
let audioCtx, analyser, source, animId;

window.onload = () => {
    document.getElementById('q-total').innerText = TOTAL_Q;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 2048;
    
    loadNextLevel();
    renderLoop();
};

function triggerGlitch(duration=300) {
    const g = document.getElementById('glitch-layer');
    g.classList.add('glitch-active');
    setTimeout(() => g.classList.remove('glitch-active'), duration);
}

function loadNextLevel() {
    if (currentQ >= TOTAL_Q) {
        alert(`GAME OVER. SCORE: ${score}`);
        window.location.href = '/';
        return;
    }
    
    triggerGlitch(500); // Macro Glitch
    currentPhase = 'LISTEN';
    replays = 3;
    document.getElementById('btn-replay').innerText = `REPLAY (${replays})`;
    document.getElementById('btn-replay').disabled = false;
    document.getElementById('feedback-panel').classList.remove('show');
    
    currentQ++;
    document.getElementById('q-curr').innerText = currentQ;

    fetch('/api/question').then(r=>r.json()).then(data => {
        nextData = data;
        setupUI();
        playAudio();
    });
}

function setupUI() {
    const container = document.getElementById('game-container');
    container.innerHTML = '';
    
    // Clue Logic (Anti-Spoiler)
    const clueBox = document.getElementById('clue-display');
    if (nextData.typing_type === 'FOLDER') {
        clueBox.innerText = ""; // Empty for Folder mode
    } else {
        clueBox.innerText = nextData.clue_content || "UNKNOWN SOURCE";
    }

    if (MODE === 'CLASSIC') {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        nextData.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.disabled = true; // Locked initially
            btn.onclick = () => submitAnswer(opt);
            grid.appendChild(btn);
        });
        container.appendChild(grid);
    } 
    else if (MODE === 'TYPING') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'typing-input';
        input.disabled = true; // Locked initially
        input.placeholder = "LISTENING...";
        input.onkeydown = (e) => { if(e.key==='Enter') submitAnswer(input.value); };
        container.appendChild(input);
    }
}

function playAudio() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    audio.src = `/stream_audio?type=quiz&t=${Date.now()}`;
    audio.currentTime = nextData.start_time;
    audio.play();
    
    // Progress Bar (Listen Phase)
    const bar = document.getElementById('progress-fill');
    bar.style.background = 'white';
    bar.style.transition = `width 15s linear`;
    bar.style.width = '100%';
    
    // Cutoff logic
    setTimeout(() => {
        if(currentPhase === 'LISTEN') {
            audio.pause();
            enterAnswerPhase();
        }
    }, 15000); // 15s clip
}

function enterAnswerPhase() {
    triggerGlitch(200); // Micro Glitch
    currentPhase = 'ANSWER';
    
    // Unlock UI
    if (MODE === 'CLASSIC') {
        document.querySelectorAll('.option-btn').forEach(b => b.disabled = false);
    } else {
        const inp = document.querySelector('.typing-input');
        inp.disabled = false;
        inp.placeholder = "IDENTIFY TARGET...";
        inp.focus();
    }

    // Timer Logic
    timeLeft = 30;
    const bar = document.getElementById('progress-fill');
    bar.style.transition = 'none'; bar.style.width = '100%';
    setTimeout(() => {
        bar.style.background = '#ff0055'; // Red alert
        bar.style.transition = 'width 30s linear';
        bar.style.width = '0%';
    }, 50);

    timerInt = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInt);
            submitAnswer("[TIME_UP]");
        }
    }, 1000);
}

function doReplay() {
    if (replays <= 0 || currentPhase === 'RESULT') return;
    triggerGlitch(200);
    replays--;
    document.getElementById('btn-replay').innerText = `REPLAY (${replays})`;
    if (replays===0) document.getElementById('btn-replay').disabled = true;
    
    clearInterval(timerInt);
    currentPhase = 'LISTEN';
    
    // Lock UI again
    if (MODE === 'CLASSIC') document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    else document.querySelector('.typing-input').disabled = true;

    playAudio();
}

function submitAnswer(ans) {
    if (currentPhase === 'RESULT') return;
    clearInterval(timerInt);
    currentPhase = 'RESULT';
    triggerGlitch(200);

    fetch('/submit_answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            answer: ans,
            game_mode: MODE,
            typing_type: nextData.typing_type
        })
    }).then(r=>r.json()).then(data => {
        showFeedback(data);
        score += data.score;
        document.getElementById('score-val').innerText = score;
        setTimeout(loadNextLevel, 4000);
    });
}

function showFeedback(data) {
    const panel = document.getElementById('feedback-panel');
    const status = document.getElementById('fb-status');
    const ans = document.getElementById('fb-ans');
    const pts = document.getElementById('fb-pts');

    panel.classList.add('show');
    if (data.correct || data.score > 0) {
        status.innerText = "CORRECT";
        status.style.color = "#00ff88";
    } else {
        status.innerText = "MISSED";
        status.style.color = "#ff0055";
    }
    ans.innerText = data.correct_answer;
    pts.innerText = `+${data.score} PTS`;
}

function forceNext() {
    clearInterval(timerInt);
    audio.pause();
    loadNextLevel();
}

function renderLoop() {
    requestAnimationFrame(renderLoop);
    const buffer = analyser.frequencyBinCount;
    const data = new Uint8Array(buffer);
    
    // Style switch based on phase
    if (currentPhase === 'LISTEN') {
        analyser.getByteTimeDomainData(data); // Waveform (Heartbeat)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
    } else {
        analyser.getByteFrequencyData(data); // Flatline / Low pulse
        ctx.strokeStyle = '#550000'; // Dark red
        ctx.lineWidth = 1;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath();

    const sliceWidth = canvas.width / buffer;
    let x = 0;
    
    // Dynamic BG Logic
    let totalAmp = 0;

    for(let i=0; i<buffer; i++) {
        let v = data[i] / 128.0;
        if (currentPhase !== 'LISTEN') v = 1 + (data[i]/2048.0); // Flatline vibe
        
        const y = v * canvas.height/2;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        x += sliceWidth;
        totalAmp += data[i];
    }
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();

    // BG Update
    const bg = document.getElementById('dynamic-bg');
    if (currentPhase === 'LISTEN') {
        const intensity = (totalAmp / buffer - 128) * 2; // High gain
        const hue = 200 + intensity;
        bg.style.background = `radial-gradient(circle at center, hsla(${hue}, 60%, 15%, ${0.2 + intensity/50}) 0%, #000 100%)`;
    } else {
        bg.style.background = `radial-gradient(circle at center, #100 0%, #000 100%)`; // Red Alert BG
    }
}