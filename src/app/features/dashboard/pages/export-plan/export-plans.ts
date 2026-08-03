import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, switchMap, takeWhile, timer } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import {
  ExportPlan, ExportPlanCreateRequest, ExportPlanScheduleAnalysis,
  ExportPlanScheduleAnalysisRequest, MasterDataItem, PlanningStatus,
} from '@core/api/api.models';
import { EGYPT_GOVERNORATES, EgyptDistrict } from '@shared/data/egypt-locations';

type PlanTab = 'all' | 'active' | 'completed' | 'planning';

interface MapTile {
  key: string;
  url: string;
  left: number;
  top: number;
}

interface FarmLocationPreset {
  label: string;
  governorate: string;
}

@Component({
  selector: 'app-export-plans',
  imports: [FormsModule, RouterLink],
  templateUrl: './export-plans-view.html',
  styleUrl: './export-plans.css',
})
export class ExportPlans {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);

  public readonly search = signal('');
  public readonly selectedTab = signal<PlanTab>('all');
  public readonly plans = signal<ExportPlan[]>([]);
  public readonly crops = signal<MasterDataItem[]>([]);
  public readonly destinations = signal<MasterDataItem[]>([]);
  public readonly loading = signal(true);
  public readonly saving = signal(false);
  public readonly analyzing = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly formOpen = signal(false);
  public readonly planning = signal<PlanningStatus | null>(null);
  public readonly formStep = signal(1);
  public readonly stepError = signal<string | null>(null);
  public readonly scheduleAnalysis = signal<ExportPlanScheduleAnalysis | null>(null);
  public readonly scheduleDirty = signal(false);
  public readonly scheduleWarningsAccepted = signal(false);
  public readonly mapLocationSelected = signal(false);
  public readonly mapPinIsApproximate = signal(false);
  public readonly mapCenter = signal({ latitude: 26.8206, longitude: 30.8025 });
  public readonly mapZoom = signal(6);
  public readonly governorates = EGYPT_GOVERNORATES;

  public readonly requiresScheduleAcknowledgement = computed(() => {
    const analysis = this.scheduleAnalysis();
    return !!analysis && (analysis.assessment !== 'Feasible' || analysis.confidence === 'Low');
  });

  private mapPanStart: { x: number; y: number; centerX: number; centerY: number } | null = null;
  private mapDragged = false;

  public form: ExportPlanCreateRequest = this.emptyForm();

  public readonly formSteps = [
    { number: 1, label: 'بيانات الخطة', hint: 'المحصول والوجهة' },
    { number: 2, label: 'موقع المزرعة', hint: 'العنوان والخريطة' },
    { number: 3, label: 'المواعيد', hint: 'الجدول والمراجعة' },
  ] as const;

  public readonly locationPresets: readonly FarmLocationPreset[] = [
    { label: 'القاهرة', governorate: 'القاهرة' },
    { label: 'الإسكندرية', governorate: 'الإسكندرية' },
    { label: 'الإسماعيلية', governorate: 'الإسماعيلية' },
    { label: 'المنيا', governorate: 'المنيا' },
  ];

  public readonly mapTiles = computed<MapTile[]>(() => {
    const zoom = this.mapZoom();
    const center = this.mapCenter();
    const worldSize = 256 * 2 ** zoom;
    const centerX = ((center.longitude + 180) / 360) * worldSize;
    const latitudeRadians = (Math.max(-85, Math.min(85, center.latitude)) * Math.PI) / 180;
    const centerY = (1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2 * worldSize;
    const centerTileX = Math.floor(centerX / 256);
    const centerTileY = Math.floor(centerY / 256);
    const tileCount = 2 ** zoom;
    const tiles: MapTile[] = [];

    for (let yOffset = -2; yOffset <= 2; yOffset += 1) {
      const y = centerTileY + yOffset;
      if (y < 0 || y >= tileCount) continue;
      for (let xOffset = -3; xOffset <= 3; xOffset += 1) {
        const x = centerTileX + xOffset;
        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        tiles.push({
          key: `${zoom}-${x}-${y}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
          left: x * 256 - centerX,
          top: y * 256 - centerY,
        });
      }
    }

    return tiles;
  });

  public readonly markerPosition = computed(() => {
    const center = this.mapCenter();
    const zoom = this.mapZoom();
    const size = 256 * 2 ** zoom;
    const centerPoint = this.coordinatesToWorld(center.latitude, center.longitude, zoom);
    const markerPoint = this.coordinatesToWorld(this.form.latitude, this.form.longitude, zoom);
    let x = markerPoint.x - centerPoint.x;
    if (x > size / 2) x -= size;
    if (x < -size / 2) x += size;
    return { x, y: markerPoint.y - centerPoint.y };
  });

  public readonly tabs: readonly { value: PlanTab; label: string }[] = [
    { value: 'all', label: 'كل الخطط' },
    { value: 'active', label: 'نشطة' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'planning', label: 'قيد التخطيط' },
  ];

  public readonly filteredPlans = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    const tab = this.selectedTab();
    return this.plans().filter((plan) => {
      const matchesSearch = !term || [plan.name, plan.crop, plan.destination, String(plan.id)]
        .some((value) => value.toLocaleLowerCase().includes(term));
      const matchesTab = tab === 'all'
        || (tab === 'active' && ['InProgress', 'ReadyForExport'].includes(plan.status))
        || (tab === 'completed' && plan.status === 'Completed')
        || (tab === 'planning' && plan.status === 'Planning');
      return matchesSearch && matchesTab;
    });
  });

  public constructor() {
    this.load();
  }

  public openForm(): void {
    this.form = this.emptyForm();
    this.error.set(null);
    this.stepError.set(null);
    this.formStep.set(1);
    this.mapLocationSelected.set(false);
    this.mapPinIsApproximate.set(false);
    this.mapCenter.set({ latitude: 26.8206, longitude: 30.8025 });
    this.mapZoom.set(6);
    this.scheduleAnalysis.set(null);
    this.scheduleDirty.set(false);
    this.scheduleWarningsAccepted.set(false);
    this.formOpen.set(true);
  }

  public closeForm(): void {
    if (!this.saving()) this.formOpen.set(false);
  }

  public nextStep(): void {
    if (!this.validateStep(this.formStep())) return;
    this.stepError.set(null);
    if (this.formStep() === 2) {
      this.analyzeSchedule(false);
      return;
    }
    this.formStep.update((step) => Math.min(3, step + 1));
  }

  public previousStep(): void {
    this.stepError.set(null);
    this.formStep.update((step) => Math.max(1, step - 1));
  }

  public goToStep(step: number): void {
    if (step === 3 && (!this.scheduleAnalysis() || this.scheduleDirty())) {
      if (this.validateStep(1) && this.validateStep(2)) this.analyzeSchedule(false);
      return;
    }
    if (step >= this.formStep()) {
      for (let current = this.formStep(); current < step; current += 1) {
        if (!this.validateStep(current)) return;
      }
    }
    this.stepError.set(null);
    this.formStep.set(step);
  }

  public cropName(): string {
    return this.crops().find((item) => item.id === this.form.cropId)?.name ?? 'غير محدد';
  }

  public destinationName(): string {
    return this.destinations().find((item) => item.id === this.form.destinationId)?.name ?? 'غير محددة';
  }

  public availableDistricts(): readonly EgyptDistrict[] {
    return this.governorates
      .find((governorate) => governorate.name === this.form.governorate)
      ?.districts.filter((district) => district.name !== 'خارج الزمام') ?? [];
  }

  public onGovernorateChange(governorateName: string): void {
    this.form.governorate = governorateName;
    this.form.city = '';
    this.mapLocationSelected.set(false);
    this.mapPinIsApproximate.set(false);

    const governorate = this.governorates.find((item) => item.name === governorateName);
    if (governorate) {
      this.mapCenter.set({ latitude: governorate.latitude, longitude: governorate.longitude });
      this.mapZoom.set(8);
    }
    this.stepError.set(null);
    this.invalidateSchedule();
  }

  public onDistrictChange(districtName: string): void {
    this.form.city = districtName;
    const district = this.availableDistricts().find((item) => item.name === districtName);
    if (district) this.setFarmLocation(district.latitude, district.longitude, 12, true);
    this.invalidateSchedule();
  }

  public selectPreset(preset: FarmLocationPreset): void {
    this.onGovernorateChange(preset.governorate);
  }

  public chooseMapLocation(event: MouseEvent): void {
    if (this.mapDragged) {
      this.mapDragged = false;
      return;
    }
    const element = event.currentTarget as HTMLElement;
    const bounds = element.getBoundingClientRect();
    const center = this.coordinatesToWorld(this.mapCenter().latitude, this.mapCenter().longitude, this.mapZoom());
    const worldX = center.x + event.clientX - bounds.left - bounds.width / 2;
    const worldY = center.y + event.clientY - bounds.top - bounds.height / 2;
    const location = this.worldToCoordinates(worldX, worldY, this.mapZoom());
    this.setFarmLocation(location.latitude, location.longitude);
  }

  public startMapPan(event: PointerEvent): void {
    const center = this.coordinatesToWorld(this.mapCenter().latitude, this.mapCenter().longitude, this.mapZoom());
    this.mapPanStart = { x: event.clientX, y: event.clientY, centerX: center.x, centerY: center.y };
    this.mapDragged = false;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  public moveMapPan(event: PointerEvent): void {
    if (!this.mapPanStart) return;
    const deltaX = event.clientX - this.mapPanStart.x;
    const deltaY = event.clientY - this.mapPanStart.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 6) this.mapDragged = true;
    if (!this.mapDragged) return;
    const location = this.worldToCoordinates(this.mapPanStart.centerX - deltaX, this.mapPanStart.centerY - deltaY, this.mapZoom());
    this.mapCenter.set(this.keepInsideEgypt(location));
  }

  public endMapPan(): void {
    this.mapPanStart = null;
  }

  public handleMapKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const center = this.mapCenter();
      this.setFarmLocation(center.latitude, center.longitude);
      return;
    }

    const movement: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const direction = movement[event.key];
    if (!direction) return;

    event.preventDefault();
    const center = this.coordinatesToWorld(this.mapCenter().latitude, this.mapCenter().longitude, this.mapZoom());
    const distance = event.shiftKey ? 96 : 48;
    this.mapCenter.set(this.keepInsideEgypt(this.worldToCoordinates(
      center.x + direction.x * distance,
      center.y + direction.y * distance,
      this.mapZoom(),
    )));
  }

  public zoomMapWithWheel(event: WheelEvent): void {
    event.preventDefault();
    this.mapZoom.update((zoom) => Math.max(5, Math.min(16, zoom + (event.deltaY < 0 ? 1 : -1))));
  }

  public selectMapCenter(event: Event): void {
    event.stopPropagation();
    const center = this.mapCenter();
    this.setFarmLocation(center.latitude, center.longitude);
  }

  public zoomMap(delta: number, event: Event): void {
    event.stopPropagation();
    this.mapZoom.update((zoom) => Math.max(5, Math.min(16, zoom + delta)));
  }

  public recenterMap(event: Event): void {
    event.stopPropagation();
    if (this.mapLocationSelected()) {
      this.mapCenter.set({ latitude: this.form.latitude, longitude: this.form.longitude });
      this.mapZoom.update((zoom) => Math.max(10, zoom));
    } else {
      this.mapCenter.set({ latitude: 26.8206, longitude: 30.8025 });
      this.mapZoom.set(6);
    }
  }

  public create(): void {
    if (!this.validateStep(3)) return;
    const analysis = this.scheduleAnalysis();
    if (!analysis || this.scheduleDirty()) {
      this.stepError.set('أعد تقييم المواعيد قبل تأكيد إنشاء الخطة.');
      return;
    }
    if (this.requiresScheduleAcknowledgement() && !this.scheduleWarningsAccepted()) {
      this.stepError.set('أكد اطلاعك على تحذيرات التحليل قبل إنشاء الخطة.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.createExportPlan({
      ...this.form,
      notes: this.form.notes || null,
      acceptScheduleWarnings: this.scheduleWarningsAccepted(),
    }).pipe(
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (plan) => {
        this.formOpen.set(false);
        this.loadPlans();
        this.pollPlanning(plan.id);
      },
      error: (error) => this.error.set(error.error?.error?.message ?? 'تعذر إنشاء خطة التصدير.'),
    });
  }

  public analyzeSchedule(reEvaluate: boolean): void {
    if (!this.validateStep(1) || !this.validateStep(2) || this.analyzing()) return;
    if (reEvaluate && !this.validateDateSequence()) return;

    this.analyzing.set(true);
    this.stepError.set(null);
    this.scheduleWarningsAccepted.set(false);
    const request: ExportPlanScheduleAnalysisRequest = {
      name: this.form.name,
      cropId: this.form.cropId,
      destinationId: this.form.destinationId,
      governorate: this.form.governorate,
      city: this.form.city,
      latitude: this.form.latitude,
      longitude: this.form.longitude,
      areaInFeddan: this.form.areaInFeddan,
      notes: this.form.notes || null,
      ...(reEvaluate ? {
        plantingDate: this.form.plantingDate,
        expectedHarvestDate: this.form.expectedHarvestDate,
        expectedExportDate: this.form.expectedExportDate,
      } : {}),
    };

    this.api.analyzeExportPlanSchedule(request).pipe(
      finalize(() => this.analyzing.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (analysis) => {
        this.scheduleAnalysis.set(analysis);
        this.form.plantingDate = analysis.plantingDate;
        this.form.expectedHarvestDate = analysis.expectedHarvestDate;
        this.form.expectedExportDate = analysis.expectedExportDate;
        this.form.analysisToken = analysis.analysisToken;
        this.scheduleDirty.set(false);
        this.formStep.set(3);
      },
      error: (error) => {
        const validation = error.error?.error?.validationErrors as Record<string, string[]> | undefined;
        this.stepError.set(validation ? Object.values(validation).flat()[0] : 'تعذر تحليل الموسم والمواعيد. حاول مرة أخرى.');
      },
    });
  }

  public markDatesChanged(): void {
    if (!this.scheduleAnalysis()) return;
    this.scheduleDirty.set(true);
    this.form.analysisToken = '';
    this.scheduleWarningsAccepted.set(false);
    this.stepError.set(null);
  }

  public invalidateSchedule(): void {
    if (!this.scheduleAnalysis() && !this.form.analysisToken) return;
    this.scheduleDirty.set(true);
    this.form.analysisToken = '';
    this.scheduleWarningsAccepted.set(false);
  }

  public assessmentLabel(value: string): string {
    return ({ Feasible: 'الخطة مناسبة', AtRisk: 'الخطة تحتاج حذرًا', NotRecommended: 'الخطة غير موصى بها' } as Record<string, string>)[value] ?? value;
  }

  public confidenceLabel(value: string): string {
    return ({ High: 'ثقة مرتفعة', Medium: 'ثقة متوسطة', Low: 'ثقة منخفضة' } as Record<string, string>)[value] ?? value;
  }

  public retry(planId: number): void {
    this.api.retryPlanning(planId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (status) => {
        this.planning.set(status);
        this.pollPlanning(planId);
        this.loadPlans();
      },
      error: () => this.error.set('تعذرت إعادة محاولة التخطيط.'),
    });
  }

  public progress(plan: ExportPlan): number {
    const start = new Date(plan.plantingDate).getTime();
    const end = new Date(plan.expectedExportDate).getTime();
    if (end <= start) return 0;
    return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (end - start)) * 100)));
  }

  public statusLabel(status: string): string {
    return ({ Planning: 'قيد التخطيط', InProgress: 'قيد التنفيذ', ReadyForExport: 'جاهزة للتصدير', Completed: 'مكتملة', Draft: 'مسودة', Cancelled: 'ملغاة' } as Record<string, string>)[status] ?? status;
  }

  public planningLabel(status: string): string {
    return ({ Pending: 'بانتظار الذكاء الاصطناعي', InProgress: 'الذكاء الاصطناعي يجهز المهام', Succeeded: 'تم إنشاء المهام', Failed: 'فشل إنشاء المهام' } as Record<string, string>)[status] ?? status;
  }

  private load(): void {
    this.loading.set(true);
    this.loadPlans();
    this.api.crops().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (items) => this.crops.set(items), error: () => this.error.set('تعذر تحميل المحاصيل.') });
    this.api.destinations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (items) => this.destinations.set(items), error: () => this.error.set('تعذر تحميل الوجهات.') });
  }

  private loadPlans(): void {
    this.api.exportPlans().pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (plans) => this.plans.set(plans),
      error: () => this.error.set('تعذر تحميل خطط التصدير.'),
    });
  }

  private pollPlanning(planId: number): void {
    timer(0, 2000).pipe(
      switchMap(() => this.api.planningStatus(planId).pipe(catchError(() => EMPTY))),
      takeWhile((status) => status.status === 'Pending' || status.status === 'InProgress', true),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((status) => {
      this.planning.set(status);
      if (status.status === 'Succeeded' || status.status === 'Failed') this.loadPlans();
    });
  }

  private validateStep(step: number): boolean {
    if (step === 1 && (!this.form.name.trim() || !this.form.cropId || !this.form.destinationId)) {
      this.stepError.set('أكمل اسم الخطة، ثم اختر المحصول والوجهة للمتابعة.');
      return false;
    }
    const districtIsValid = this.availableDistricts().some((district) => district.name === this.form.city);
    if (step === 2 && (!this.form.governorate || !districtIsValid || this.form.areaInFeddan <= 0 || !this.mapLocationSelected())) {
      this.stepError.set('اختر المحافظة والمدينة، وأدخل المساحة، ثم ثبّت موقع المزرعة على الخريطة.');
      return false;
    }
    if (step === 3) {
      if (!this.scheduleAnalysis() || this.scheduleDirty()) {
        this.stepError.set('حلل المواعيد أو أعد تقييم تعديلاتك قبل إنشاء الخطة.');
        return false;
      }
      if (!this.form.plantingDate || !this.form.expectedHarvestDate || !this.form.expectedExportDate) {
        this.stepError.set('أكمل التواريخ المطلوبة قبل إنشاء الخطة.');
        return false;
      }
      if (this.form.plantingDate > this.form.expectedHarvestDate || this.form.expectedHarvestDate > this.form.expectedExportDate) {
        this.stepError.set('يجب أن يكون الحصاد بعد الزراعة، والتصدير بعد الحصاد.');
        return false;
      }
    }
    return true;
  }

  private validateDateSequence(): boolean {
    if (!this.form.plantingDate || !this.form.expectedHarvestDate || !this.form.expectedExportDate) {
      this.stepError.set('أكمل التواريخ الثلاثة قبل إعادة التقييم.');
      return false;
    }
    if (this.form.plantingDate >= this.form.expectedHarvestDate || this.form.expectedHarvestDate > this.form.expectedExportDate) {
      this.stepError.set('يجب أن يكون الحصاد بعد الزراعة، والتصدير في يوم الحصاد أو بعده.');
      return false;
    }
    return true;
  }

  private setFarmLocation(latitude: number, longitude: number, zoom?: number, approximate = false): void {
    const location = this.keepInsideEgypt({ latitude, longitude });
    this.form.latitude = Number(location.latitude.toFixed(6));
    this.form.longitude = Number(location.longitude.toFixed(6));
    this.mapLocationSelected.set(true);
    this.mapPinIsApproximate.set(approximate);
    this.mapCenter.set({ latitude: this.form.latitude, longitude: this.form.longitude });
    if (zoom) this.mapZoom.set(zoom);
    this.stepError.set(null);
    this.invalidateSchedule();
  }

  private coordinatesToWorld(latitude: number, longitude: number, zoom: number): { x: number; y: number } {
    const size = 256 * 2 ** zoom;
    const lat = Math.max(-85, Math.min(85, latitude));
    const radians = lat * Math.PI / 180;
    return {
      x: ((longitude + 180) / 360) * size,
      y: (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2 * size,
    };
  }

  private worldToCoordinates(x: number, y: number, zoom: number): { latitude: number; longitude: number } {
    const size = 256 * 2 ** zoom;
    const wrappedX = ((x % size) + size) % size;
    const clampedY = Math.max(0, Math.min(size, y));
    const longitude = wrappedX / size * 360 - 180;
    const latitude = Math.atan(Math.sinh(Math.PI * (1 - 2 * clampedY / size))) * 180 / Math.PI;
    return { latitude, longitude };
  }

  private keepInsideEgypt(location: { latitude: number; longitude: number }): { latitude: number; longitude: number } {
    return {
      latitude: Math.max(21.7, Math.min(31.75, location.latitude)),
      longitude: Math.max(24.7, Math.min(36.9, location.longitude)),
    };
  }

  private emptyForm(): ExportPlanCreateRequest {
    return {
      name: '', cropId: 0, destinationId: 0, governorate: '', city: '',
      latitude: 30.0444, longitude: 31.2357, areaInFeddan: 1,
      plantingDate: '', expectedHarvestDate: '', expectedExportDate: '', notes: null,
      analysisToken: '', acceptScheduleWarnings: false,
    };
  }
}
