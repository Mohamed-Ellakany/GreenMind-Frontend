import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDashboard, ExportPlanDetails, SoilMeasurement, SoilMeasurementRequest } from '@core/api/api.models';
import { DatePickerDirective, NumericInputDirective } from '@shared/components/platform-form-controls';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import { toLocalIsoDate } from '@shared/utils/local-date';

type SoilFormModel = {
  measurementDate: string;
  ph: number | null;
  ec: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  moisture: number | null;
  notes: string | null;
};

interface AgronomicAdvice {
  tone: 'good' | 'warning' | 'danger' | 'info';
  title: string;
  detail: string;
  action?: string;
}

@Component({
  selector: 'app-soil-monitoring-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DecimalPipe,
    DatePickerDirective,
    PlantGrowthLoader,
  ],
  templateUrl: './soil-monitoring-page.html',
  styleUrl: './soil-monitoring-page.css',
})
export class SoilMonitoringPage {
  private readonly api = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly soilDialog = viewChild<ElementRef<HTMLDialogElement>>('soilDialog');

  public readonly planId = signal<number>(0);
  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly dashboard = signal<ExportPlanDashboard | null>(null);
  public readonly measurements = signal<SoilMeasurement[]>([]);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);

  public readonly soilFormOpen = signal(false);
  public readonly soilSaving = signal(false);
  public readonly soilError = signal<string | null>(null);
  public readonly soilSuccess = signal<string | null>(null);

  public soilForm: SoilFormModel = this.emptySoilForm();

  public readonly latestReading = computed(() => {
    const list = this.measurements();
    if (list.length > 0) return list[0];
    return this.dashboard()?.latestSoilMeasurement ?? null;
  });

  public readonly soilHealth = computed(() => {
    const soil = this.latestReading();
    if (!soil) {
      return {
        score: 0,
        label: 'غير مؤكدة',
        tone: 'neutral' as const,
        description: 'لم تُسجل أي قراءات بعد. أضف أول قراءة لبدء التقييم العلمي للتربة.',
      };
    }

    let score = 100;
    // Check pH (ideal 5.5 - 7.5)
    if (soil.ph < 5.5 || soil.ph > 7.8) score -= 30;
    else if (soil.ph < 6.0 || soil.ph > 7.3) score -= 10;

    // Check EC (ideal <= 2.5 dS/m)
    if (soil.ec > 3.5) score -= 35;
    else if (soil.ec > 2.5) score -= 15;

    // Check Moisture (ideal 50 - 80%)
    if (soil.moisture < 40 || soil.moisture > 90) score -= 35;
    else if (soil.moisture < 50 || soil.moisture > 80) score -= 15;

    score = Math.max(0, Math.min(100, score));

    if (score >= 85) return { score, label: 'ممتازة', tone: 'good' as const, description: 'كافة المؤشرات الكيميائية والفيزيائية للتربة في النطاق المثالي للمحصول.' };
    if (score >= 65) return { score, label: 'جيدة ومستقرة', tone: 'good' as const, description: 'حالة التربة مستقرة وجيدة مع وجود بعض التفاوتات الطفيفة التي يمكن ضبطها.' };
    if (score >= 45) return { score, label: 'تحتاج انتباه', tone: 'warning' as const, description: 'توجد مؤشرات تحتاج تعديلاً سريعاً لتفادي التأثير على نمو المحصول وجودة التصدير.' };
    return { score, label: 'حرجة', tone: 'danger' as const, description: 'توجد قراءات خارج الحدود الآمنة للمحصول، يرجى مراجعة التوصيات فوراً.' };
  });

  public readonly recommendations = computed<AgronomicAdvice[]>(() => {
    const soil = this.latestReading();
    if (!soil) {
      return [
        {
          tone: 'info',
          title: 'تسجيل أول قراءة ميدانية',
          detail: 'قم بأخذ عينة تربة وتسجيل قياسات الحموضة والملوحة والرطوبة لتفعيل التحليل الذكي والتوصيات الزراعية.',
          action: 'تسجيل قراءة الآن',
        },
      ];
    }

    const adviceList: AgronomicAdvice[] = [];

    // pH recommendations
    if (soil.ph > 7.8) {
      adviceList.push({
        tone: 'danger',
        title: 'ارتفاع قلوية التربة (pH مرتفع)',
        detail: `القراءة المسجلة ${soil.ph} أعلى من النطاق المثالي. يُنصح بإضافة مخصبات حامضية (مثل حامض النيتريك أو الهيوميك) والجبس الزراعي لخفض القلوية وتحسين تيسر العناصر الصغرى.`,
      });
    } else if (soil.ph < 5.5) {
      adviceList.push({
        tone: 'warning',
        title: 'حموضة التربة منخفضة',
        detail: `القراءة المسجلة ${soil.ph} تشير إلى حموضة زائدة. يُفضل استخدام كربونات الكالسيوم أو نترات الكالسيوم لمعادلة الحموضة وحماية الجذور.`,
      });
    } else {
      adviceList.push({
        tone: 'good',
        title: 'درجة الحموضة مثالية (pH: ' + soil.ph + ')',
        detail: 'درجة حموضة التربة ممتازة وتضمن أقصى كفاءة لامتصاص العناصر الكبرى والصغرى بواسطة الجذور.',
      });
    }

    // EC recommendations
    if (soil.ec > 3.0) {
      adviceList.push({
        tone: 'danger',
        title: 'ارتفاع ملوحة التربة (EC: ' + soil.ec + ' dS/m)',
        detail: 'الملوحة مرتفعة وقد تسبب إجهاداً اسموزياً وحروقاً لأطراف الأوراق. يُرجى زيادة رية غسيلية بنسبة 20-25% وتجنب الأسمدة ذات الدليل الملحي المرتفع.',
      });
    } else if (soil.ec > 2.2) {
      adviceList.push({
        tone: 'warning',
        title: 'مستوى الملوحة يقترب من الحد الأقصى (EC: ' + soil.ec + ' dS/m)',
        detail: 'يُفضل ضبط برنامج التسميد ومراقبة ملوحة مياه الري بانتظام لتجنب تراكم الأملاح في منطقة الجذور.',
      });
    } else {
      adviceList.push({
        tone: 'good',
        title: 'الملوحة في الحد الآمن (EC: ' + soil.ec + ' dS/m)',
        detail: 'التوصيل الكهربائي للتربة منخفض وآمن تماماً، ولا توجد أي مخاطر ملوحة على الجذور أو المحصول.',
      });
    }

    // Moisture recommendations
    if (soil.moisture < 45) {
      adviceList.push({
        tone: 'warning',
        title: 'رطوبة التربة منخفضة (' + soil.moisture + '%)',
        detail: 'التربة جافة نسبياً. يُنصح بجدولة رية إضافية وتقليل الفواصل الزمنية بين الريات لتجنب ذبول النبات.',
      });
    } else if (soil.moisture > 85) {
      adviceList.push({
        tone: 'warning',
        title: 'رطوبة زائدة عن الحد (' + soil.moisture + '%)',
        detail: 'تشبع مائي مرتفع قد يؤدي لنقص الأكسجين في منطقة الجذور. يُرجى فحص كفاءة الصرف وتأجيل الري القادم.',
      });
    } else {
      adviceList.push({
        tone: 'good',
        title: 'رطوبة التربة متوازنة (' + soil.moisture + '%)',
        detail: 'نسبة الرطوبة ممتازة وتوفر بيئة مثالية لنمو الشعيرات الجذرية وامتصاص المحاليل المغذية.',
      });
    }

    // NPK check
    if (soil.nitrogen != null && soil.phosphorus != null && soil.potassium != null) {
      adviceList.push({
        tone: 'info',
        title: 'مستوى العناصر الكبرى (NPK: ' + soil.nitrogen + '-' + soil.phosphorus + '-' + soil.potassium + ')',
        detail: 'تم رصد التوازن الغذائي للعناصر الكبرى. حافظ على الجرعات الموصى بها في خطة التسميد الموسمية.',
      });
    }

    return adviceList;
  });

  public constructor() {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap((params) => {
        const id = Number(params.get('id'));
        if (!Number.isInteger(id) || id <= 0) {
          this.error.set('معرّف خطة التصدير غير صالح.');
          this.loading.set(false);
          return of(null);
        }
        this.planId.set(id);
        this.loading.set(true);
        this.error.set(null);

        return forkJoin({
          plan: this.api.exportPlan(id).pipe(catchError(() => of(null))),
          dashboard: this.api.dashboard(id).pipe(catchError(() => of(null))),
          measurements: this.api.soilMeasurements(id).pipe(catchError(() => of([]))),
        }).pipe(
          finalize(() => this.loading.set(false)),
          catchError(() => {
            this.error.set('تعذر تحميل بيانات متابعة التربة لهذه الخطة.');
            return of(null);
          }),
        );
      }),
    ).subscribe((result) => {
      if (!result) return;
      if (!result.plan) {
        this.error.set('لم يتم العثور على خطة التصدير المطلوبة.');
        return;
      }
      this.plan.set(result.plan);
      this.dashboard.set(result.dashboard);
      const sorted = [...(result.measurements || [])].sort((a, b) =>
        new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
      );
      this.measurements.set(sorted);
    });
  }

  public openSoilForm(): void {
    this.soilForm = this.emptySoilForm();
    this.soilError.set(null);
    this.soilSuccess.set(null);
    this.soilFormOpen.set(true);
    const dialog = this.soilDialog()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  public closeSoilForm(): void {
    const dialog = this.soilDialog()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
    this.soilFormOpen.set(false);
    this.soilError.set(null);
  }

  public saveSoilMeasurement(): void {
    const form = this.soilForm;
    if (!form.measurementDate) {
      this.soilError.set('يرجى تحديد تاريخ القياس.');
      return;
    }
    if (form.ph == null || form.ph < 0 || form.ph > 14) {
      this.soilError.set('قيمة الحموضة (pH) يجب أن تكون بين 0 و 14.');
      return;
    }
    if (form.ec == null || form.ec < 0 || form.ec > 20) {
      this.soilError.set('قيمة الملوحة (EC) يجب أن تكون بين 0 و 20 dS/m.');
      return;
    }
    if (form.moisture == null || form.moisture < 0 || form.moisture > 100) {
      this.soilError.set('نسبة الرطوبة يجب أن تكون بين 0% و 100%.');
      return;
    }

    this.soilSaving.set(true);
    this.soilError.set(null);

    const payload: SoilMeasurementRequest = {
      measurementDate: form.measurementDate,
      ph: form.ph,
      ec: form.ec,
      nitrogen: form.nitrogen ?? 0,
      phosphorus: form.phosphorus ?? 0,
      potassium: form.potassium ?? 0,
      moisture: form.moisture,
      notes: form.notes?.trim() || null,
    };

    this.api.createSoilMeasurement(this.planId(), payload).pipe(
      finalize(() => this.soilSaving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (created) => {
        this.measurements.update((prev) => [created, ...prev]);
        this.closeSoilForm();
        this.soilSuccess.set('تم تسجيل قراءة التربة بنجاح وتحديث المؤشرات والتحليلات.');
      },
      error: () => {
        this.soilError.set('تعذر حفظ قراءة التربة. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
      },
    });
  }

  public formatDate(value?: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  public compactDate(value?: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  }

  public getPhAssessment(ph: number): { label: string; tone: string } {
    if (ph < 5.5) return { label: 'حامضية مرتفعة', tone: 'danger' };
    if (ph < 6.0) return { label: 'حامضية مقبولة', tone: 'warning' };
    if (ph <= 7.3) return { label: 'مثالية', tone: 'good' };
    if (ph <= 7.8) return { label: 'قلوية خفيفة', tone: 'warning' };
    return { label: 'قلوية مرتفعة', tone: 'danger' };
  }

  public getEcAssessment(ec: number): { label: string; tone: string } {
    if (ec <= 1.5) return { label: 'مثالية ومنخفضة', tone: 'good' };
    if (ec <= 2.5) return { label: 'آمنة ومقبولة', tone: 'good' };
    if (ec <= 3.2) return { label: 'مرتفعة نسبياً', tone: 'warning' };
    return { label: 'ملوحة خطرة', tone: 'danger' };
  }

  public getMoistureAssessment(moisture: number): { label: string; tone: string } {
    if (moisture < 45) return { label: 'جافة', tone: 'warning' };
    if (moisture <= 80) return { label: 'رطوبة مثالية', tone: 'good' };
    if (moisture <= 88) return { label: 'رطبة جداً', tone: 'warning' };
    return { label: 'تشبع مائي', tone: 'danger' };
  }

  private emptySoilForm(): SoilFormModel {
    return {
      measurementDate: toLocalIsoDate(),
      ph: 6.5,
      ec: 1.2,
      nitrogen: 25,
      phosphorus: 18,
      potassium: 35,
      moisture: 65,
      notes: null,
    };
  }
}
