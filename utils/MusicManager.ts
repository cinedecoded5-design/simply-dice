class MusicManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private isStopping: boolean = false;
  
  // Scheduler variables
  private nextNoteTime: number = 0;
  private currentNoteIndex: number = 0;
  private tempo: number = 90;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | null = null;

  // "Cute & Premium" Pentatonic Melody (C Major Pentatonic)
  // Soft, playful, non-intrusive
  private melody = [
    { note: 523.25, dur: 0.5 }, // C5
    { note: 392.00, dur: 0.5 }, // G4
    { note: 440.00, dur: 0.5 }, // A4
    { note: 392.00, dur: 1.0 }, // G4
    { note: 0,      dur: 0.5 }, // Rest
    { note: 329.63, dur: 0.5 }, // E4
    { note: 392.00, dur: 0.5 }, // G4
    { note: 329.63, dur: 0.5 }, // E4
    { note: 293.66, dur: 1.0 }, // D4
    { note: 0,      dur: 0.5 }, // Rest
  ];

  constructor() {
    try {
      const saved = localStorage.getItem('sd_muted');
      this.isMuted = saved === 'true';
    } catch (e) {
      this.isMuted = false;
    }
  }

  private init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        this.ctx = new Ctx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        // Default volume (quiet background)
        this.masterGain.gain.value = this.isMuted ? 0 : 0.15;
      }
    }
  }

  // --- Scheduler Logic ---

  private nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    // Advance time by the duration of the current note (simulating quarter notes logic)
    // The melody array has explicit durations relative to a beat
    this.nextNoteTime += this.melody[this.currentNoteIndex].dur * secondsPerBeat; 
    
    this.currentNoteIndex++;
    if (this.currentNoteIndex === this.melody.length) {
      this.currentNoteIndex = 0;
    }
  }

  private playNote(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain || freq === 0) return;

    // Create Oscillators for a "Cute Electric Piano" sound
    // 1. Sine wave (Fundamental)
    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // 2. Sine wave (Harmonic for warmth)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2; // Octave up
    gain2.gain.value = 0.1; // Subtle

    // Envelope (Soft Attack, Long Release)
    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(0.3, time + 0.05); // Soft attack
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.5); // Long tail

    osc.connect(noteGain);
    osc2.connect(gain2);
    gain2.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(time);
    osc2.start(time);
    
    osc.stop(time + duration * 2);
    osc2.stop(time + duration * 2);
  }

  private scheduler() {
    // While there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      const note = this.melody[this.currentNoteIndex];
      // Convert beat duration to seconds for the play function
      const secondsPerBeat = 60.0 / this.tempo;
      this.playNote(note.note, this.nextNoteTime, note.dur * secondsPerBeat);
      this.nextNote();
    }
    
    if (this.isPlaying) {
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }

  // --- Public Control Methods ---

  public play() {
    if (this.isPlaying || this.isStopping) return;
    
    this.init();
    if (!this.ctx) return;

    // Resume context if suspended (browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.isPlaying = true;
    this.currentNoteIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    
    // Smooth Fade In
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime + 2);
    }

    this.scheduler();
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    this.isStopping = true;
    
    // Smooth Fade Out
    const fadeOutTime = 1.0;
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeOutTime);

    setTimeout(() => {
      this.isPlaying = false;
      this.isStopping = false;
      if (this.timerID) clearTimeout(this.timerID);
    }, fadeOutTime * 1000);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.15, t + 0.5);
    }
  }
}

export default new MusicManager();