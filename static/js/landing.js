let audioCtx, analyser, source;
const audioEl = document.getElementById('bgm-player');
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const notif = document.getElementById('jukebox-notif');
const bg = document.getElementById('dynamic-bg');
const content = document.getElementById('content-wrapper');

let isInitialized = false;
let particles = [];

function initExperience() {
    if (isInitialized) return;
    
    document.getElementById('overlay-start').style.opacity = '0';
    setTimeout(() => document.getElementById('overlay-start').style.display = 'none', 500);

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyser.fftSize = 256; 
    
    // Init Particles
    for(let i=0; i<50; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2 + 1,
            speedY: Math.random() * -1 - 0.5
        });
    }

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
            audioEl.volume = 0; 
            audioEl.play();
            
            let vol = 0;
            const fade = setInterval(() => {
                if(vol < 0.4) { vol += 0.02; audioEl.volume = vol; }
                else clearInterval(fade);
            }, 50);

            document.getElementById('bgm-title').innerText = data.title;
            notif.classList.add('show');
            setTimeout(() => notif.classList.remove('show'), 4000);
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

    let bassEnergy = 0;
    const barWidth = (canvas.width / bufferLength) * 2;
    
    // Draw Particles
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speedY;
        if(p.y < 0) p.y = canvas.height;
    });

    // Draw Visualizer & Calc Bass
    for(let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] * 1.2; 
        if(i < 10) bassEnergy += dataArray[i];

        const r = barHeight + (25 * (i/bufferLength));
        const g = 200 * (i/bufferLength);
        const b = 255;

        ctx.fillStyle = `rgba(${r},${g},${b},0.4)`;
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
    }

    // Pulse & Gradient Logic
    const bassNormalized = bassEnergy / 2550;
    const scale = 1 + (bassNormalized * 0.05);
    content.style.transform = `scale(${scale})`;

    let opacity = Math.min(0.8, bassNormalized * 2);
    bg.style.background = `radial-gradient(circle at center, rgba(26,11,46,${opacity + 0.2}) 0%, #000000 100%)`;
}

function startGame() {
    const count = document.getElementById('q-count').value;
    const curtain = document.getElementById('page-transition');
    
    curtain.style.opacity = '1';
    
    let vol = audioEl.volume;
    const fade = setInterval(() => {
        if(vol > 0.05) { vol -= 0.05; audioEl.volume = vol; }
        else {
            clearInterval(fade);
            audioEl.pause();
            window.location.href = `/quiz?count=${count}`;
        }
    }, 40);
}