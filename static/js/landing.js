let audioCtx, analyser, source;
const audioEl = document.getElementById('bgm-player');
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const content = document.getElementById('landing-content');
const vignette = document.getElementById('vignette-overlay');

function startExperience() {
    document.getElementById('start-overlay').style.display = 'none';
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyser.fftSize = 256;
    playNextBGM();
    renderFrame();
}

function playNextBGM() {
    fetch('/api/bgm')
        .then(res => res.json())
        .then(data => {
            audioEl.src = `/stream_audio?token=${data.path_token}`;
            audioEl.currentTime = data.start;
            audioEl.volume = 0.4;
            audioEl.play();
            
            // Show Notification
            const notif = document.getElementById('jukebox-notif');
            document.getElementById('bgm-title').innerText = data.title;
            notif.classList.add('show');
            setTimeout(() => notif.classList.remove('show'), 5000);
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
    let totalEnergy = 0;
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for(let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i];
        totalEnergy += barHeight;
        if(i < 8) bassEnergy += barHeight; // Sub-bass range

        ctx.fillStyle = `rgba(255,255,255,${barHeight/300})`;
        ctx.fillRect(x, canvas.height - (barHeight * 1.5), barWidth, barHeight * 1.5);
        x += barWidth + 2;
    }

    // PULSE EFFECT
    const bassIntensity = bassEnergy / 2040; // Normalize
    const scale = 1 + (bassIntensity * 0.08);
    content.style.transform = `scale(${scale})`;

    // DYNAMIC VIGNETTE
    let opacity = 1 - (totalEnergy / bufferLength / 120);
    if(opacity < 0) opacity = 0;
    if(opacity > 0.95) opacity = 0.95;
    
    vignette.style.background = `radial-gradient(circle, rgba(0,0,0,0) 20%, rgba(0,0,0,${opacity}) 90%)`;
}