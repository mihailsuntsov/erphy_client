import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { DayViewSchedulerComponent } from './day-view-scheduler.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { CalendarModule, DateAdapter,
  CalendarDateFormatter,
  CalendarMomentDateFormatter,
  MOMENT, } from 'angular-calendar';
import moment from 'moment';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';

export function momentAdapterFactory() {
  return adapterFactory(moment);
}

@NgModule({
  declarations: [DayViewSchedulerComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule,
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
  ],
  exports: [DayViewSchedulerComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
    {
      provide: MOMENT,
      useValue: moment,
    },
  ],
})
export class DayViewSchedulerModule { }
