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

    // **Initialize footstep sound objects.**
    this.footstepsOutside = new THREE.Audio(this.listener);
    this.footstepsInside = new THREE.Audio(this.listener);
    this.footstepsHallway = new THREE.Audio(this.listener);

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

  // effectList is an array of file names (e.g., ["click.wav", "explosion.wav", "jump.wav"])
  // folder is the directory containing these files (e.g., "public/audio/fx")
  loadSoundEffects(effectList, folder) {
    effectList.forEach((filename) => {
      this.audioLoader.load(`${folder}/${filename}`, (buffer) => {
        const sound = new THREE.Audio(this.listener);
        sound.setBuffer(buffer);
        sound.setLoop(false);  // Usually, sound effects don't loop.
        sound.setVolume(1);      // Adjust as needed.
        // Use the filename (or a cleaned-up version) as the key.
        this.soundEffects[filename] = sound;
      }, undefined, (error) => {
        console.error(`Error loading sound effect ${filename}:`, error);
      });
    });
  }

  // Play a specific sound effect by its key (the filename)
  playSoundEffect(filename) {
    const sound = this.soundEffects[filename];
    if (sound && !sound.isPlaying) {
      sound.play();
    }
  }

  loadFootstepSounds() {
    // Outside footsteps: grass-steps.wav
    this.audioLoader.load("public/audio/fx/grass-steps.wav", (buffer) => {
      this.footstepsOutside.setBuffer(buffer);
      this.footstepsOutside.setLoop(true);  // loop continuously while moving
      this.footstepsOutside.setVolume(2.7);
    }, undefined, (error) => {
      console.error("Error loading grass-steps:", error);
    });

    // Inside footsteps: house-steps.wav
    this.audioLoader.load("public/audio/fx/house-steps.wav", (buffer) => {
      this.footstepsInside.setBuffer(buffer);
      this.footstepsInside.setLoop(true);
      this.footstepsInside.setVolume(2.7);
    }, undefined, (error) => {
      console.error("Error loading house-steps:", error);
    });

    // Hallway footsteps: hall-steps.wav
    this.audioLoader.load("public/audio/fx/hall-steps.wav", (buffer) => {
      this.footstepsHallway.setBuffer(buffer);
      this.footstepsHallway.setLoop(true);
      this.footstepsHallway.setVolume(2.7);
    }, undefined, (error) => {
      console.error("Error loading hall-steps:", error);
    });
  }

  playFootstepsOutside() {
    if (!this.footstepsOutside.isPlaying) {
      this.footstepsOutside.play();
      console.log("Playing footstepsOutside");

    }
  }
  
  stopFootstepsOutside() {
    if (this.footstepsOutside.isPlaying) {
      this.footstepsOutside.stop();
    }
  }
  
  playFootstepsInside() {
    if (!this.footstepsInside.isPlaying) {
      this.footstepsInside.play();
    }
  }
  
  stopFootstepsInside() {
    if (this.footstepsInside.isPlaying) {
      this.footstepsInside.stop();
    }
  }
  
  playFootstepsHallway() {
    if (!this.footstepsHallway.isPlaying) {
      this.footstepsHallway.play();
    }
  }
  
  stopFootstepsHallway() {
    if (this.footstepsHallway.isPlaying) {
      this.footstepsHallway.stop();
    }
  }

  // Helper method to stop all footstep sounds
  stopAllFootsteps() {
    this.stopFootstepsOutside();
    this.stopFootstepsInside();
    this.stopFootstepsHallway();
  }

}

export default SoundManager;