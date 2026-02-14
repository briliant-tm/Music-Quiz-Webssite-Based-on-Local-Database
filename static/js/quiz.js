const urlParams = new URLSearchParams(window.location.search);
const TOTAL_QUESTIONS = parseInt(urlParams.get('count')) || 20;
let currentQ = 0;
let score = 0;
let replays = 3;
let isPlaying = false;
let nextData = null;
const CLIP_DURATION = 15.0; // Detik durasi kuis per soal

// Elements
const audio = document.getElementById('game-audio');
const overlayCount = document.getElementById('overlay-countdown');
const overlayOver = document.getElementById('overlay-gameover');
const countTxt = document.getElementById('countdown-text');
const replayBtn = document.getElementById('btn-replay');
const progressFill = document.getElementById('progress-fill');
const bg = document.getElementById('dynamic-bg');

// Audio Context for Quiz Visualizer
let audioCtx, analyser, source;
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
let animFrameId;

window.onload = () => {
    document.getElementById('q-total').innerText = TOTAL_QUESTIONS;
    setTimeout(() => {
        document.getElementById('page-transition').style.opacity = '0';
        setTimeout(() => document.getElementById('page-transition').style.display = 'none', 500);
        
        // Init Web Audio API
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 128;

        loadNextLevel();
    }, 500);
};

function loadNextLevel() {
    if (currentQ >= TOTAL_QUESTIONS) {
        document.getElementById('final-score').innerText = score;
        overlayOver.style.display = 'flex';
        return;
    }

    overlayCount.style.display = 'flex';
    let timerVal = 3;
    countTxt.innerText = timerVal;
    document.getElementById('countdown-sub').innerText = "FETCHING AUDIO DATA...";
    progressFill.style.width = '0%';

    fetch('/api/question')
        .then(res => res.json())
        .then(data => {
            nextData = data;
            audio.src = '/stream_audio?type=quiz&t=' + Date.now();
            audio.load();
        });

    const timer = setInterval(() => {
        timerVal--;
        if(timerVal > 0) {
            countTxt.innerText = timerVal;
            if(timerVal === 1) document.getElementById('countdown-sub').innerText = "SYNCING WAVEFORM...";
        } else {
            clearInterval(timer);
            overlayCount.style.display = 'none';
            startRound();
        }
    }, 1000);
}

function startRound() {
    currentQ++;
    document.getElementById('q-current').innerText = currentQ;
    replays = 3;
    updateReplayBtn();
    
    document.getElementById('clue-text').innerText = nextData.clue;
    const modeBadge = document.getElementById('mode-badge');
    modeBadge.innerText = "MODE: " + nextData.mode;
    
    if(nextData.mode === "CLIMAX") modeBadge.style.color = "#ff0055";
    else if(nextData.mode === "INTRO") modeBadge.style.color = "#00e5ff";
    else modeBadge.style.color = "#fff";
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    nextData.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => fadeOutAndSubmit(opt, btn);
        container.appendChild(btn);
    });

    playAudioWithFade();
}

function playAudioWithFade() {
    if(replays <= 0) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    audio.currentTime = nextData.start_time;
    audio.volume = 0;
    audio.play();
    
    let vol = 0;
    const fade = setInterval(() => {
        if(vol < 1.0) { vol += 0.1; audio.volume = Math.min(1, vol); }
        else clearInterval(fade);
    }, 50);

    isPlaying = true;
    replayBtn.disabled = true;
    replayBtn.innerText = "LISTENING...";
    
    // Realtime Progress Bar & Visualizer
    cancelAnimationFrame(animFrameId);
    updateGameLoop();
}

function updateGameLoop() {
    if(!isPlaying) return;
    
    // 1. Progress Bar Logic
    const elapsedTime = audio.currentTime - nextData.start_time;
    let progress = (elapsedTime / CLIP_DURATION) * 100;
    
    if(progress >= 100 || audio.ended) {
        progress = 100;
        audio.pause();
        handleClipEnd();
    }
    progressFill.style.width = `${progress}%`;

    // 2. Visualizer Logic
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let totalEnergy = 0;
    const barWidth = (canvas.width / bufferLength) * 2;
    
    for(let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] * 1.5; 
        totalEnergy += dataArray[i];

        ctx.fillStyle = `rgba(0, 229, 255, 0.2)`;
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
    }

    // BG Pulse
    const avgVol = totalEnergy / bufferLength;
    let opacity = Math.min(0.6, avgVol / 100);
    bg.style.background = `radial-gradient(circle at center, rgba(26,11,46,${opacity}) 0%, #000000 100%)`;

    animFrameId = requestAnimationFrame(updateGameLoop);
}

function handleClipEnd() {
    replays--;
    isPlaying = false;
    updateReplayBtn();
    
    // Reset BG
    bg.style.background = `radial-gradient(circle at center, #1a0b2e 0%, #000000 100%)`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateReplayBtn() {
    if(replays <= 0) {
        replayBtn.innerText = "SIGNAL LOST (0)";
        replayBtn.disabled = true;
        replayBtn.style.opacity = '0.5';
    } else {
        replayBtn.disabled = false;
        replayBtn.innerText = `REPLAY SAMPLE (${replays})`;
        replayBtn.style.opacity = '1';
    }
}

function triggerReplay() {
    playAudioWithFade();
}

// Crossfade out before checking answer
function fadeOutAndSubmit(ans, btn) {
    if(!isPlaying) {
        submitAnswer(ans, btn);
        return;
    }
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.style.pointerEvents = 'none');
    
    let vol = audio.volume;
    const fade = setInterval(() => {
        if(vol > 0.05) { vol -= 0.05; audio.volume = vol; }
        else {
            clearInterval(fade);
            audio.pause();
            isPlaying = false;
            submitAnswer(ans, btn);
        }
    }, 40);
}

function submitAnswer(ans, btn) {
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.style.pointerEvents = 'none');

    fetch('/submit_answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({answer: ans})
    })
    .then(res => res.json())
    .then(data => {
        if(data.correct) {
            btn.classList.add('correct');
            score += 100; 
            document.getElementById('score-display').innerText = score;
        } else {
            btn.classList.add('wrong');
            allBtns.forEach(b => {
                if(b.innerText === data.correct_answer) b.classList.add('correct');
            });
        }
        
        setTimeout(loadNextLevel, 1500);
    });
}