const wfCanvas = document.querySelector('#waveform');
const wfCtx = wfCanvas.getContext('2d');
const lineCanvas = document.querySelector('#line');
const lineCtx = lineCanvas.getContext('2d');

const upload = document.getElementById('upload');
const rewindBtn = document.getElementById('rewind');
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
const forwardBtn = document.getElementById('forward');
const loading = document.querySelector('.loading');

function setCanvasDimentions(...args){
    args.forEach(canvas => {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = (window.innerHeight * .4) * window.devicePixelRatio;
        canvas.style.width = `${window.innerWidth * .5}px`;
        canvas.style.height = `${window.innerHeight * .4}px`;
    })
}
setCanvasDimentions(lineCanvas, wfCanvas)

// Set up audio context
let audioContext;
let globalAudioBuffer;
// let audioFile = './Aquarium.mp3'
let audio;
let track;
let filteredData; 
let play = false;

function reset(){
    filteredData = filterData(globalAudioBuffer);
    setCanvasDimentions(lineCanvas, wfCanvas);
    drawWaveform();
}

function visualizeAudio(url){
    if(audioContext){
        audioContext.close();
    }
    if(audio){
        audio.remove();
    }

    wfCanvas.style.opacity = 0;
    lineCanvas.style.opacity = 0;
    loading.classList.add('active');

    audio = new Audio(url);
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        try{
            globalAudioBuffer = audioBuffer;
            filteredData = filterData(audioBuffer);
            track = audioContext.createMediaElementSource(audio);
            track.connect(audioContext.destination);
            wfCanvas.style.opacity = 1;
            lineCanvas.style.opacity = 1;
            loading.classList.remove('active');
            drawWaveform();
            animate();
        }catch(err){
            alert('Something went wrong! Please upload audio files only.')
        }
    });
    
};

// visualizeAudio(audioFile)

function filterData(audioBuffer){
    const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
    const samples = wfCanvas.width * 10; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // Number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
        filteredData.push(rawData[i * blockSize]); 
    }
    return filteredData;
}


function drawWaveform(){
    wfCtx.clearRect(0, 0, wfCanvas.width, wfCanvas.height);
    wfCtx.lineWidth = 1;
    for(let i = 0; i < filteredData.length; i++){
        wfCtx.strokeStyle = `#FFFFFF`;
        wfCtx.beginPath();
        wfCtx.moveTo(i * .1 , wfCanvas.height / 2);
        wfCtx.lineTo(i* .1, (wfCanvas.height / 2) - (filteredData[i] * (wfCanvas.height * .3)));
        wfCtx.stroke();
        wfCtx.closePath();
    }
}

let time = 0;
function animate(){
    if(play){
        time = audio.currentTime * (wfCanvas.width / audio.duration);
    }
    lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
    lineCtx.lineWidth = 4;
    lineCtx.strokeStyle = `rgb(255, 132, 0)`;
    lineCtx.beginPath();
    lineCtx.moveTo(time, (wfCanvas.height * .5) - wfCanvas.height * .3);
    lineCtx.lineTo(time,(wfCanvas.height * .5) + wfCanvas.height * .3);
    lineCtx.stroke();
    lineCtx.closePath();
    requestAnimationFrame(animate);
}

// Event listeners

window.addEventListener('resize', reset)

upload.addEventListener('change', (e)=>{

    try{
        let file = e.target.files[0]
        if(file.type == 'audio/mpeg'){
            let fileURL = window.URL.createObjectURL(file);
            visualizeAudio(fileURL);
        }else{
            alert('Please upload audio files only.')
        }
        
    }catch(err){
        alert(err)
    }
    
})

playBtn.addEventListener('click', () => {
    play = true;
    audioContext.resume();
    audio.play();
})

pauseBtn.addEventListener('click', () => {
    play = false;
    audioContext.suspend();
    audio.pause();
})

rewindBtn.addEventListener('click', () => {
    audio.currentTime -= 10;
})

forwardBtn.addEventListener('click', () => {
    audio.currentTime += 10;
})

