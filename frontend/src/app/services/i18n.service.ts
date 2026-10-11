import { Injectable, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { DICTIONARY } from '../i18n/dictionary';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private settings = inject(SettingsService);
  private langSignal = signal<'vi' | 'en'>(this.settings.currentLanguage);

  constructor() {
    this.settings.language$.subscribe(lang => this.langSignal.set(lang));
  }

  public get currentLang(): 'vi' | 'en' {
    return this.langSignal();
  }

  public get isEnglish(): boolean {
    return this.langSignal() === 'en';
  }

  public t(source: string | null | undefined): string {
    const lang = this.langSignal();
    if (source == null) return '';
    if (lang !== 'en') return source;
    return DICTIONARY[source] ?? source;
  }
}
