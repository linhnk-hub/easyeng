/**
 * Text-to-Speech service using browser native SpeechSynthesis
 * Defaults to Female voice ("Trợ lý Google" - Google US English) with clear standard and slow speed controls
 */

export type VoiceGender = 'female' | 'male';

class SpeechService {
  private autoSpeak: boolean = true;
  private voiceGender: VoiceGender = 'female';
  private currentVoice: SpeechSynthesisVoice | null = null;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private maleVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    const savedAuto = localStorage.getItem('easyeng_auto_speak');
    if (savedAuto !== null) {
      this.autoSpeak = savedAuto === 'true';
    }

    // Default permanently to female voice ("Trợ lý Google")
    this.voiceGender = 'female';

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));

    if (enVoices.length === 0) return;

    // Prioritize Google Assistant ("Google US English") and standard friendly female voices
    const googleAssistantVoices = enVoices.filter(v =>
      v.name.toLowerCase().includes('google us english') ||
      (v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('male'))
    );

    const femaleKeywords = [
      'google us english',
      'google',
      'female',
      'samantha',
      'victoria',
      'karen',
      'zira',
      'siri',
      'fiona',
      'hazel',
      'jenny'
    ];

    this.femaleVoice =
      googleAssistantVoices[0] ||
      enVoices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k))) ||
      enVoices[0];

    const maleKeywords = ['male', 'daniel', 'david', 'george', 'guy', 'alex', 'fred', 'oliver', 'google uk english male', 'tom'];
    this.maleVoice =
      enVoices.find(v => maleKeywords.some(k => v.name.toLowerCase().includes(k))) ||
      enVoices.find(v => v !== this.femaleVoice) ||
      enVoices[0];

    this.updateActiveVoice();
  }

  private updateActiveVoice() {
    this.currentVoice = this.femaleVoice;
  }

  public setVoiceGender(gender: VoiceGender) {
    this.voiceGender = gender;
    this.updateActiveVoice();
  }

  public getVoiceGender(): VoiceGender {
    return this.voiceGender;
  }

  public setAutoSpeak(enabled: boolean) {
    this.autoSpeak = enabled;
    localStorage.setItem('easyeng_auto_speak', enabled ? 'true' : 'false');
  }

  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioFallback: HTMLAudioElement | null = null;

  public isAutoSpeak(): boolean {
    return this.autoSpeak;
  }

  /**
   * Fallback using online TTS audio in case Web Speech API fails or is muted in Firefox
   */
  private playAudioFallback(text: string, rate: number = 1.0) {
    try {
      if (this.currentAudioFallback) {
        this.currentAudioFallback.pause();
        this.currentAudioFallback = null;
      }
      const clean = encodeURIComponent(text.trim());
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${clean}`;
      const audio = new Audio(url);
      if (rate < 0.9) {
        audio.playbackRate = 0.75;
      } else {
        audio.playbackRate = 1.0;
      }
      this.currentAudioFallback = audio;
      audio.play().catch(() => {
        // Ignored if autoplay policy blocks without user gesture
      });
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Speak English text with female voice ("Trợ lý Google") and rate
   * Optimized for Firefox, Safari, Chrome and mobile devices
   * @param text English text
   * @param rate 1.0 (normal) or 0.65 (slow)
   */
  public speak(text: string, rate: number = 1.0) {
    if (!text || !text.trim()) return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.playAudioFallback(text, rate);
      return;
    }

    try {
      // In Firefox, if paused, resume synthesis
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Safe rate clamping: Firefox eSpeak and Windows SAPI crash or drop utterances below 0.6
      const safeRate = Math.max(0.65, Math.min(rate, 1.5));

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'en-US';
      utterance.rate = safeRate;
      utterance.pitch = 1.05;

      this.updateActiveVoice();
      if (this.currentVoice) {
        utterance.voice = this.currentVoice;
      }

      // Keep strong reference to prevent Firefox garbage collection bug
      this.activeUtterance = utterance;

      let started = false;
      utterance.onstart = () => {
        started = true;
      };

      utterance.onend = () => {
        this.activeUtterance = null;
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e.error);
        this.activeUtterance = null;
        // If synthesis failed, switch to audio fallback
        this.playAudioFallback(text, safeRate);
      };

      // Firefox cancel bug workaround: only cancel if actively speaking
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      window.speechSynthesis.speak(utterance);

      // On Firefox, if synthesis fails to start within 350ms, trigger fallback
      setTimeout(() => {
        if (!started && this.activeUtterance === utterance) {
          if (!window.speechSynthesis.speaking) {
            this.playAudioFallback(text, safeRate);
          }
        }
      }, 350);

    } catch (err) {
      console.warn('Speech error, using fallback:', err);
      this.playAudioFallback(text, rate);
    }
  }

  /**
   * Speak slowly (0.65x) for accurate phonics and comprehension without triggering Firefox rate limits
   */
  public speakSlowly(text: string) {
    this.speak(text, 0.65);
  }

  /**
   * Speak normal speed (1.0x)
   */
  public speakNormal(text: string) {
    this.speak(text, 1.0);
  }
}

export const speechService = new SpeechService();

