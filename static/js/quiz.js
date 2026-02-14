const urlParams = new URLSearchParams(window.location.search);
const TOTAL_QUESTIONS = parseInt(urlParams.get('count')) || 20;
let currentQ = 0;
let score = 0;
let replays = 3;
let isPlaying = false;
let nextData = null;

// DOM Elements
const audio = document.getElementById('game-audio');
const overlayCount = document.getElementById('overlay-countdown');
const overlayOver = document.getElementById('overlay-gameover');
const countTxt = document.getElementById('countdown-text');
const replayBtn = document.getElementById('btn-replay');
const progressFill = document.getElementById('progress-fill');

// Init Fade In Transition
window.onload = () => {
    document.getElementById('q-total').innerText = TOTAL_QUESTIONS;
    setTimeout(() => {
        document.getElementById('page-transition').style.opacity = '0';
        setTimeout(() => document.getElementById('page-transition').style.display = 'none', 500);
        loadNextLevel();
    }, 500);
};

function loadNextLevel() {
    if (currentQ >= TOTAL_QUESTIONS) {
        showGameOver();
        return;
    }

    // 1. Show Countdown Overlay
    overlayCount.style.display = 'flex';
    let timerVal = 3;
    countTxt.innerText = timerVal;
    document.getElementById('countdown-sub').innerText = "FETCHING AUDIO DATA...";

    // 2. Fetch Data (Async)
    fetch('/api/question')
        .then(res => res.json())
        .then(data => {
            nextData = data;
            // Pre-load audio
            audio.src = '/stream_audio?type=quiz&t=' + Date.now();
            audio.load();
        });

    // 3. Countdown Logic
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
    
    // UI Update
    document.getElementById('clue-text').innerText = nextData.clue;
    document.getElementById('mode-badge').innerText = "MODE: " + nextData.mode;
    
    // Options
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    nextData.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => submitAnswer(opt, btn);
        container.appendChild(btn);
    });

    playAudioWithFade();
}

function playAudioWithFade() {
    if(replays <= 0) return;
    
    audio.currentTime = nextData.start_time;
    audio.volume = 0;
    audio.play();
    
    // Fade In
    let vol = 0;
    const fade = setInterval(() => {
        if(vol < 1.0) { vol += 0.1; audio.volume = Math.min(1, vol); }
        else clearInterval(fade);
    }, 50);

    // Lock UI
    isPlaying = true;
    replayBtn.disabled = true;
    replayBtn.innerText = "LISTENING...";
    
    // Visual Progress (Fake 15s bar for tension)
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    setTimeout(() => {
        progressFill.style.transition = 'width 10s linear';
        progressFill.style.width = '100%';
    }, 100);
}

audio.onended = () => {
    replays--;
    isPlaying = false;
    updateReplayBtn();
};

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

function submitAnswer(ans, btn) {
    // Disable all
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.style.pointerEvents = 'none');
    
    // Stop Audio
    audio.pause();

    fetch('/submit_answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({answer: ans})
    })
    .then(res => res.json())
    .then(data => {
        if(data.correct) {
            btn.classList.add('correct');
            score += 100; // Arcade scoring
            document.getElementById('score-display').innerText = score;
        } else {
            btn.classList.add('wrong');
            // Highlight right answer
            allBtns.forEach(b => {
                if(b.innerText === data.correct_answer) b.classList.add('correct');
            });
        }
        
        // Next Level Delay
        setTimeout(loadNextLevel, 2000);
    });
}

function showGameOver() {
    document.getElementById('final-score').innerText = score;
    overlayOver.style.display = 'flex';
}