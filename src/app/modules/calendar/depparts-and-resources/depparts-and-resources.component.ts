import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Injectable,
  Input,
  LOCALE_ID,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
// import {
//   addDaysWithExclusions
// } from 'angular-calendar/modules/common/util/util'
import {
  CalendarUtils,
  CalendarWeekViewComponent,
  DateAdapter,
  getWeekViewPeriod,
} from 'angular-calendar';
import {
  WeekView,
  GetWeekViewArgs,
  WeekViewTimeEvent,
  EventColor,
  CalendarEvent,
  // WeekViewAllDayEventRow,
  // WeekViewAllDayEvent,
  WeekViewHourColumn
} from 'calendar-utils';
import { DragEndEvent, DragMoveEvent } from 'angular-draggable-droppable';
import { Day } from '../../../ui/pages/documents/calendar/calendar.component';




interface WeekViewAllDayEvent {
  event: CalendarEvent;
  offset: number;
  span: number;
  startsBeforeWeek: boolean;
  endsAfterWeek: boolean;
}
interface WeekViewAllDayEventRow {
  id?: string;
  row: WeekViewAllDayEvent[];
}



const MINUTES_IN_HOUR = 60;

@Component({
  selector: 'mwl-depparts-and-resources',
  templateUrl: 'depparts-and-resources.component.html',
  providers: [],
})
export class DeppartsAndResourcesComponent implements OnChanges
{
  // @Input() users: User[] = [];
  // @Input() breaks: Break[] = [];

  // @Output() userChanged = new EventEmitter();
  // @Output() refreshView = new EventEmitter();

  view: WeekView; //extends WeekView with users: User[];

  daysInWeek = 1;


  @Input() days: Day[] = [];
  @Input()  allDayEventRows: WeekViewAllDayEventRow[] = [];

  constructor(
    protected cdr: ChangeDetectorRef,
    @Inject(LOCALE_ID) locale: string,
    protected dateAdapter: DateAdapter,
    protected element: ElementRef<HTMLElement>
  ) {
    
  }

  // trackByUserId = (index: number, row: User) => row.id;
  // trackByWeekTimeBreak(i: any) { return i; }

  ngOnChanges(changes: SimpleChanges): void {
    
    if (changes.users) {
      // this.refreshBody();
      // this.emitBeforeViewRender();
    }
  }

  trackByDay(index, day:Day) {
    return day.dayOfMonth + day.monthName;
  }


  trackByRow(index, row:WeekViewAllDayEventRow){
    return index;
  }

  


  getPixelAmountInMinutes(
    hourSegments: number,
    hourSegmentHeight: number,
    hourDuration?: number
  ) {
    return (hourDuration || MINUTES_IN_HOUR) / (hourSegments * hourSegmentHeight);
  }

 
}