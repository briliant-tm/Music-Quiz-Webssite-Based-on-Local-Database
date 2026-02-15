let audioCtx, analyser, source;
const audioEl = document.getElementById('bgm-player');
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const bg = document.getElementById('dynamic-bg');

let isInitialized = false;

function initExperience() {
    if(isInitialized) return;
    document.getElementById('overlay-start').style.display = 'none';
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 2048; // High res for line

    playNextBGM();
    renderFrame();
    isInitialized = true;
}

function playNextBGM() {
    fetch('/api/bgm').then(r=>r.json()).then(data => {
        if(data.error) return;
        audioEl.src = `/stream_audio?type=bgm&token=${data.token}`;
        audioEl.currentTime = data.start;
        audioEl.volume = 0.5; audioEl.play();
    });
}
audioEl.onended = playNextBGM;

function renderFrame() {
    requestAnimationFrame(renderFrame);
    const buffer = analyser.frequencyBinCount;
    const data = new Uint8Array(buffer);
    analyser.getByteTimeDomainData(data); // Waveform data

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();

    const sliceWidth = canvas.width / buffer;
    let x = 0;
    let totalAmp = 0;

    for(let i=0; i<buffer; i++) {
        const v = data[i] / 128.0; // Normalize
        const y = v * canvas.height/2;
        totalAmp += Math.abs(data[i] - 128);

        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
        x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();

    // High Gain BG
    const intensity = totalAmp / buffer * 10; 
    const hue = 220 + (intensity * 50);
    bg.style.background = `radial-gradient(circle at center, hsla(${hue}, 50%, 20%, ${0.2 + intensity}) 0%, #000 100%)`;
}