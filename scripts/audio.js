// JavaScript для керування аудіо
class AudioController {
    constructor() {
        this.audioPlayer = document.getElementById('audio-player');
        this.playbackRate = 1.0;
        this.volume = 1.0;
        this.isPlaying = false;
        
        this.init();
    }

    init() {
        if (!this.audioPlayer) return;

        // Додаємо кнопки керування
        this.addControlButtons();
        
        // Відновлюємо налаштування з localStorage
        this.loadSettings();
        
        // Додаємо обробники подій
        this.addEventListeners();
    }

    addControlButtons() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'audio-controls';
        
        controlsContainer.innerHTML = `
            <button class="speed-btn" title="Швидкість відтворення">1x</button>
            <button class="volume-btn" title="Гучність">🔊</button>
            <input type="range" class="volume-slider" min="0" max="100" value="100">
        `;
        
        this.audioPlayer.parentNode.insertBefore(controlsContainer, this.audioPlayer.nextSibling);
    }

    addEventListeners() {
        const speedBtn = document.querySelector('.speed-btn');
        const volumeBtn = document.querySelector('.volume-btn');
        const volumeSlider = document.querySelector('.volume-slider');

        if (speedBtn) {
            speedBtn.addEventListener('click', () => this.togglePlaybackSpeed());
        }

        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        }

        this.audioPlayer.addEventListener('play', () => this.isPlaying = true);
        this.audioPlayer.addEventListener('pause', () => this.isPlaying = false);
        this.audioPlayer.addEventListener('ended', () => this.handlePlaybackEnd());
    }

    togglePlaybackSpeed() {
        const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const currentIndex = speeds.indexOf(this.playbackRate);
        const nextIndex = (currentIndex + 1) % speeds.length;
        
        this.playbackRate = speeds[nextIndex];
        this.audioPlayer.playbackRate = this.playbackRate;
        
        const speedBtn = document.querySelector('.speed-btn');
        if (speedBtn) {
            speedBtn.textContent = `${this.playbackRate}x`;
        }
        
        this.saveSettings();
    }

    toggleMute() {
        const volumeBtn = document.querySelector('.volume-btn');
        if (!volumeBtn) return;

        if (this.audioPlayer.muted) {
            this.audioPlayer.muted = false;
            this.audioPlayer.volume = this.volume;
            volumeBtn.textContent = '🔊';
        } else {
            this.audioPlayer.muted = true;
            volumeBtn.textContent = '🔇';
        }
        
        this.saveSettings();
    }

    setVolume(value) {
        this.volume = value;
        this.audioPlayer.volume = value;
        
        const volumeBtn = document.querySelector('.volume-btn');
        if (volumeBtn) {
            volumeBtn.textContent = value === 0 ? '🔇' : '🔊';
        }
        
        this.saveSettings();
    }

    handlePlaybackEnd() {
        this.isPlaying = false;
        // Тут можна додати додаткову логіку при завершенні відтворення
    }

    saveSettings() {
        localStorage.setItem('audioSettings', JSON.stringify({
            playbackRate: this.playbackRate,
            volume: this.volume,
            muted: this.audioPlayer.muted
        }));
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('audioSettings'));
        if (settings) {
            this.playbackRate = settings.playbackRate;
            this.volume = settings.volume;
            
            this.audioPlayer.playbackRate = this.playbackRate;
            this.audioPlayer.volume = this.volume;
            this.audioPlayer.muted = settings.muted;
            
            const speedBtn = document.querySelector('.speed-btn');
            const volumeBtn = document.querySelector('.volume-btn');
            const volumeSlider = document.querySelector('.volume-slider');
            
            if (speedBtn) speedBtn.textContent = `${this.playbackRate}x`;
            if (volumeBtn) volumeBtn.textContent = this.audioPlayer.muted ? '🔇' : '🔊';
            if (volumeSlider) volumeSlider.value = this.volume * 100;
        }
    }
}

// Ініціалізація контролера аудіо при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new AudioController();
}); 