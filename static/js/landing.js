let audioCtx, analyser, source;
const audioEl = document.getElementById('bgm-player');
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const notif = document.getElementById('jukebox-notif');
let isInitialized = false;

function initExperience() {
    if (isInitialized) return;
    
    // Fade out overlay
    document.getElementById('overlay-start').style.opacity = '0';
    setTimeout(() => document.getElementById('overlay-start').style.display = 'none', 500);

    // Audio Context Setup
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    
    // Connect Audio Element
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    // High res FFT for smooth bars
    analyser.fftSize = 4096; 
    
    playNextBGM();
    renderFrame();
    isInitialized = true;
}

function playNextBGM() {
    fetch('/api/bgm')
        .then(res => res.json())
        .then(data => {
            if(data.error) return;
            
            audioEl.src = `/stream_audio?type=bgm&token=${data.token}`;
            audioEl.currentTime = data.start;
            audioEl.volume = 0; // Start silent for fade in
            audioEl.play();
            
            // Fade In Volume
            let vol = 0;
            const fade = setInterval(() => {
                if(vol < 0.5) { vol += 0.02; audioEl.volume = vol; }
                else clearInterval(fade);
            }, 50);

            // Show Notification
            document.getElementById('bgm-title').innerText = data.title;
            notif.classList.add('show');
            
            // Hide after 4 seconds
            setTimeout(() => {
                notif.classList.remove('show');
            }, 4000);
        });
}

audioEl.onended = playNextBGM;

function renderFrame() {
    requestAnimationFrame(renderFrame);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw only low-mid frequencies (first 200 bins) for cleaner look
    const barsToDraw = 200; 
    const barWidth = (canvas.width / barsToDraw);
    
    for(let i = 0; i < barsToDraw; i++) {
        // Boost height logic
        let barHeight = dataArray[i] * 1.5; 
        
        // Gradient Color
        const r = barHeight + (25 * (i/barsToDraw));
        const g = 250 * (i/barsToDraw);
        const b = 255;

        ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
        // Draw at bottom
        ctx.fillRect(i * barWidth, canvas.height - (barHeight * 0.8), barWidth - 1, barHeight);
    }
}

function startGame() {
    const count = document.getElementById('q-count').value;
    const curtain = document.getElementById('page-transition');
    
    // Visual Fade Out
    curtain.style.opacity = '1';
    
    // Audio Fade Out
    let vol = audioEl.volume;
    const fade = setInterval(() => {
        if(vol > 0.05) { vol -= 0.05; audioEl.volume = vol; }
        else {
            clearInterval(fade);
            audioEl.pause();
            window.location.href = `/quiz?count=${count}`;
        }
    }, 30);
}