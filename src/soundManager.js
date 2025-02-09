// soundManager.js
import * as THREE from 'three';

class SoundManager {
  constructor(camera) {
    // Create an AudioListener and add it to the camera.
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    // Create an AudioLoader.
    this.audioLoader = new THREE.AudioLoader();

    // Create sound objects.
    this.mainTheme = new THREE.Audio(this.listener);
    this.hallwayTheme = new THREE.Audio(this.listener);

    // You could also initialize an array or object for sound effects.
    this.soundEffects = {};
  }

  loadMainTheme(url) {
    this.audioLoader.load(url, (buffer) => {
      this.mainTheme.setBuffer(buffer);
      this.mainTheme.setLoop(true);
      this.mainTheme.setVolume(0.5);
    });
  }

  loadHallwayTheme(url) {
    this.audioLoader.load(url, (buffer) => {
      this.hallwayTheme.setBuffer(buffer);
      this.hallwayTheme.setLoop(true);
      this.hallwayTheme.setVolume(0.5);
    });
  }

  playMainTheme() {
    if (!this.mainTheme.isPlaying) {
      this.mainTheme.play();
    }
  }

  stopMainTheme() {
    if (this.mainTheme.isPlaying) {
      this.mainTheme.stop();
    }
  }

  playHallwayTheme() {
    if (!this.hallwayTheme.isPlaying) {
      this.hallwayTheme.play();
    }
  }

  stopHallwayTheme() {
    if (this.hallwayTheme.isPlaying) {
      this.hallwayTheme.stop();
    }
  }

  // Optionally, you can add a method to load and play sound effects.
  loadSoundEffect(name, url, volume = 1) {
    const sound = new THREE.Audio(this.listener);
    this.audioLoader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(volume);
    });
    this.soundEffects[name] = sound;
  }

  playSoundEffect(name) {
    const sound = this.soundEffects[name];
    if (sound && !sound.isPlaying) {
      sound.play();
    }
  }
}

export default SoundManager;