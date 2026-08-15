import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCompass,
  faLightbulb,
  faRocket,
  faRotateRight,
  faSeedling,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { ProductTourService } from '@core/tour/product-tour.service';
import { AuthService } from '@features/auth/services/AuthService';

@Component({
  selector: 'app-product-tour',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './product-tour.html',
  styleUrl: './product-tour.css',
})
export class ProductTourComponent {
  public readonly tour = inject(ProductTourService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly popoverCard = viewChild<ElementRef<HTMLElement>>('popoverCard');
  private readonly welcomeModal = viewChild<ElementRef<HTMLElement>>('welcomeModal');
  private readonly completedModal = viewChild<ElementRef<HTMLElement>>('completedModal');

  public readonly ownerName = computed(() => this.auth.accountProfile()?.fullName || 'شريكنا العزيز');
  public readonly farmName = computed(() => this.auth.accountProfile()?.farmName || 'مزرعتك');

  public readonly icons = {
    arrowLeft: faArrowLeft,
    arrowRight: faArrowRight,
    check: faCheck,
    chevronLeft: faChevronLeft,
    chevronRight: faChevronRight,
    circleCheck: faCircleCheck,
    compass: faCompass,
    lightbulb: faLightbulb,
    rocket: faRocket,
    rotate: faRotateRight,
    seedling: faSeedling,
    xmark: faXmark,
  };

  @HostListener('document:keydown', ['$event'])
  public handleKeydown(event: KeyboardEvent): void {
    if (!this.tour.isActive() && !this.tour.isWelcomeOpen() && !this.tour.isCompletedOpen()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.tour.skipTour();
      return;
    }

    if (this.tour.isActive()) {
      if (event.key === 'ArrowLeft' || event.key === 'PageDown') {
        // In RTL, left arrow moves forward to next step
        event.preventDefault();
        this.tour.nextStep();
      } else if (event.key === 'ArrowRight' || event.key === 'PageUp') {
        // In RTL, right arrow moves back to previous step
        event.preventDefault();
        this.tour.prevStep();
      }
    }
  }

  public navigateTo(route: string): void {
    this.tour.closeAll();
    void this.router.navigateByUrl(route);
  }
}
