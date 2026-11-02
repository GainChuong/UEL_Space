import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/layout/header/header';
import { Footer } from './components/layout/footer/footer';
import { AuthModalComponent } from './components/common/auth-modal/auth-modal';
import { ChatbotComponent } from './components/common/chatbot/chatbot';
import { filter } from 'rxjs/operators';

@Component({
  imports: [CommonModule, RouterOutlet, Header, Footer, AuthModalComponent, ChatbotComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('UEL Space - Nền tảng chia sẻ & cho thuê văn phòng thông minh');
  hideHeaderFooter: boolean = false;

  constructor(private router: Router) {
    if (typeof window !== 'undefined') {
      this.hideHeaderFooter = this.shouldHide(window.location.pathname);
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.hideHeaderFooter = this.shouldHide(event.urlAfterRedirects || event.url || '');
      });
  }

  private shouldHide(url: string): boolean {
    return url.includes('/login') || 
           url.includes('/admin') || 
           url.includes('/seller-dashboard') || 
           url.includes('/seller-portal') ||
           url.includes('/cctv-lens');
  }
}