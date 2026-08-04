import { Component, input } from '@angular/core';

@Component({
  selector: 'app-plant-growth-loader',
  templateUrl: './plant-growth-loader.html',
  styleUrl: './plant-growth-loader.css',
})
export class PlantGrowthLoader {
  public readonly message = input('جارٍ تجهيز مساحة الخطة…');
  public readonly compact = input(false);
}
