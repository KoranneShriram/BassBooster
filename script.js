document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const audioElement = document.getElementById('audioPlayer');
    
    if (audioElement.srcObject) {
        audioElement.srcObject = null;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioElement);
    const bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 100;
    bassFilter.gain.value = 0;

    const trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3000;
    trebleFilter.gain.value = 0;

    const midFilter = audioContext.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;
    midFilter.gain.value = 0;

    const stereoPanner = audioContext.createStereoPanner();

    source.connect(bassFilter);
    bassFilter.connect(trebleFilter);
    trebleFilter.connect(midFilter);
    midFilter.connect(stereoPanner);
    stereoPanner.connect(audioContext.destination);

    audioElement.src = URL.createObjectURL(file);
    audioElement.loop = false;

    const frequencyValue = document.getElementById('frequencyValue');
    const boostValue = document.getElementById('boostValue');
    const trebleValue = document.getElementById('trebleValue');
    const midValue = document.getElementById('midValue');
    const widthValue = document.getElementById('widthValue');

    document.getElementById('bassFrequency').addEventListener('input', function() {
        bassFilter.frequency.value = this.value;
        frequencyValue.textContent = `${this.value} Hz`;
    });

    document.getElementById('bassBoost').addEventListener('input', function() {
        bassFilter.gain.value = parseFloat(this.value);
        boostValue.textContent = `${this.value} dB`;
    });

    document.getElementById('loop').addEventListener('change', function() {
        audioElement.loop = this.checked;
    });

    document.getElementById('advancedToggle').addEventListener('change', function() {
        const advancedControls = document.getElementById('advancedControls');
        const isAdvanced = this.checked;
        advancedControls.style.display = isAdvanced ? 'block' : 'none';

        if (isAdvanced) {
            bassFilter.disconnect(audioContext.destination);
            bassFilter.connect(trebleFilter);
            trebleFilter.connect(midFilter);
            midFilter.connect(stereoPanner);
            stereoPanner.connect(audioContext.destination);
        } else {
            bassFilter.disconnect(trebleFilter);
            trebleFilter.disconnect(midFilter);
            midFilter.disconnect(stereoPanner);
            stereoPanner.disconnect(audioContext.destination);
            bassFilter.connect(audioContext.destination);
        }
    });

    document.getElementById('trebleBoost').addEventListener('input', function() {
        trebleFilter.gain.value = parseFloat(this.value);
        trebleValue.textContent = `${this.value} dB`;
    });

    document.getElementById('midRange').addEventListener('input', function() {
        midFilter.gain.value = parseFloat(this.value);
        midValue.textContent = `${this.value} dB`;
    });

    document.getElementById('stereoWidth').addEventListener('input', function() {
        stereoPanner.pan.value = (this.value - 50) / 50;
        widthValue.textContent = `${this.value}%`;
    });

    document.getElementById('downloadBtn').addEventListener('click', async function() {
        const offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, audioContext.sampleRate * audioElement.duration, audioContext.sampleRate);

        const response = await fetch(audioElement.src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);

        const offlineSource = offlineContext.createBufferSource();
        offlineSource.buffer = audioBuffer;

        const offlineBassFilter = offlineContext.createBiquadFilter();
        offlineBassFilter.type = 'lowshelf';
        offlineBassFilter.frequency.value = bassFilter.frequency.value;
        offlineBassFilter.gain.value = bassFilter.gain.value;

        const offlineTrebleFilter = offlineContext.createBiquadFilter();
        offlineTrebleFilter.type = 'highshelf';
        offlineTrebleFilter.frequency.value = trebleFilter.frequency.value;
        offlineTrebleFilter.gain.value = trebleFilter.gain.value;

        const offlineMidFilter = offlineContext.createBiquadFilter();
        offlineMidFilter.type = 'peaking';
        offlineMidFilter.frequency.value = midFilter.frequency.value;
        offlineMidFilter.Q.value = midFilter.Q.value;
        offlineMidFilter.gain.value = midFilter.gain.value;

        const offlineStereoPanner = offlineContext.createStereoPanner();
        offlineStereoPanner.pan.value = stereoPanner.pan.value;

        offlineSource.connect(offlineBassFilter);
        offlineBassFilter.connect(offlineTrebleFilter);
        offlineTrebleFilter.connect(offlineMidFilter);
        offlineMidFilter.connect(offlineStereoPanner);
        offlineStereoPanner.connect(offlineContext.destination);

        offlineSource.start(0);

        const renderedBuffer = await offlineContext.startRendering();
        const wavBlob = bufferToWav(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'bass-boosted.wav';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    });

    function bufferToWav(buffer) {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const bufferArr = new ArrayBuffer(length);
        const view = new DataView(bufferArr);

        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        let offset = 0;

        writeString(view, offset, 'RIFF');
        offset += 4;
        view.setUint32(offset, length - 8, true);
        offset += 4;
        writeString(view, offset, 'WAVE');
        offset += 4;
        writeString(view, offset, 'fmt ');
        offset += 4;
        view.setUint32(offset, 16, true);
        offset += 4;
        view.setUint16(offset, 1, true);
        offset += 2;
        view.setUint16(offset, numOfChan, true);
        offset += 2;
        view.setUint32(offset, buffer.sampleRate, true);
        offset += 4;
        view.setUint32(offset, buffer.sampleRate * numOfChan * 2, true);
        offset += 4;
        view.setUint16(offset, numOfChan * 2, true);
        offset += 2;
        view.setUint16(offset, 16, true);
        offset += 2;
        writeString(view, offset, 'data');
        offset += 4;
        view.setUint32(offset, length - offset - 4, true);
        offset += 4;

        const interleaved = new Float32Array(buffer.length * numOfChan);
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numOfChan; channel++) {
                interleaved[i * numOfChan + channel] = buffer.getChannelData(channel)[i];
            }
        }

        for (let i = 0; i < interleaved.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, interleaved[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        return new Blob([view], { type: 'audio/wav' });
    }
});
