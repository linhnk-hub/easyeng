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
   * High-reliability audio fallback for Firefox, Safari, and systems without Web Speech API voices
   */
  private playAudioFallback(text: string, rate: number = 1.0) {
    try {
      if (this.currentAudioFallback) {
        this.currentAudioFallback.pause();
        this.currentAudioFallback.removeAttribute('src');
        this.currentAudioFallback.load();
        this.currentAudioFallback = null;
      }
      const clean = encodeURIComponent(text.trim());
      const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${clean}`;
      const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${clean}&type=2`;

      const audio = new Audio(googleUrl);
      audio.preload = 'auto';
      if (rate < 0.9) {
        audio.playbackRate = 0.75;
      } else {
        audio.playbackRate = 1.0;
      }

      let hasFallenBack = false;
      audio.onerror = () => {
        if (!hasFallenBack) {
          hasFallenBack = true;
          audio.src = youdaoUrl;
          audio.play().catch(e => console.warn('Secondary fallback notice:', e));
        }
      };

      this.currentAudioFallback = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (!hasFallenBack) {
            hasFallenBack = true;
            audio.src = youdaoUrl;
            audio.play().catch(e => console.warn('Audio play notice:', e));
          }
        });
      }
    } catch (err) {
      console.warn('Audio fallback error:', err);
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

    // Immediately stop any running speech synthesis or audio fallback to guarantee single-voice playback
    this.cancel();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.playAudioFallback(text, rate);
      return;
    }

    try {
      const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
      const safeRate = Math.max(0.65, Math.min(rate, 1.5));

      const voices = window.speechSynthesis.getVoices() || [];
      const hasEnVoice = voices.some(v => v.lang.toLowerCase().startsWith('en'));

      // If Firefox has no native English voices available, use online audio fallback
      if (isFirefox && (!hasEnVoice || voices.length === 0)) {
        this.playAudioFallback(text, safeRate);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'en-US';
      utterance.rate = safeRate;
      utterance.pitch = 1.05;

      this.updateActiveVoice();
      if (this.currentVoice) {
        utterance.voice = this.currentVoice;
      }

      // Strong global reference prevents Firefox/Chrome garbage collection bug
      this.activeUtterance = utterance;
      (window as any)._easyEngActiveUtterance = utterance;

      let resumeInterval: any = null;

      const clearAll = () => {
        if (resumeInterval) {
          clearInterval(resumeInterval);
          resumeInterval = null;
        }
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
      };

      utterance.onstart = () => {
        // Speech playback started
      };

      utterance.onend = () => {
        clearAll();
      };

      utterance.onerror = (e) => {
        clearAll();
        // CRITICAL: Ignore user-initiated cancellation or interruption events!
        // Do NOT trigger fallback when the utterance was stopped or replaced by another action.
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return;
        }
        console.warn('SpeechSynthesis error:', e.error);
        // Only trigger fallback if speech synthesis genuinely failed with a real error
        this.playAudioFallback(text, safeRate);
      };

      // Ensure speech synthesis is active
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);

      // Firefox-specific: resume queue immediately after speak() to unblock playback
      if (isFirefox) {
        window.speechSynthesis.resume();
        resumeInterval = setInterval(() => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 150);
      }

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

  /**
   * Immediately cancel any running speech synthesis or audio fallback
   */
  public cancel() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (this.currentAudioFallback) {
        this.currentAudioFallback.pause();
        this.currentAudioFallback.removeAttribute('src');
        this.currentAudioFallback.load();
        this.currentAudioFallback = null;
      }
      this.activeUtterance = null;
    } catch {}
  }
}

export const speechService = new SpeechService();

