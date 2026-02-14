const urlParams = new URLSearchParams(window.location.search);
const TOTAL_QUESTIONS = parseInt(urlParams.get('count')) || 20;
let currentQuestion = 0;
let score = 0;
let replaysLeft = 3;
let isPlaying = false;
let nextQuestionData = null;

const audio = document.getElementById('game-audio');
const overlay = document.getElementById('countdown-overlay');
const countText = document.getElementById('countdown-text');

document.getElementById('q-total').innerText = TOTAL_QUESTIONS;

function initGame() {
    loadNextQuestion();
}

function loadNextQuestion() {
    if (currentQuestion >= TOTAL_QUESTIONS) {
        alert(`GAME OVER! Final Score: ${score}`);
        window.location.href = '/';
        return;
    }

    // Show Overlay
    overlay.style.display = 'flex';
    let count = 3;
    countText.innerText = count;

    // Fetch in background
    fetch('/api/question')
        .then(res => res.json())
        .then(data => {
            nextQuestionData = data;
            audio.src = '/stream_audio?t=' + Date.now(); // Prevent caching
            audio.load();
        });

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countText.innerText = count;
        } else {
            clearInterval(timer);
            overlay.style.display = 'none';
            setupRound();
        }
    }, 1000);
}

function setupRound() {
    currentQuestion++;
    document.getElementById('q-current').innerText = currentQuestion;
    replaysLeft = 3;
    updateReplayBtn();
    
    // Update UI
    document.getElementById('clue-text').innerText = nextQuestionData.clue;
    document.getElementById('mode-text').innerText = `MODE: ${nextQuestionData.mode}`;
    
    // Setup Options
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    nextQuestionData.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => submitAnswer(opt, btn);
        container.appendChild(btn);
    });

    // Auto Play with Fade In
    playAudio();
}

function playAudio() {
    if (replaysLeft <= 0) return;
    
    audio.currentTime = nextQuestionData.start_time;
    audio.volume = 0;
    audio.play();
    
    // Fade In
    let vol = 0;
    const fade = setInterval(() => {
        if (vol < 1.0) { vol += 0.05; audio.volume = Math.min(1, vol); }
        else clearInterval(fade);
    }, 50);

    const btn = document.getElementById('btn-replay');
    btn.disabled = true;
    btn.innerText = "PLAYING...";
    isPlaying = true;

    // Visual Progress Bar (Fake)
    const bar = document.getElementById('progress-fill');
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = '100%'; }, 100);
}

audio.onended = () => {
    replaysLeft--;
    isPlaying = false;
    updateReplayBtn();
    document.getElementById('progress-fill').style.width = '0%';
};

function updateReplayBtn() {
    const btn = document.getElementById('btn-replay');
    if (replaysLeft <= 0) {
        btn.innerText = "NO REPLAYS LEFT";
        btn.disabled = true;
    } else {
        btn.innerText = `PLAY (${replaysLeft} LEFT)`;
        btn.disabled = false;
    }
}

function submitAnswer(answer, btnElement) {
    if(isPlaying) {
        audio.pause();
        audio.currentTime = 0;
    }

    fetch('/submit_answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ answer: answer })
    })
    .then(res => res.json())
    .then(data => {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);

        if (data.correct) {
            btnElement.classList.add('correct');
            score += 10;
            document.getElementById('score').innerText = score;
        } else {
            btnElement.classList.add('wrong');
            // Highlight correct one
            allBtns.forEach(b => {
                if (b.innerText === data.correct_answer) b.classList.add('correct');
            });
        }

        setTimeout(loadNextQuestion, 2000);
    });
}

// Start immediately
initGame();