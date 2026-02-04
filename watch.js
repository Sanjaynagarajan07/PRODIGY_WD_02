(function () {
    'use strict';

    // Sound effects using Web Audio API (no external files)
    let audioCtx = null;

    function getAudioContext() {
        if (audioCtx) return audioCtx;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function ensureAudio() {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
        } catch (e) {}
    }

    function playTone(freq, duration, type, volume, whenOffset) {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = type || 'square';
            osc.frequency.value = freq;
            const now = ctx.currentTime + (whenOffset || 0);
            const vol = volume != null ? volume : 0.15;
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {}
    }

    function playStartSound() {
        // Quick ascending arcade-style blip
        ensureAudio();
        playTone(650, 0.08, 'square', 0.2, 0);
        playTone(850, 0.09, 'square', 0.18, 0.07);
    }

    function playStopSound() {
        // Short descending beep
        ensureAudio();
        playTone(520, 0.1, 'square', 0.18, 0);
        playTone(360, 0.12, 'square', 0.16, 0.06);
    }

    function playLapSound() {
        // Soft clicky blip
        ensureAudio();
        playTone(900, 0.05, 'square', 0.17, 0);
    }

    function playResetSound() {
        // Gentle low beep
        ensureAudio();
        playTone(260, 0.12, 'sine', 0.15, 0);
    }

    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const centisecondsEl = document.getElementById('centiseconds');
    const startBtn = document.getElementById('start');
    const stopBtn = document.getElementById('stop');
    const lapBtn = document.getElementById('lap');
    const resetBtn = document.getElementById('reset');
    const lapsList = document.getElementById('lapsList');
    const lapsSection = document.getElementById('lapsSection');
    const lapsEmpty = document.getElementById('lapsEmpty');
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let lapTimes = [];
    let lapCount = 0;

    function pad2(n) {
        return n.toString().padStart(2, '0');
    }

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((ms % 1000) / 10);
        return pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds) + '.' + pad2(centiseconds);
    }

    function updateDisplay() {
        elapsedTime = Date.now() - startTime;
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const cs = Math.floor((elapsedTime % 1000) / 10);
        hoursEl.textContent = pad2(h);
        minutesEl.textContent = pad2(m);
        secondsEl.textContent = pad2(s);
        centisecondsEl.textContent = pad2(cs);
    }

    function start() {
        playStartSound();
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateDisplay, 10);
        startBtn.disabled = true;
        stopBtn.disabled = false;
        lapBtn.disabled = false;
        document.body.classList.add('running');
    }

    function stop() {
        playStopSound();
        clearInterval(timerInterval);
        startBtn.disabled = false;
        stopBtn.disabled = true;
        lapBtn.disabled = true;
        document.body.classList.remove('running');
    }

    function reset() {
        playResetSound();
        clearInterval(timerInterval);
        elapsedTime = 0;
        startTime = 0;
        lapTimes = [];
        lapCount = 0;
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        centisecondsEl.textContent = '00';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        lapBtn.disabled = true;
        renderLaps();
        lapsSection.classList.remove('has-laps');
        document.body.classList.remove('running');
    }

    function recordLap() {
        if (lapBtn.disabled) return;
        playLapSound();
        lapCount++;
        lapTimes.push({ num: lapCount, time: elapsedTime });
        renderLaps();
        lapsSection.classList.add('has-laps');
    }

    function renderLaps() {
        lapsList.innerHTML = '';
        lapTimes.forEach(function (lap) {
            const li = document.createElement('li');
            li.innerHTML = '<span class="lap-num">Lap ' + lap.num + '</span><span>' + formatTime(lap.time) + '</span>';
            lapsList.appendChild(li);
        });
    }

    function handleKeydown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (startBtn.disabled) start();
            else stop();
        } else if (e.code === 'KeyR') {
            reset();
        } else if (e.code === 'KeyL') {
            recordLap();
        }
    }

    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', stop);
    lapBtn.addEventListener('click', recordLap);
    resetBtn.addEventListener('click', reset);
    document.addEventListener('keydown', handleKeydown);
})();
