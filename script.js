document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const audioElement = document.getElementById('audioPlayer');
    
    // Ensure previous source is disconnected if any
    if (audioElement.srcObject) {
        audioElement.srcObject = null;
    }

    // Create new AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioElement);
    const bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 100; // Initial frequency to boost bass
    bassFilter.gain.value = 0; // Initial gain for bass boost

    // Treble filter for advanced mode
    const trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3000; // Frequency to boost treble
    trebleFilter.gain.value = 0; // Initial gain for treble boost

    // Mid-range filter for advanced mode
    const midFilter = audioContext.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000; // Frequency for mid-range adjustment
    midFilter.Q.value = 1; // Q factor for mid-range adjustment
    midFilter.gain.value = 0; // Initial gain for mid-range adjustment

    // Stereo panner for advanced mode
    const stereoPanner = audioContext.createStereoPanner();

    // Connect the filters in series
    source.connect(bassFilter);
    bassFilter.connect(trebleFilter);
    trebleFilter.connect(midFilter);
    midFilter.connect(stereoPanner);
    stereoPanner.connect(audioContext.destination);

    audioElement.src = URL.createObjectURL(file);

    // Set loop initially to false
    audioElement.loop = false;

    // Update frequency display
    const frequencyValue = document.getElementById('frequencyValue');
    const boostValue = document.getElementById('boostValue');
    const trebleValue = document.getElementById('trebleValue');
    const midValue = document.getElementById('midValue');
    const widthValue = document.getElementById('widthValue');

    // Add event listener for bass frequency control
    document.getElementById('bassFrequency').addEventListener('input', function() {
        bassFilter.frequency.value = this.value;
        frequencyValue.textContent = `${this.value} Hz`;
    });

    // Add event listener for bass boost control
    document.getElementById('bassBoost').addEventListener('input', function() {
        bassFilter.gain.value = parseFloat(this.value);
        boostValue.textContent = `${this.value} dB`;
    });

    // Add event listener for loop checkbox
    document.getElementById('loop').addEventListener('change', function() {
        audioElement.loop = this.checked;
    });

    // Add event listener for advanced mode toggle
    document.getElementById('advancedToggle').addEventListener('change', function() {
        const advancedControls = document.getElementById('advancedControls');
        const isAdvanced = this.checked;
        advancedControls.style.display = isAdvanced ? 'block' : 'none';

        if (isAdvanced) {
            // Connect advanced filters
            bassFilter.disconnect(trebleFilter);
            trebleFilter.disconnect(midFilter);
            midFilter.disconnect(stereoPanner);
            stereoPanner.disconnect(audioContext.destination);
            bassFilter.connect(trebleFilter);
            trebleFilter.connect(midFilter);
            midFilter.connect(stereoPanner);
            stereoPanner.connect(audioContext.destination);
        } else {
            // Disconnect advanced filters
            bassFilter.disconnect(trebleFilter);
            trebleFilter.disconnect(midFilter);
            midFilter.disconnect(stereoPanner);
            stereoPanner.disconnect(audioContext.destination);
            bassFilter.connect(audioContext.destination);
        }
    });

    // Add event listener for treble boost control in advanced mode
    document.getElementById('trebleBoost').addEventListener('input', function() {
        trebleFilter.gain.value = parseFloat(this.value);
        trebleValue.textContent = `${this.value} dB`;
    });

    // Add event listener for mid-range adjustment control in advanced mode
    document.getElementById('midRange').addEventListener('input', function() {
        midFilter.gain.value = parseFloat(this.value);
        midValue.textContent = `${this.value} dB`;
    });

    // Add event listener for stereo width control in advanced mode
    document.getElementById('stereoWidth').addEventListener('input', function() {
        stereoPanner.pan.value = (this.value - 50) / 50;
        widthValue.textContent = `${this.value}%`;
    });
});
