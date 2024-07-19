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
  CalendarEventTimesChangedEventType,
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
  WeekViewAllDayEventRow,
  WeekViewAllDayEvent,
  WeekViewHourColumn
} from 'calendar-utils';
import { DragEndEvent, DragMoveEvent } from 'angular-draggable-droppable';
import {StatusInterface} from 'src/app/ui/pages/documents/calendar/calendar.component'
export interface User {
  id: number;
  name: string;
  color: EventColor;
}
export interface Break {
  user :    User;
  start:    string;
  end:      string;
}
interface DayViewScheduler extends WeekView {
  users: User[];
  hourColumns_: WeekViewHourColumn_[];
  period: ViewPeriod;
  allDayEventRows: WeekViewAllDayEventRow[];
  hourColumns: WeekViewHourColumn[];
}
export interface ViewPeriod {
  start: Date;
  end: Date;
  events: CalendarEvent[];
}
interface GetWeekViewArgsWithUsers extends GetWeekViewArgs {
  users: User[];
  breaks:any[];


  // dayStartHour: number;
  // dayEndHour: number;
  // dayStartMinute: number;
  // dayEndMinute: number;
  hourDuration: number;
  hourSegments: number;
}
interface WeekViewHourColumn_ extends WeekViewHourColumn{
  // breaks:any[];
}
export interface WeekViewHour {
  segments: WeekViewHourSegment[];
}
export interface WeekViewHourSegment {
  isStart: boolean;
  date: Date;
  displayDate: Date;
  cssClass?: string;
}
const MINUTES_IN_HOUR = 60;

@Injectable()
export class DayViewSchedulerCalendarUtils extends CalendarUtils {



            


          //   GetWeekViewArgs {
          //     events?: CalendarEvent[];
          //     viewDate: Date;
          //     weekStartsOn: number;
          //     excluded?: number[];
          //     precision?: 'minutes' | 'days';
          //     absolutePositionedEvents?: boolean;
          //     hourSegments?: number;
          //     hourDuration?: number;
          //     dayStart: Time;
          //     dayEnd: Time;
          //     weekendDays?: number[];
          //     segmentHeight: number;
          //     viewStart?: Date;
          //     viewEnd?: Date;
          //     minimumEventHeight?: number; }
        

              //GetWeekViewArgs+User+Break     WeekView+User+Break
  getWeekView_(args: GetWeekViewArgsWithUsers): DayViewScheduler {
    // console.log("injectable args",args);

    //   WeekView {
    //    period: ViewPeriod;
    //    allDayEventRows: WeekViewAllDayEventRow[];
    //    hourColumns: WeekViewHourColumn[];}

    //   ViewPeriod {
    //    start: Date;
    //    end: Date;
    //    events: CalendarEvent[];}

    // console.log('calling super...');
    const { period } = super.getWeekView(args);
    // { period } is the object of WeekView that contains only period, without other objects like allDayEventRows, hourColumns 
    // period is this day with no events (object of ViewPeriod)


    //  console.log("{ period }",{ period });
    // console.log("period",period);
    // console.log("hourDuration",args.hourDuration);

                //  WeekView + users
    const weekView_: DayViewScheduler = {
      period,
      allDayEventRows: [],
      hourColumns: [],
      users: [...args.users],
      hourColumns_: []
    };





    // console.log('view',view);
    weekView_.users.forEach((user, columnIndex) => {
      // console.log('events before"',args.events)

      const events = args.events.filter(function(event) 
        {return event.meta.user.id === user.id}
      );
      // console.log("breaks before - ",args.breaks);
      const breaks = args.breaks.filter(function(break_) 
      {return break_.user.id === user.id}
      );
      // console.log("breaks after - ",breaks);

      let breaks_events: CalendarEvent[] = [];
      breaks.map(break_=>{
        breaks_events.push({
          'start': new Date(break_.start),
          'end': new Date(break_.end),
          'title': ''
        })
      })
      
      let breaksView: WeekView = super.getWeekView({
        ...args,
        events: breaks_events,
      });
      // console.log("breaksView - ",breaksView);

      // columnView is the object of WeekView that contains hourColumns, period is this day period with no events (object of ViewPeriod)

      // console.log('calling super (columnView) ...');
      let columnView: WeekView = super.getWeekView({
        ...args,
        events,
      });
      // console.log("columnView - ",columnView);

      // columnView = { ...columnView,
      //   breaks:breaks
      // }
      

      // columnView.hourColumns[0] = { ...columnView.hourColumns[0],
      //   breaks:breaks
      // }
            // WeekViewHourColumn
      weekView_.hourColumns.push (columnView.hourColumns[0]);

      
      weekView_.hourColumns_.push({
        date:   breaksView.hourColumns[0].date,
        events: breaksView.hourColumns[0].events,
        hours:  breaksView.hourColumns[0].hours
      });

      // console.log("weekView_ - ",weekView_);
      columnView.allDayEventRows.forEach(({ row }, rowIndex) => {
        weekView_.allDayEventRows[rowIndex] = weekView_.allDayEventRows[rowIndex] || {
          row: [],
        };
        weekView_.allDayEventRows[rowIndex].row.push({
          ...row[0],
          offset: columnIndex,
          span: 1,
        });
      });




    });
    // console.log('main view',this.view)
    
    return weekView_;
  }

}

@Component({
  selector: 'mwl-day-view-scheduler',
  templateUrl: 'day-view-scheduler.component.html',
  styleUrls: ['./day-view-scheduler.component.css'],
  providers: [DayViewSchedulerCalendarUtils],
})
export class DayViewSchedulerComponent
  extends CalendarWeekViewComponent
  implements OnChanges
{
  @Input()  users: User[] = [];
  @Input()  breaks: Break[] = [];
  @Input()  statusesList: StatusInterface[] = [];
  // @Output() userChanged = new EventEmitter();
  @Output() onEventDragged = new EventEmitter();
  @Output() onEventResized = new EventEmitter();
  @Output() refreshView = new EventEmitter();
  @Output() userOfCurrentColumn = new EventEmitter();
  @Output() statusClickedToChange = new EventEmitter();
  view: DayViewScheduler; //extends WeekView with users: User[];

  daysInWeek = 1;
  oldStatusType = 1;

  constructor(
    protected cdr: ChangeDetectorRef,
    protected utils: DayViewSchedulerCalendarUtils,
    @Inject(LOCALE_ID) locale: string,
    protected dateAdapter: DateAdapter,
    protected element: ElementRef<HTMLElement>
  ) {
    super(cdr, utils, locale, dateAdapter, element);
  }

  trackByUserId = (index: number, row: User) => row.id;
  trackByWeekTimeBreak(i: any) { return i; }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);

    if (changes.users) {
      this.refreshBody();
      this.emitBeforeViewRender();
    }
  }

  timeEventResizeStarted(eventsContainer, timeEvent, resizeEvent) {
    this.timeEventResizes.set(timeEvent.event, resizeEvent);
    this.resizeStarted(eventsContainer, timeEvent);
  }

  timeEventResizing(timeEvent, resizeEvent) {
    this.timeEventResizes.set(timeEvent.event, resizeEvent);
    const adjustedEvents = new Map();
    const tempEvents = [...this.events];
    this.timeEventResizes.forEach((lastResizeEvent, event) => {
        const newEventDates = this.getTimeEventResizedDates(event, lastResizeEvent);
        const adjustedEvent = { ...event, ...newEventDates };
        adjustedEvents.set(adjustedEvent, event);
        const eventIndex = tempEvents.indexOf(event);
        tempEvents[eventIndex] = adjustedEvent;
    });
    this.restoreOriginalEvents(tempEvents, adjustedEvents, true);
  }

  timeEventResizeEnded(timeEvent) {
    this.view = this.getWeekView(this.events);
    const lastResizeEvent = this.timeEventResizes.get(timeEvent.event);
    if (lastResizeEvent) {
      this.timeEventResizes.delete(timeEvent.event);
      const newEventDates = this.getTimeEventResizedDates(timeEvent.event, lastResizeEvent);
      this.onEventResized.emit({
          newStart: newEventDates.start,
          newEnd: newEventDates.end,
          event: timeEvent.event,
          type: CalendarEventTimesChangedEventType.Resize,
      });
    }
  }

  getDayColumnWidth(eventRowContainer: HTMLElement): number {
    return Math.floor(eventRowContainer.offsetWidth / this.users.length);
  }
  
  getPixelAmountInMinutes(
    hourSegments: number,
    hourSegmentHeight: number,
    hourDuration?: number
  ) {
    return (hourDuration || MINUTES_IN_HOUR) / (hourSegments * hourSegmentHeight);
  }

  emitUserOfDraggingToCreateEvent(i:number){
    console.log('columnIndex',i);
    console.log('user',JSON.stringify(this.users[i]))
    this.userOfCurrentColumn.emit({user: this.users[i]});
  }

  emitChangeStatus(docId:number, statusId:number, statusType:number){
    this.statusClickedToChange.emit({docId:docId, statusId:statusId, statusType:statusType})
  }

  dragMove(dayEvent: WeekViewTimeEvent, dragEvent: DragMoveEvent) {
    if (this.snapDraggedEvents) {
      const newUser = this.getDraggedUserColumn(dayEvent, dragEvent.x);
      
      // console.log('newUser',newUser)

      const newEventTimes = this.getDragMovedEventTimes(
        dayEvent,
        { ...dragEvent, x: 0 },
        this.dayColumnWidth,
        true
      );
      const originalEvent = dayEvent.event;
      const adjustedEvent = {
        ...originalEvent,
        ...newEventTimes,
        meta: { ...originalEvent.meta, user: newUser },
      };
      const tempEvents = this.events.map((event) => {
        if (event.id === originalEvent.id) {
          return adjustedEvent;
        }
        return event;
      });
      this.restoreOriginalEvents(
        tempEvents,
        new Map([[adjustedEvent, originalEvent]])
      );
    }
    this.dragAlreadyMoved = true;
  }

  dragEnded(
    weekEvent: WeekViewAllDayEvent | WeekViewTimeEvent,
    dragEndEvent: DragEndEvent,
    dayWidth: number,
    useY = false
  ) {
    super.dragEnded(
      weekEvent,
      {
        ...dragEndEvent,
        x: 0,
      },
      dayWidth,
      useY
    );
    const newUser = this.getDraggedUserColumn(weekEvent, dragEndEvent.x);
    // if (newUser && newUser !== weekEvent.event.meta.user) {
    //   this.userChanged.emit({ event: weekEvent.event, newUser });
    // }

    this.onEventDragged.emit({newUser:newUser, event:weekEvent.event});
  }
 
  protected getWeekView(events: CalendarEvent[]):DayViewScheduler {
    // console.log ('Inside super')
    
    return this.utils.getWeekView_({
      events, //CalendarEvent[]
      users: this.users,
      breaks: this.breaks,
      viewDate: this.viewDate,
      weekStartsOn: this.weekStartsOn,
      excluded: this.excludeDays,
      precision: this.precision,
      absolutePositionedEvents: true,
      hourDuration: this.hourDuration,
      hourSegments: this.hourSegments,
      dayStart: {
        hour: this.dayStartHour,
        minute: this.dayStartMinute,
      },
      dayEnd: {
        hour: this.dayEndHour,
        minute: this.dayEndMinute,
      },
      segmentHeight: this.hourSegmentHeight,
      weekendDays: this.weekendDays,
      ...getWeekViewPeriod(
        this.dateAdapter,
        this.viewDate,
        this.weekStartsOn,
        this.excludeDays,
        this.daysInWeek
      ),
    });
  }

  private getDraggedUserColumn(
    dayEvent: WeekViewTimeEvent | WeekViewAllDayEvent,
    xPixels: number
  ) {
    const columnsMoved = Math.round(xPixels / this.dayColumnWidth);
    const currentColumnIndex = this.view.users.findIndex(
      (user) => user.id === dayEvent.event.meta.user.id
    );
    // console.log('xPixels',xPixels)
    // console.log('columnsMoved',columnsMoved)
    // console.log('currentColumnIndex',currentColumnIndex)
    const newIndex = currentColumnIndex + columnsMoved;
    return this.view.users[newIndex];
  }
}