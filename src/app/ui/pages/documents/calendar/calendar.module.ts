import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarComponent } from './calendar.component';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';
import { StoresSelectModule } from 'src/app/modules/trade-modules/stores-select/stores-select.module';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { SettingsCalendarDialogModule } from '../../../../modules/settings/settings-calendar-dialog/settings-calendar-dialog.module';
import { LabelsPrintDialogModule } from '../../../../modules/settings/labelprint-dialog/labelprint-dialog.module';
import { CalendarModule } from 'angular-calendar';
import { DayViewSchedulerModule } from 'src/app/modules/calendar/day-view-scheduler/day-view-scheduler.module';
import { DeppartsAndResourcesModule } from 'src/app/modules/calendar/depparts-and-resources/depparts-and-resources.module';
import {
  CalendarDateFormatter,
  CalendarMomentDateFormatter,
  DateAdapter,
  MOMENT,
} from 'angular-calendar';
import moment from 'moment';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
import localeRu       from '@angular/common/locales/ru';
import localeSrCyrl   from '@angular/common/locales/sr-Cyrl';
import localeMn       from '@angular/common/locales/sr-Latn-ME';
import localeEnAu     from '@angular/common/locales/en-AU';
import localeEn       from '@angular/common/locales/en';
import localeEnGb     from '@angular/common/locales/en-GB';
import localeEnIe     from '@angular/common/locales/en-IE';
import localeEnIl     from '@angular/common/locales/en-IL';
import localeEnIn     from '@angular/common/locales/en-IN';
import localeEnNz     from '@angular/common/locales/en-NZ';
import localeEnSg     from '@angular/common/locales/en-SG';
import localeBsLatin  from '@angular/common/locales/bs-Latn';
import localeHr       from '@angular/common/locales/hr';

export function momentAdapterFactory() {
  return adapterFactory(moment);
}

registerLocaleData(localeRu);
registerLocaleData(localeMn);
registerLocaleData(localeSrCyrl);
registerLocaleData(localeEnAu);
registerLocaleData(localeEn);
registerLocaleData(localeEnIe);
registerLocaleData(localeEnGb);
registerLocaleData(localeEnIl);
registerLocaleData(localeEnIn);
registerLocaleData(localeEnNz);
registerLocaleData(localeEnSg);
registerLocaleData(localeBsLatin);
registerLocaleData(localeHr);

@NgModule({
  declarations: [CalendarComponent],
  providers: [  
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' },
    {
      provide: MOMENT,
      useValue: moment,
    },
  ],
  imports: [
    CommonModule,
    CalendarModule.forRoot(
      {
        provide: DateAdapter,
        useFactory: momentAdapterFactory,
      },
      {
        dateFormatter: {
          provide: CalendarDateFormatter,
          useClass: CalendarMomentDateFormatter,
        },
      }
    ),
    DayViewSchedulerModule,
    DeppartsAndResourcesModule,
    CalendarRoutingModule,
    ProductCategoriesSelectModule,
    StoresSelectModule,
    ReactiveFormsModule,
    SettingsCalendarDialogModule,
    LabelsPrintDialogModule,
    MaterialModule,
    FormsModule,
    DragDropModule,
    TranslocoModule
  ]
})
export class Calendar_Module { }
