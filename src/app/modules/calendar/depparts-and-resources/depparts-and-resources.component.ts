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
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
// import {
//   addDaysWithExclusions
// } from 'angular-calendar/modules/common/util/util'
import {
  CalendarEventTimesChangedEvent,
  CalendarEventTimesChangedEventType,
  CalendarUtils,
  CalendarWeekViewComponent,
  DAYS_OF_WEEK,
  DateAdapter,
  getWeekViewPeriod,
} from 'angular-calendar';
import {
  WeekView,
  GetWeekViewArgs,
  WeekViewTimeEvent,
  EventColor,
  CalendarEvent,
  WeekDay,
  ViewPeriod,
  // WeekViewAllDayEventRow,
  // WeekViewAllDayEvent,
  WeekViewHourColumn
} from 'calendar-utils';
import { DragEndEvent, DragMoveEvent, DropEvent, ValidateDrag } from 'angular-draggable-droppable';
import { Day } from '../../../ui/pages/documents/calendar/calendar.component';
import { DayViewSchedulerCalendarUtils } from '../day-view-scheduler/day-view-scheduler.component';
import { CalendarResizeHelper } from './calendar-resize-helper';
import { CalendarDragHelper } from './calendar-drag-helper';
import { ResizeEvent } from '../../../../../node_modules/angular-resizable-element';
import { WeekViewAllDayEventResize } from 'angular-calendar/modules/week/calendar-week-view/calendar-week-view.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { translate, TranslocoService } from '@ngneat/transloco';
import { CalendarView } from '../../../ui/pages/documents/calendar/calendar.component';
import {StatusInterface} from 'src/app/ui/pages/documents/calendar/calendar.component'
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import moment from 'moment';
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

const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_DAY = 60 * 60 * 24;
var DEFAULT_WEEKEND_DAYS = [
    DAYS_OF_WEEK.SUNDAY,
    DAYS_OF_WEEK.SATURDAY,
];


@Injectable()
export class ResourcesCalendarUtils extends CalendarUtils {





}







@Component({
  selector: 'mwl-depparts-and-resources',
  templateUrl: 'depparts-and-resources.component.html',
  styleUrls: ['./depparts-and-resources.component.css'],
  providers: [DayViewSchedulerCalendarUtils],
})
export class DeppartsAndResourcesComponent 
extends CalendarWeekViewComponent implements OnChanges, OnInit
{
  // @Input() users: User[] = [];
  // @Input() breaks: Break[] = [];

  // @Output() userChanged = new EventEmitter();
  @Output() refreshView = new EventEmitter();
  @Output() changeDateByHeaderDayClick = new EventEmitter<Date>();
  @Output() statusClickedToChange = new EventEmitter();  
  @Output() objectOfCurrentResource = new EventEmitter();
  @Output() onEventResized = new EventEmitter();
  view: WeekView;
  allDayEventRows: WeekViewAllDayEventRow[]=[];
  oldStatusType = 1;
  __spreadArray:any;
  __assign:any;
  @Input()  events: CalendarEvent[];
  // @Input()  days: Day[] = [];
  @Input()  weekDays: Day[] = [];
  // @Input()  allDayEventRows: WeekViewAllDayEventRow[] = [];
  @Input()  departmentsWithParts: any[] = [];
  @Input()  selectedDepparts: any[] = [];  
  @Input()  statusesList: StatusInterface[] = [];
  @Input()  startOfPeriod;
  @Input()  endOfPeriod;
  @Input()  viewDate;
  @Input()  viewPeriodName: CalendarView;
  @Input()  timeFormat: string;
  @ViewChild('segmentElement') segmentElement: HTMLElement;
  
  eventRowsFilledAtStart = false;
  rollbackEvent:CalendarEvent;
  lastDragEnterDate_: Date;
  resourceServicesList:any = [];
  resourceServicesListLoading:boolean = true;
  //                                         "21_59", rows with all events in this department part (21) used this resource (59)
  allDayEventRowsByDeppartsAndResourcesId:Map<string,WeekViewAllDayEventRow[]> = new Map();

  imageToShow:any; // переменная в которую будет подгружаться картинка товара (если он jpg или png)


  constructor(
    protected cdr: ChangeDetectorRef,
    protected utils: DayViewSchedulerCalendarUtils,
    @Inject(LOCALE_ID) locale: string,
    public MessageDialog: MatDialog,
    protected dateAdapter: DateAdapter,
    protected element: ElementRef<HTMLElement>,
    public ShowImageDialog: MatDialog,
    private service: TranslocoService,  
    private http: HttpClient,) {
    super(cdr, utils, locale, dateAdapter, element);
  }

  // trackByUserId = (index: number, row: User) => row.id;
  // trackByWeekTimeBreak(i: any) { return i; }
  ngOnInit() {
    // this.createEventsRows();
      this.getResourceEventsRows();
    // this.snapDraggedEvents=true;
    
  }
  ngOnChanges(changes: SimpleChanges): void {
    
    if (changes.weekDays || changes.startOfPeriod || changes.events ) {
      this.daysInWeek = this.weekDays.length;
      this.getDays();
      this.getResourceEventsRows();
    }
  }

  getDays(){
    this.days = this.getWeekViewHeader(this.dateAdapter,
      {
        viewDate: this.viewDate,
        weekStartsOn: 0, 
        excluded: [],
        weekendDays: [],
        viewStart: this.startOfPeriod,
        viewEnd: this.endOfPeriod,
    });
  }

  setPeriod(){
    this.view.period={
      start: new Date(this.startOfPeriod),
      end: new Date(this.endOfPeriod),
      events: this.events
    }
  }



  trackByDay(index, day:Day) {
    return day.dayOfMonth + day.monthName;
  }


  trackByRow(index, row:WeekViewAllDayEventRow){
    return index;
  }
  trackByDepartment(index){
    return index;
  }
  trackByDepPart(index, deppart:any) {
    // console.log('something - ',something)
    return deppart.id;
  }
  trackByResource(deppart_id, index, resource:any) {return deppart_id.toString()+'_'+resource.resource_id ;
    return resource.id;
  }
  trackByResourceDay(resourceId, index, day:Day) {
    // console.log('something - ',resourceId.toString()+day.dayOfMonth+day.monthName)
    return resourceId.toString()+day.dayOfMonth+day.monthName ;
  }
  trackByRowId(index, row:WeekViewAllDayEventRow) {
    return row.id;
  }
  trackByWeekAllDayEvent = (
    index: number,
    weekEvent: WeekViewAllDayEvent
  ) => (weekEvent.event.id ? weekEvent.event.id : weekEvent.event);
  trackByService(index){
    return index;
  }


  getPixelAmountInMinutes(
    hourSegments: number,
    hourSegmentHeight: number,
    hourDuration?: number
  ) {
    return (hourDuration || MINUTES_IN_HOUR) / (hourSegments * hourSegmentHeight);
  }


  emitObjectOfDraggingToCreateEvent(resource:any, deppart:any, segmentWidth:number, date:Date, segmentElement: HTMLElement){
    // console.log('deppartId',deppart.id);
    // console.log('segmentWidth',segmentWidth);
    // console.log('user',JSON.stringify(this.users[i]))
    if(deppart.is_active)
      this.objectOfCurrentResource.emit({resource:resource, deppartId:deppart.id, segmentWidth:segmentWidth, date:date, segmentElement:segmentElement });
  }


  // Формируем строки событий для каждого ресурса
  // Forming rows of events for each resource
  getResourceEventsRows(){
    this.allDayEventRowsByDeppartsAndResourcesId = new Map();

    // Каждое событие имеет список ресурсов, которые используются в услугах этого события
    // Эта функция помогает узнать, есть ли ресурс с идентификатором в списке ресурсов события
    // Each event has a list of resources that used in services of this event
    // This function helps to know whether resource with ID is in the list of resources of event
    function isEventResourcesHasResource(resources:any[],resourceId:number){
      let result=false;
      resources.map(resource=>{
        if(resource.id === resourceId) result=true; 
      });
      return result;
    }




    // Создание общего списка ID всех ресурсов и ID всех частей отделений
    // Creating a general list of IDs of all resources and IDs of all parts of departments

    let resourcesIds: number[]=[];
    let deppartsIds:  number[]=[];

    this.departmentsWithParts.map(department =>{
      department.parts.map(deppart =>{
        if(deppartsIds.indexOf(deppart.id) === -1)
          deppartsIds.push(deppart.id);
        deppart.resources.map(resource=>{
          if(resourcesIds.indexOf(resource.resource_id) === -1)
            resourcesIds.push(resource.resource_id);
        })
      })
    });

    if(resourcesIds.length>0 && deppartsIds.length>0/* && this.events.length>0*/){
      // Проходим по всем сочетаниям части отделений и ресурсов, и составляем массив событий для каждого такого сочетания
      // Going through all combinations of some departments and resources, and compose an array of events for each such combination
      deppartsIds.map(depId=>{
        resourcesIds.map(resId=>{
          // Создаем локальный список событий, оставляя из общего списка только те события, что относятся к текущей части отделения и используют текущий ресурс
          // Create a local list of events, leaving from the general list only those events that relate to the current part of the department and use current a resource
          let events: CalendarEvent[] = this.events.filter(
            function (event) {
            return (isEventResourcesHasResource(event.meta.itemResources, resId)&&event.meta.departmentPartId==depId)
          })
          // Формируем строки событий
          // Forming rows of events
          let rows: WeekViewAllDayEventRow[] = this.getEventsRows(this.dateAdapter,
            {
              events: events,
              excluded: [],
              precision: 'minutes',
              absolutePositionedEvents: true,
              viewStart: this.startOfPeriod,
              viewEnd: this.endOfPeriod,
          });
          // console.log('filteredRows by resource id = '+resId,rows)
          // if(rows.length<=3 || onLoad){
          // console.log('eventRowsFilledAtStart', this.eventRowsFilledAtStart)            
          // if(!this.eventRowsFilledAtStart){            
            // Создаем список (map) из сочетания ресурса и части отделения, где для каждого такого сочетания создаем массив событий
            // Create a list (map) from a combination of resource and department part, where for each such combination we create an array of events
            // <'23_34'> - <[event1, event2, ...]>
            // <'25_34'> - <[event2, event5, ...]>
            // if(rows.length<=1 || !this.eventRowsFilledAtStart){
              if(rows.length>0){
                this.allDayEventRowsByDeppartsAndResourcesId.set(depId+'_'+resId,rows);
              } 
              else { this.allDayEventRowsByDeppartsAndResourcesId.set(depId+'_'+resId,
                [{id:null,row:[{
                  event: {start:new Date(), title:'', meta: {statusName:'',statusColor:'black',statusType:1}},
                  offset: 0,
                  span: 0,
                  startsBeforeWeek: false,
                  endsAfterWeek: false,
                }]}]              
              );}
            // } else {
            //    console.log('Not enought resources! rows:',rows);
            //    // restoring the time of moved or resized event
            //    console.log('Changing event with id = '+this.rollbackEvent.id + ' with start: ' + this.rollbackEvent.start + ', end: ' + this.rollbackEvent.end)
            //    let objIndex = this.events.findIndex(obj => obj.id == this.rollbackEvent.id);
            //    console.log('objIndex = ',objIndex)
            //    this.events[objIndex].start=this.rollbackEvent.start;
            //    this.events[objIndex].end=this.rollbackEvent.end;
            //    console.log('event after change',this.events[objIndex])
            // }
          // }
        });
      });
      // console.log("MAP",this.allDayEventRowsByDeppartsAndResourcesId)
      if(this.allDayEventRowsByDeppartsAndResourcesId.size>0)
        this.eventRowsFilledAtStart=true;
        

      // console.log('allDayEventRowsByDeppartsAndResourcesId',this.allDayEventRowsByDeppartsAndResourcesId)
    }


    

  }
  
  

  isNotEnoughtResources(depPartId:number, resourceId:number, resourceQtt):boolean{ 

    let result = false;   
    // Каждое событие имеет список ресурсов, которые используются в услугах этого события
    // Эта функция помогает узнать, есть ли ресурс с идентификатором в списке ресурсов события
    // Each event has a list of resources that used in services of this event
    // This function helps to know whether resource with ID is in the list of resources of event
    function isEventResourcesHasResource(resources:any[],resourceId:number){
      let result=false;
      resources.map(resource=>{
        if(resource.id === resourceId) result=true; 
      });
      return result;
    }
    if(this.events.length>0){
        // Создаем локальный список событий, оставляя из общего списка только те события, что относятся к запрашиваемым части отделения и ресурсу
        // Create a local list of events, leaving from the general list only those events that relate to the queried part of the department and resource
      let events: CalendarEvent[] = this.events.filter(
        function (event) {
          return (isEventResourcesHasResource(event.meta.itemResources, resourceId)&&event.meta.departmentPartId==depPartId)
        }
      )
    
      events.map(mainCycleEvent=>{
        if(!result){ // если в одном из циклов уже было получено положительное значение (т.е. ресурса не хватает) - все остальные нужно пропусить
          let intersectedWithEachOtherEventsGroup: CalendarEvent[]=[];
          intersectedWithEachOtherEventsGroup.push(mainCycleEvent);

          events.map(compareCycleEvent=>{
            if(mainCycleEvent.id != compareCycleEvent.id){ // сравниваем с каждым другим, но не с самим собой

              let countOfIntersectionsWithGroupEvents = 0;
              intersectedWithEachOtherEventsGroup.map(eventOfIntersectiondGroup=>{
                if(compareCycleEvent.start < eventOfIntersectiondGroup.end && compareCycleEvent.end > eventOfIntersectiondGroup.start)
                  countOfIntersectionsWithGroupEvents++;
              })
              if(countOfIntersectionsWithGroupEvents==intersectedWithEachOtherEventsGroup.length)
                intersectedWithEachOtherEventsGroup.push(compareCycleEvent);
            }
          });

          // Сейчас у получившейся группы событий, у events которой есть общее одновременное пересечение, нужно получить сумму по запрашиваемому ресурсу
          let sumOfQueriedResource = 0;
          intersectedWithEachOtherEventsGroup.map(eventOfIntersectiondGroup=>{
            eventOfIntersectiondGroup.meta.itemResources.map(resource=>{
                                              // не берем во внимание ресурсы из отменённых документов // do not take into account resources from the cancelled documents
              if(resource.id == resourceId && eventOfIntersectiondGroup.meta.statusType !=3) sumOfQueriedResource = sumOfQueriedResource + resource.usedQuantity;
            })
          })
          // и если единовременное использование ресурса больше чем его количество, имеющееся в части отделения, то значит ресурса не хватает
          result = resourceQtt < sumOfQueriedResource;
        }
      })   
    }
    return result;
  }


  // isNotEnoughtResources(mapKey,resourceQtt):boolean{
  //   let result=false;
  //   if(this.allDayEventRowsByDeppartsAndResourcesId != undefined && this.allDayEventRowsByDeppartsAndResourcesId.get(mapKey) != undefined){
  //     let requiredResourcesQtt = this.allDayEventRowsByDeppartsAndResourcesId.get(mapKey).length;
  //     result = resourceQtt < requiredResourcesQtt;
  //   }
  //   return result;
  // }



// 
  getEventsRows(dateAdapter:DateAdapter, _a) {

    if(_a.events.length==0) return([]);

    var _b = _a.events, 
    events = _b === void 0 ? [] : _b, 
    _c = _a.excluded, 
    excluded = _c === void 0 ? [] : _c, 
    _d = _a.precision, 
    precision = _d === void 0 ? 'minutes' : _d, 
    _e = _a.absolutePositionedEvents, 
    absolutePositionedEvents = _e === void 0 ? false : _e,
    viewStart = _a.viewStart, 
    viewEnd = _a.viewEnd;

    viewStart = dateAdapter.startOfDay(viewStart);
    viewEnd = dateAdapter.endOfDay(viewEnd);

    // console.log('Events на входе в getEventsRows',events);


    var differenceInSeconds = dateAdapter.differenceInSeconds, differenceInDays = dateAdapter.differenceInDays;

    var maxRange = this.getDifferenceInDaysWithExclusions(dateAdapter, {
        date1: viewStart,
        date2: viewEnd,
        excluded: excluded,
    });

    // console.log('maxRange',maxRange); // 30

    var totalDaysInView = differenceInDays(viewEnd, viewStart) + 1;


    var eventsMapped = events
        // .filter(function (event) { return event.allDay; })


       
        .map(event=> {
        var offset = this.getWeekViewEventOffset(dateAdapter, {
            event: event,
            startOfWeek: viewStart,
            excluded: excluded,
            precision: precision,
        });
        var span = this.getWeekViewEventSpan(dateAdapter, {
            event: event,
            offset: offset,
            startOfWeekDate: viewStart,
            excluded: excluded,
            precision: precision,
            totalDaysInView: totalDaysInView,
        });
        return { event: event, offset: offset, span: span };
    })
    // console.log('eventsMapped',eventsMapped);
    // return []
    
    // пропускает все event, для которых выполняется условие
        .filter(function (e) { 
          // console.log('e.offset', e.offset);
          // console.log('maxRange',maxRange);
          // console.log('e.offset < maxRange:',e.offset < maxRange);
          return e.offset < maxRange; })
          
        // console.log('eventsMapped after filter',eventsMapped);


        .filter(function (e) { 
          
          // console.log('e.span', e.span);
          return e.span > 0; 


        })
        // console.log('eventsMapped after filter',eventsMapped);
        .map(function (entry) { return ({
        event: entry.event,
        offset: entry.offset,
        span: entry.span,
        startsBeforeWeek: entry.event.start < viewStart,
        endsAfterWeek: (entry.event.end || entry.event.start) > viewEnd,
    }); })
    //console.log('eventsMapped',eventsMapped);
    //return []


    
    // console.log('eventsMapped after filter',eventsMapped);
        .sort(function (itemA, itemB) {
        var startSecondsDiff = differenceInSeconds(itemA.event.start, itemB.event.start);
        if (startSecondsDiff === 0) {
            return differenceInSeconds(itemB.event.end || itemB.event.start, itemA.event.end || itemA.event.start);
        }
        return startSecondsDiff;
    });
    var allDayEventRows = [];
    var allocatedEvents = [];

    var __assign = (this && this.__assign) || function () {
      __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
    };

    var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
              if (!ar) ar = Array.prototype.slice.call(from, 0, i);
              ar[i] = from[i];
          }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };

    // console.log('eventsMapped',eventsMapped);
    // return []
   

    eventsMapped.forEach(function (event, index) {
        if (allocatedEvents.indexOf(event) === -1) {
            allocatedEvents.push(event);
            var rowSpan_1 = event.span + event.offset;
            var otherRowEvents = eventsMapped
                .slice(index + 1)
                .filter(function (nextEvent) {
                if (nextEvent.offset >= rowSpan_1 &&
                    rowSpan_1 + nextEvent.span <= totalDaysInView &&
                    allocatedEvents.indexOf(nextEvent) === -1) {
                    var nextEventOffset = nextEvent.offset - rowSpan_1;
                    if (!absolutePositionedEvents) {
                        nextEvent.offset = nextEventOffset;
                    }
                    rowSpan_1 += nextEvent.span + nextEventOffset;
                    allocatedEvents.push(nextEvent);
                    return true;
                }
            });
            var weekEvents = __spreadArray([event], otherRowEvents, true);
            var id = weekEvents
                .filter(function (weekEvent) { return weekEvent.event.id; })
                .map(function (weekEvent) { return weekEvent.event.id; })
                .join('-');
            allDayEventRows.push(__assign({ row: weekEvents }, (id ? { id: id } : {})));
        }
    });


    // console.log('allDayEventRows',allDayEventRows);
    // this.allDayEventRows = allDayEventRows;

    return allDayEventRows;



  }
  
  getDifferenceInDaysWithExclusions(dateAdapter, _a) {
    var date1 = _a.date1, date2 = _a.date2, excluded = _a.excluded;
    var date = date1;
    var diff = 0;
    while (date < date2) {
        if (excluded.indexOf(dateAdapter.getDay(date)) === -1) {
            diff++;
        }
        date = dateAdapter.addDays(date, 1);
    }
    return diff;
  }

  getWeekViewEventOffset(dateAdapter, _a) {
    var event = _a.event, startOfWeekDate = _a.startOfWeek, excluded = _a.excluded, precision = _a.precision;
    var differenceInDays = dateAdapter.differenceInDays, startOfDay = dateAdapter.startOfDay, differenceInSeconds = dateAdapter.differenceInSeconds;
    if (event.start < startOfWeekDate) {
        return 0;
    }
    var offset = 0;
    switch (precision) {
        case 'days':
            offset =
                differenceInDays(startOfDay(event.start), startOfWeekDate) *
                    SECONDS_IN_DAY;
            break;
        case 'minutes':
            offset = differenceInSeconds(event.start, startOfWeekDate);
            break;
    }
    // offset -= this.getExcludedSeconds(dateAdapter, {
    //     startDate: startOfWeekDate,
    //     seconds: offset,
    //     excluded: excluded,
    //     precision: precision,
    // });
    return Math.abs(offset / SECONDS_IN_DAY);
  }
  
  getExcludedSeconds(dateAdapter, _a) {
    var startDate = _a.startDate, seconds = _a.seconds, excluded = _a.excluded, precision = _a.precision;
    if (excluded.length < 1) {
        return 0;
    }
    var addSeconds = dateAdapter.addSeconds, getDay = dateAdapter.getDay, addDays = dateAdapter.addDays;
    var endDate = addSeconds(startDate, seconds - 1);
    var dayStart = getDay(startDate);
    var dayEnd = getDay(endDate);
    var result = 0; // Calculated in seconds
    var current = startDate;
    var _loop_1 = function () {
        var day = getDay(current);
        if (excluded.some(function (excludedDay) { return excludedDay === day; })) {
            result += this.calculateExcludedSeconds(dateAdapter, {
                dayStart: dayStart,
                dayEnd: dayEnd,
                day: day,
                precision: precision,
                startDate: startDate,
                endDate: endDate,
            });
        }
        current = addDays(current, 1);
    };
    while (current < endDate) {
        _loop_1();
    }
    return result;
  }

  calculateExcludedSeconds(dateAdapter, _a) {
    var precision = _a.precision, day = _a.day, dayStart = _a.dayStart, dayEnd = _a.dayEnd, startDate = _a.startDate, endDate = _a.endDate;
    var differenceInSeconds = dateAdapter.differenceInSeconds, endOfDay = dateAdapter.endOfDay, startOfDay = dateAdapter.startOfDay;
    if (precision === 'minutes') {
        if (day === dayStart) {
            return differenceInSeconds(endOfDay(startDate), startDate) + 1;
        }
        else if (day === dayEnd) {
            return differenceInSeconds(endDate, startOfDay(endDate)) + 1;
        }
    }
    return SECONDS_IN_DAY;
  }

  getWeekViewEventSpan(dateAdapter, _a) {
    var event = _a.event, offset = _a.offset, startOfWeekDate = _a.startOfWeekDate, excluded = _a.excluded, precision = _a.precision, totalDaysInView = _a.totalDaysInView;
    var max = dateAdapter.max, differenceInSeconds = dateAdapter.differenceInSeconds, addDays = dateAdapter.addDays, endOfDay = dateAdapter.endOfDay, differenceInDays = dateAdapter.differenceInDays;
    var span = SECONDS_IN_DAY;
    var begin = max([event.start, startOfWeekDate]);
    if (event.end) {
        switch (precision) {
            case 'minutes':
                span = differenceInSeconds(event.end, begin);
                break;
            default:
                span =
                    differenceInDays(addDays(endOfDay(event.end), 1), begin) *
                        SECONDS_IN_DAY;
                break;
        }
    }
    var offsetSeconds = offset * SECONDS_IN_DAY;
    var totalLength = offsetSeconds + span;
    // the best way to detect if an event is outside the week-view
    // is to check if the total span beginning (from startOfWeekDay or event start) exceeds the total days in the view
    var secondsInView = totalDaysInView * SECONDS_IN_DAY;
    if (totalLength > secondsInView) {
        span = secondsInView - offsetSeconds;
    }
    span -= this.getExcludedSeconds(dateAdapter, {
        startDate: begin,
        seconds: span,
        excluded: excluded,
        precision: precision,
    });
    return span / SECONDS_IN_DAY;
  }

  getWeekDay(dateAdapter, _a) {
    var date = _a.date, _b = _a.weekendDays, weekendDays = _b === void 0 ? DEFAULT_WEEKEND_DAYS : _b;
    var startOfDay = dateAdapter.startOfDay, isSameDay = dateAdapter.isSameDay, getDay = dateAdapter.getDay;
    var today = startOfDay(new Date());
    var day = getDay(date);
    return {
        date: date,
        day: day,
        isPast: date < today,
        isToday: isSameDay(date, today),
        isFuture: date > today,
        isWeekend: weekendDays.indexOf(day) > -1,
    };
  }

  getWeekViewHeader(dateAdapter, _a) {
    var viewDate = _a.viewDate, weekStartsOn = _a.weekStartsOn, _b = _a.excluded, excluded = _b === void 0 ? [] : _b, weekendDays = _a.weekendDays, _c = _a.viewStart, viewStart = _c === void 0 ? dateAdapter.startOfWeek(viewDate, { weekStartsOn: weekStartsOn }) : _c, _d = _a.viewEnd, viewEnd = _d === void 0 ? dateAdapter.addDays(viewStart, DAYS_IN_WEEK) : _d;
    var addDays = dateAdapter.addDays, getDay = dateAdapter.getDay;
    var days = [];
    var date = viewStart;


    while (date < viewEnd) {
        if (!excluded.some(function (e) { return getDay(date) === e; })) {
            days.push(this.getWeekDay(dateAdapter, { date: date, weekendDays: weekendDays }));
        }
        date = addDays(date, 1);
    }



    
    // console.log('days',days);
    return days;
  }


  dragStarted(
    eventsContainerElement: HTMLElement,
    eventElement: HTMLElement,
    event: WeekViewTimeEvent | WeekViewAllDayEvent,
    useY: boolean
  ): void {
    this.rollbackEvent={...event.event};
    this.dayColumnWidth = this.getDayColumnWidth(eventsContainerElement);
    const dragHelper: CalendarDragHelper = new CalendarDragHelper(
      eventsContainerElement,
      eventElement
    );
    
    this.validateDrag = ({ x, y, transform }) => {
      const isAllowed =
        this.allDayEventResizes.size === 0 &&
        this.timeEventResizes.size === 0 &&
        dragHelper.validateDrag({
          x,
          y,
          snapDraggedEvents: this.snapDraggedEvents,
          dragAlreadyMoved: this.dragAlreadyMoved,
          transform,
        });
      if (isAllowed && this.validateEventTimesChanged) {
        const newEventTimes = this.getDragMovedEventTimes(
          event,
          { x, y },
          this.dayColumnWidth,
          useY
        );
        return this.validateEventTimesChanged({
          type: CalendarEventTimesChangedEventType.Drag,
          event: event.event,
          newStart: newEventTimes.start,
          newEnd: newEventTimes.end,
        });
      }

      return isAllowed;
    };
    this.dragActive = true;
    this.dragAlreadyMoved = false;
    this.lastDraggedEvent = null;
    this.eventDragEnterByType = {
      allDay: 0,
      time: 0,
    };
    // if (!this.snapDraggedEvents && useY) {
    //   this.view.hourColumns.forEach((column) => {
    //     const linkedEvent = column.events.find(
    //       (columnEvent) =>
    //         columnEvent.event === event.event && columnEvent !== event
    //     );
    //     // hide any linked events while dragging
    //     if (linkedEvent) {
    //       linkedEvent.width = 0;
    //       linkedEvent.height = 0;
    //     }
    //   });
    // }
    this.cdr.markForCheck();
  }

  dragMove(dayEvent: WeekViewTimeEvent, dragEvent: DragMoveEvent) {
    const newEventTimes = this.getDragMovedEventTimes(
      dayEvent,
      dragEvent,
      this.dayColumnWidth,
      true
    );
    const originalEvent = dayEvent.event;
    const adjustedEvent = { ...originalEvent, ...newEventTimes };
    const tempEvents = this.events.map((event) => {
      if (event === originalEvent) {
        return adjustedEvent;
      }
      return event;
    });
    this.restoreOriginalEvents(
      tempEvents,
      new Map([[adjustedEvent, originalEvent]]),
      this.snapDraggedEvents
    );
    this.dragAlreadyMoved = true;
  }

  dragEnded(
    weekEvent: WeekViewAllDayEvent | WeekViewTimeEvent,
    dragEndEvent: DragEndEvent,
    dayWidth: number,
    useY = false
  ): void {
    this.view = this.getWeekView(this.events);
    this.dragActive = false;
    this.validateDrag = null;
    const { start, end } = this.getDragMovedEventTimes(
      weekEvent,
      dragEndEvent,
      dayWidth,
      useY
    );

    this.setPeriod();
    // console.log('eventDragEnterByType: ',this.eventDragEnterByType['allDay'])
    // console.log('eventDragEnterByType > 0: ',this.eventDragEnterByType['allDay'] > 0)
    // console.log('isDraggedWithinPeriod: ',this.isDraggedWithinPeriod(start, end, this.view.period))


    if (
      this.isDraggedWithinPeriod(start, end, this.view.period)
    ) {
      // console.log('Event успешно перемещён!')
      this.lastDraggedEvent = weekEvent.event;
      this.eventTimesChanged.emit({
        newStart: start,
        newEnd: end,
        event: weekEvent.event,
        type: CalendarEventTimesChangedEventType.Drag,
        allDay: true,
      });
    }
  }

  isDraggedWithinPeriod(
    newStart: Date,
    newEnd: Date,
    period: ViewPeriod
  ): boolean {
    // console.log('period: ',period)
    const end = newEnd || newStart;
    return (
      (period.start <= newStart && newStart <= period.end) ||
      (period.start <= end && end <= period.end)
    );
  }

  allDayEventResizes: Map<WeekViewAllDayEvent, WeekViewAllDayEventResize> =
    new Map();


  allDayEventResizeStarted(
    allDayEventsContainer: HTMLElement,
    allDayEvent: WeekViewAllDayEvent,
    resizeEvent: ResizeEvent
  ): void {
    // this.rollbackEvent = {...allDayEvent.event};
    this.allDayEventResizes.set(allDayEvent, {
      originalOffset: allDayEvent.offset,
      originalSpan: allDayEvent.span,
      edge: typeof resizeEvent.edges.left !== 'undefined' ? 'left' : 'right',
    });
    this.resizeStarted(
      allDayEventsContainer,
      allDayEvent,
      this.getDayColumnWidth(allDayEventsContainer)
    );
  }

  protected resizeStarted(
    eventsContainer: HTMLElement,
    event: WeekViewTimeEvent | WeekViewAllDayEvent,
    dayWidth?: number
  ) {
    // console.log('resizeStarted')
    this.dayColumnWidth = this.getDayColumnWidth(eventsContainer);
    const resizeHelper = new CalendarResizeHelper(
      eventsContainer,
      dayWidth,
      this.rtl
    );
    this.validateResize = ({ rectangle, edges }) => {
      const isWithinBoundary = resizeHelper.validateResize({
        rectangle: { ...rectangle },
        edges,
      });

      if (isWithinBoundary && this.validateEventTimesChanged) {
        let newEventDates;
        if (!dayWidth) {
          newEventDates = this.getTimeEventResizedDates(event.event, {
            rectangle,
            edges,
          });
        } else {
          const modifier = this.rtl ? -1 : 1;
          if (typeof edges.left !== 'undefined') {
            const diff = Math.round(+edges.left / dayWidth) * modifier;
            newEventDates = this.getAllDayEventResizedDates(
              event.event,
              diff,
              !this.rtl
            );
          } else {
            const diff = Math.round(+edges.right / dayWidth) * modifier;
            newEventDates = this.getAllDayEventResizedDates(
              event.event,
              diff,
              this.rtl
            );
          }
        }
        return this.validateEventTimesChanged({
          type: CalendarEventTimesChangedEventType.Resize,
          event: event.event,
          newStart: newEventDates.start,
          newEnd: newEventDates.end,
        });
      }

      return isWithinBoundary;
    };
    this.cdr.markForCheck();
  }


  allDayEventResizing(
    allDayEvent: WeekViewAllDayEvent,
    resizeEvent: ResizeEvent,
    dayWidth: number
  ): void {
    // console.log('allDayEvent',allDayEvent);
    // console.log('allDayEventResizes',this.allDayEventResizes);
    const currentResize: WeekViewAllDayEventResize =
      this.allDayEventResizes.get(allDayEvent);
      // console.log('currentResize',currentResize);

    const modifier = this.rtl ? -1 : 1;
    // console.log('typeof resizeEvent.edges.right', +resizeEvent.edges.right)
    if (typeof resizeEvent.edges.left !== 'undefined') {
      // console.log('Left side resizing')


      const diff: number =
        Math.round(+resizeEvent.edges.left / dayWidth) * modifier;
      if(currentResize.originalSpan - diff >0){// если span отрицательный - item может вывернуть в другую сторону
        allDayEvent.offset = currentResize.originalOffset + diff;
        allDayEvent.span = currentResize.originalSpan - diff;
      }

      // console.log('allDayEvent.offset - ',allDayEvent.offset)
      // console.log('allDayEvent.span - ',allDayEvent.span) 


      // console.log('diff - ',diff)
      // console.log('allDayEvent.offset - ',allDayEvent.offset)
    } 
    else 
    if (typeof resizeEvent.edges.right !== 'undefined') {
      // console.log('Right side resizing')


      const diff: number =
        Math.round(+resizeEvent.edges.right / dayWidth) * modifier;
        // console.log('diff - ',diff)

      if(currentResize.originalSpan + diff >0){
        allDayEvent.span = currentResize.originalSpan + diff;
      }



      // console.log('allDayEvent.span = ',allDayEvent.span)

    }

  }
  
  allDayEventResizeEnded(allDayEvent: WeekViewAllDayEvent): void {
    const currentResize: WeekViewAllDayEventResize =
      this.allDayEventResizes.get(allDayEvent);
      // console.log('currentResize = ',currentResize)

    if (currentResize) {
      const allDayEventResizingBeforeStart = currentResize.edge === 'left'; // always "False"
      // console.log('allDayEventResizingBeforeStart = ',allDayEventResizingBeforeStart)

      let daysDiff: number;
      if (allDayEventResizingBeforeStart) {
        daysDiff = Math.round(allDayEvent.offset - currentResize.originalOffset);
        console.log('daysDiff 1 = ',daysDiff);
      } else {

        daysDiff = Math.round(allDayEvent.span - currentResize.originalSpan);
        console.log('daysDiff 2 = ',daysDiff);
        // console.log('then here...')
        // console.log('allDayEvent.span - currentResize.originalSpan = ',allDayEvent.span - currentResize.originalSpan);
        // console.log('allDayEvent.span = ',allDayEvent.span);

      }

      // allDayEvent.offset = currentResize.originalOffset;
      // allDayEvent.span = currentResize.originalSpan;
      // console.log('daysDiff = ',daysDiff)
      // console.log('originalOffset = ',currentResize.originalOffset)
      // console.log('originalSpan = ',currentResize.originalSpan)

      // иначе без этой проверки событие может исчезать
      let testEvent={...allDayEvent.event};
      let testNewDates = this.getAllDayEventResizedDates(
        testEvent,
        daysDiff,
        allDayEventResizingBeforeStart
      );

      if(testNewDates.start >= testNewDates.end){
        daysDiff=daysDiff+(currentResize.edge === 'left'?-1:1);
      }

        const newDates = this.getAllDayEventResizedDates(
          allDayEvent.event,
          daysDiff,
          allDayEventResizingBeforeStart
        );
        console.log('newDates = ',newDates)
      
        this.eventTimesChanged.emit({
          newStart: newDates.start,
          newEnd: newDates.end,
          event: allDayEvent.event,
          type: CalendarEventTimesChangedEventType.Resize,
        });
        this.allDayEventResizes.delete(allDayEvent);
      
        
      // console.log('allDayEvent.event = ',allDayEvent.event)
    }
  }
  dateDragEnter(date: Date) {
    this.lastDragEnterDate_ = date;
    // console.log('lastDragEnterDate',this.lastDragEnterDate_)
  }

  eventDropped_(
    dropEvent: Pick<
      DropEvent<{ event?: CalendarEvent; calendarId?: symbol }>,
      'dropData'
    >,
    date: Date,
    allDay: boolean,
    deppart_id
  ): void {
    // console.log('event before drop',dropEvent.dropData.event)
    // console.log('deppart_id',deppart_id)
    if (this.eventCanBeMovedBetweenDepartmentParts(dropEvent.dropData.event,deppart_id)) {
      dropEvent.dropData.event.meta.departmentPartId=deppart_id;
    } else {
      dropEvent.dropData.event.start=this.rollbackEvent.start;
      dropEvent.dropData.event.end=this.rollbackEvent.end;      
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('docs.msg.no_resources_in_deppart')}})
    }
    this.getResourceEventsRows();
    this.lastDraggedEvent = null;
  }

  // Если хотя бы один ресурс отсутствует в новой части отделения - перемещать заказ в новую часть отделения нельзя
  // If at least one resource is not existed id a new part of department, you cannot move the reservation to a new part of the department
  eventCanBeMovedBetweenDepartmentParts(event:CalendarEvent, newDepPartId: number):boolean{
    let result=true;
    //console.log('event before drop',event);
    //console.log('deppart_id',newDepPartId);
    let newDepPartResourcesIds:number[] = [];
    this.departmentsWithParts.map(department =>{
      department.parts.map(deppart =>{
        if(deppart.id==newDepPartId)
          deppart.resources.map(resource=>{
            if(newDepPartResourcesIds.indexOf(resource.resource_id) === -1)
              newDepPartResourcesIds.push(resource.resource_id);
          })
      })
    });
    if(newDepPartResourcesIds.length==0) 
      result=false;
    // console.log('newDepPartResourcesIds',newDepPartResourcesIds)
    // console.log('event.meta.itemResources',event.meta.itemResources)
    event.meta.itemResources.map(resource=>{
      if(newDepPartResourcesIds.indexOf(resource.id) === -1) result=false; 
    });
    return result;
  }
  getFormattedDate(today:Date)
  {
    const yyyy = today.getFullYear();
    let m = today.getMonth() + 1; // Because months start at 0!
    let d = today.getDate();
    let dd:string='';
    let mm:string='';
    dd = (d<10?'0':'') + d.toString();
    mm = (m<10?'0':'') + m.toString();
    return dd + '/' + mm + '/' + yyyy;
  }
  isDayToday(day:Day):boolean{
    // console.log('day-',this.getFormattedDate(day.date));
    // console.log('viewDate',this.getFormattedDate(this.viewDate));
    // if(this.getFormattedDate(day.date)==this.getFormattedDate(this.viewDate))
      // console.log('green date is for',this.getFormattedDate(day.date)) 
    return (this.getFormattedDate(day.date)==this.getFormattedDate(this.viewDate))
  }
  isDayOfHourToday(){
    return (this.getFormattedDate(new Date())==this.getFormattedDate(this.viewDate))
  }
  isHourNow(hourInHead:string){
    return (new Date().getHours().toString().padStart(2, '0')) == hourInHead;
  }
  onClickHeaderDay(date:Date){
    this.changeDateByHeaderDayClick.emit(date);
    this.refreshView.emit();
  }
  
  emitChangeStatus(docId:number, statusId:number, statusType:number){
    this.statusClickedToChange.emit({docId:docId, statusId:statusId, statusType:statusType})
  }
  getHeaderTime(index, only24:boolean){
    let result='';
    let date=this.weekDays[index].date;
    if(this.timeFormat=='24' || only24){
      result=date.toTimeString().substring(0, 2);
    } else {
      var hours = date.getHours();
      // var minutes = date.getMinutes();
      // var minutesString = '';
      // var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      // minutesString = minutes < 10 ? '0'+minutes.toString() : minutes.toString();
      // result = hours + ':' + minutesString + ' ' + ampm;
      result = hours.toString();
    }
    return result;
  }
  getAmPm(index){
    let date=this.weekDays[index].date;
    var hours = date.getHours();
    return hours >= 12 ? 'PM' : 'AM';;
  }

  isDepartmentsHasSelectedDepPartsWithResources(departmentId:number):boolean{
    let result:boolean=false;
    this.departmentsWithParts.map(department=>{
      if(department.department_id==departmentId){
        department.parts.map(part=>{
          if(part.resources.length>0 && this.selectedDepparts.includes(part.id)) result=true;
        })
      }
    })
    return result;
  }
  getAmountOfEventUsedResource(eventId:number, resourceId:number){
    let result=0;
    this.events.map(event=>{
      if(event.id as number == eventId && event.meta.itemResources.length>0){
        event.meta.itemResources.map(resource=>{
          if(resource.id == resourceId)
            result=resource.usedQuantity;
        })
      }
    })
    return result;
  }

  // shouldFireDroppedEvent(
  //   dropEvent: { dropData?: { event?: CalendarEvent; calendarId?: symbol } },
  //   date: Date,
  //   allDay: boolean,
  //   calendarId: symbol
  // ) {
  //   return (
  //     dropEvent.dropData &&
  //     dropEvent.dropData.event &&
  //     (dropEvent.dropData.calendarId !== calendarId ||
  //       (dropEvent.dropData.event.allDay && !allDay) ||
  //       (!dropEvent.dropData.event.allDay && allDay))
  //   );
  // }

  getResourceServicesList(resourceId:number,deppartId:number){
    this.resourceServicesListLoading = true;
    this.resourceServicesList = [];
    this.http.get('/api/auth/getResourceServicesList?resource_id='+resourceId+'&deppart_id='+deppartId).subscribe(
        (data) => {
          this.resourceServicesList = data as any;
          this.resourceServicesListLoading = false;
          this.refreshView.emit();
        },
        error => {this.resourceServicesListLoading = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }
  showImage(name:string){
      const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
        data:
        { 
          link: name,
        },
      });}
      
  getTimeWIthFormat(date:Date){return moment(date).format(this.timeFormat=='12'?'hh A':'HH')}
  getDate(date:Date){return moment(date).format('DD')}
  
  // isAllSumEqual(meta:any){
  //   console.log('Meta',[meta.sumAll, meta.sumShipped, meta.sumPayed])
  //   const allEqual = arr => arr.every(val => val === arr[0]);
  //   return allEqual([/*meta.sumAll,*/ meta.sumShipped, meta.sumPayed]);
  // }
  getAdditionalState(meta:any){
    let paid_state = '';
    let shipped_state = '';
    let completed_state = '';
    if(meta.sumPayed>=meta.sumAll) paid_state = 'paid'
    else if (meta.sumPayed>0 && meta.sumPayed<meta.sumAll) paid_state = 'paid_part'
    else  paid_state = 'no_paid';
    if(meta.sumShipped>=meta.sumAll) shipped_state = 'shipped'
    else if (meta.sumShipped>0 && meta.sumShipped<meta.sumAll) shipped_state = 'shipped_part'
    else  shipped_state = 'no_shipped';
    if(meta.completed) completed_state='completed'; else  completed_state='';
    return '\n'+translate('menu.tip.'+shipped_state)+'\n'+translate('menu.tip.'+paid_state)+(completed_state!=''?('\n'+translate('menu.tip.'+completed_state)):'');
  }

  showPaidSubicon(meta:any):boolean{
    return !meta.completed && (meta.sumPayed>=meta.sumAll || (meta.sumPayed>0 && meta.sumPayed<meta.sumAll))
  }
  showShippedSubicon(meta:any):boolean{
    return !meta.completed && (meta.sumShipped>=meta.sumAll || (meta.sumShipped>0 && meta.sumShipped<meta.sumAll))
  }
  getPayedClass(meta:any):string{
    let result = '';
    if(meta.sumPayed>=meta.sumAll) result = 'paid';
    if (meta.sumPayed>0 && meta.sumPayed<meta.sumAll) result = 'paid_part';
    // console.log('CLASS Shipped', result)
    return result;
  }
  getShippedClass(meta:any):string{
    let result = '';
    if(meta.sumShipped>=meta.sumAll) result = 'shipped'
    else if (meta.sumShipped>0 && meta.sumShipped<meta.sumAll) result = 'shipped_part'
    // console.log('CLASS Payed', result)
    return result;
  }

  
}