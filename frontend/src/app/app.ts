import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/layout/header/header';
import { Footer } from './components/layout/footer/footer';
import { AuthModalComponent } from './components/common/auth-modal/auth-modal';
import { filter } from 'rxjs/operators';

@Component({
  imports: [CommonModule, RouterOutlet, Header, Footer, AuthModalComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('UEL Space');
  hideHeaderFooter: boolean = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.hideHeaderFooter = event.urlAfterRedirects.includes('/login') || event.urlAfterRedirects.includes('/admin');
      });
  }
}