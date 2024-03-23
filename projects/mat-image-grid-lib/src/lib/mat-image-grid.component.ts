import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { DefaultPigSettings } from './classes/pig-settings.class';
import { Pig } from './classes/pig.class';
import { RequestImagesRange } from './interfaces/pig-datastore-provider.interface';
import {
  PigSettings,
  PigSettingsBase,
} from './interfaces/pig-settings.interface';
import { MatImageGridImageServiceBase } from './mat-image-grid.service';

@Component({
  selector: 'mat-image-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mat-image-grid.component.html',
  styleUrl: './mat-image-grid.component.scss',
})
export class MatImageGridLibComponent implements AfterViewInit {
  @Input() pigSettings: PigSettings = {};
  @Output() numberOfImagesOnServer = new EventEmitter<number>();
  @Output() numberOfLoadedImages = new EventEmitter<number>();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  @ViewChild('pigContainer') private pigContainer!: ElementRef<HTMLDivElement>;
  private defaultPigSettings: PigSettingsBase;
  private pig!: Pig; // Don't use before AfterViewInit

  constructor(private matImageGridImageService: MatImageGridImageServiceBase) {
    this.defaultPigSettings = new DefaultPigSettings();
  }

  public ngAfterViewInit(): void {
    const currentSettings = { ...this.defaultPigSettings, ...this.pigSettings };
    currentSettings.scroller = this.pigContainer.nativeElement;

    // Start with empty list of images
    this.pig = new Pig([], currentSettings);

    // Get list of images
    const imagesRange = {
      startImageIndex: 0,
      numberOfImages: -1,
    } as RequestImagesRange;

    setTimeout(() => this.loadingSubject.next(true), 0);
    this.matImageGridImageService.getPagedData(imagesRange).subscribe({
      next: (serverResponse) => {
        this.pig.setImageData(serverResponse.content);
        this.pig.enable();
        this.numberOfImagesOnServer.emit(serverResponse.totalElements);
        this.numberOfLoadedImages.emit(serverResponse.returnedElements);
        this.loadingSubject.next(false);
      },
      error: (err: Error) => console.error(err.message),
    });
  }
}
