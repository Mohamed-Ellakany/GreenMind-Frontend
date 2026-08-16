import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private initialNavigation = true;

  protected readonly routeAnnouncement = signal('');

  public constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      globalThis.setTimeout(() => this.announceAndFocusRoute());
    });
  }

  private announceAndFocusRoute(): void {
    const pageName = this.document.title.split('|')[0]?.trim() || 'الصفحة الجديدة';
    this.routeAnnouncement.set(`تم الانتقال إلى ${pageName}`);

    if (this.initialNavigation) {
      this.initialNavigation = false;
      return;
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }
}
