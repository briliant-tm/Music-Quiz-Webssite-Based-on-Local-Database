const urlParams = new URLSearchParams(window.location.search);
const TOTAL_QUESTIONS = parseInt(urlParams.get('count')) || 10;
const MODE = urlParams.get('mode') || 'CLASSIC';

let currentQ = 0;
let score = 0;
let replays = 3;
let isPlaying = false;
let nextData = null;

// Elements
const audio = document.getElementById('game-audio');
const overlayCount = document.getElementById('overlay-countdown');
const overlayOver = document.getElementById('overlay-gameover');
const countTxt = document.getElementById('countdown-text');
const replayBtn = document.getElementById('btn-replay');
const progressFill = document.getElementById('progress-fill');
const container = document.getElementById('game-interface-container');

// Audio Visualizer Context
let audioCtx, analyser, source, animId;
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');

window.onload = () => {
    document.getElementById('q-total').innerText = TOTAL_QUESTIONS;
    
    // Setup Audio Ctx
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;

    loadNextLevel();
};

function loadNextLevel() {
    if (currentQ >= TOTAL_QUESTIONS) {
        document.getElementById('final-score').innerText = score;
        overlayOver.style.display = 'flex';
        return;
    }

    // Glitch Transition Effect
    const glitch = document.getElementById('glitch-layer');
    glitch.classList.add('glitch-active');
    setTimeout(() => glitch.classList.remove('glitch-active'), 300);

    overlayCount.style.display = 'flex';
    let timer = 3;
    countTxt.innerText = timer;
    
    fetch('/api/question').then(r=>r.json()).then(data => {
        nextData = data;
        audio.src = `/stream_audio?type=quiz&t=${Date.now()}`;
        audio.load();
    });

    const interval = setInterval(() => {
        timer--;
        if(timer > 0) countTxt.innerText = timer;
        else {
            clearInterval(interval);
            overlayCount.style.display = 'none';
            setupRound();
        }
    }, 1000);
}

function setupRound() {
    currentQ++;
    document.getElementById('q-current').innerText = currentQ;
    replays = 3;
    updateReplayBtn();
    
    document.getElementById('clue-text').innerText = nextData.clue;
    document.getElementById('mode-badge').innerText = nextData.mode;
    
    // RENDER INTERFACE BASED ON MODE
    container.innerHTML = '';
    
    if (MODE === 'CLASSIC') {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        nextData.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => fadeOutAndSubmit(opt, btn);
            grid.appendChild(btn);
        });
        container.appendChild(grid);
    } 
    else if (MODE === 'TYPING') {
        const wrapper = document.createElement('div');
        wrapper.className = 'typing-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'typing-input';
        
        if (nextData.typing_type === 'FOLDER') {
            input.placeholder = "Foreign File detected... Guess the FOLDER NAME";
            input.style.borderColor = "#ff0055"; // Red hint
        } else {
            input.placeholder = "Type Title / Artist...";
        }
        
        input.onkeydown = (e) => { if(e.key === 'Enter') fadeOutAndSubmit(input.value, input); };
        
        wrapper.appendChild(input);
        container.appendChild(wrapper);
        setTimeout(() => input.focus(), 100);
    }

    playAudio();
}

function playAudio() {
    if(replays <= 0) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    audio.currentTime = nextData.start_time;
    audio.volume = 0; audio.play();
    
    let vol = 0;
    const fade = setInterval(()=>{
        if(vol < 1.0) { vol+=0.1; audio.volume = Math.min(1,vol); }
        else clearInterval(fade);
    }, 50);

    isPlaying = true;
    replayBtn.disabled = true;
    replayBtn.innerText = "LISTENING...";
    
    cancelAnimationFrame(animId);
    updateGameLoop();
}

function updateGameLoop() {
    if(!isPlaying) return;
    
    // Real-time Progress
    const duration = 15; // Clip limit
    const elapsed = audio.currentTime - nextData.start_time;
    let pct = (elapsed / duration) * 100;
    
    if (pct >= 100 || audio.ended) {
        pct = 100; audio.pause(); handleClipEnd();
    }
    progressFill.style.width = `${pct}%`;

    // Visualizer Mirror
    const buffer = analyser.frequencyBinCount;
    const data = new Uint8Array(buffer);
    analyser.getByteFrequencyData(data);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const barW = (canvas.width / buffer) * 4; // Wider bars
    const centerY = canvas.height / 2;
    let totalE = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 10;

    for(let i=0; i<buffer; i++) {
        let h = data[i] * 1.5;
        totalE += data[i];
        if (h > 0) {
            const x = (canvas.width/2) + (i*barW/2) * (i%2===0 ? 1 : -1); 
            ctx.fillRect(x, centerY - h/2, barW-2, h);
        }
    }

    // Dynamic BG
    const intensity = totalE / (buffer * 255);
    document.getElementById('dynamic-bg').style.background = 
        `radial-gradient(circle at center, rgba(30,30,30,${intensity}) 0%, #000 100%)`;

    animId = requestAnimationFrame(updateGameLoop);
}

function handleClipEnd() {
    replays--;
    isPlaying = false;
    updateReplayBtn();
}

function updateReplayBtn() {
    if(replays <= 0) {
        replayBtn.innerText = "SIGNAL LOST (0)"; replayBtn.disabled = true;
    } else {
        replayBtn.innerText = `REPLAY (${replays})`; replayBtn.disabled = false;
    }
}

function triggerReplay() { playAudio(); }

function fadeOutAndSubmit(ans, uiElement) {
    if (isPlaying) {
        // Disable UI
        if (MODE === 'CLASSIC') document.querySelectorAll('.option-btn').forEach(b=>b.disabled=true);
        if (MODE === 'TYPING') uiElement.disabled = true;

        let vol = audio.volume;
        const fade = setInterval(() => {
            if(vol > 0.05) { vol -= 0.1; audio.volume = vol; }
            else {
                clearInterval(fade);
                audio.pause();
                isPlaying = false;
                submit(ans, uiElement);
            }
        }, 50);
    } else {
        submit(ans, uiElement);
    }
}

function submit(ans, uiElement) {
    fetch('/submit_answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            answer: ans,
            game_mode: MODE,
            typing_type: nextData.typing_type
        })
    })
    .then(r=>r.json()).then(data => {
        if(MODE === 'CLASSIC') {
            if(data.correct) { uiElement.classList.add('correct'); score += 100; }
            else { uiElement.classList.add('wrong'); }
        } 
        else if (MODE === 'TYPING') {
            if(data.score > 0) {
                uiElement.style.borderColor = "#00ff88";
                uiElement.style.color = "#00ff88";
                uiElement.value = `+${data.score} (${data.correct_answer})`;
                score += data.score;
            } else {
                uiElement.style.borderColor = "#ff0055";
                uiElement.style.color = "#ff0055";
                uiElement.value = `WRONG: ${data.correct_answer}`;
            }
        }
        document.getElementById('score-display').innerText = score;
        setTimeout(loadNextLevel, 2000);
    });
}