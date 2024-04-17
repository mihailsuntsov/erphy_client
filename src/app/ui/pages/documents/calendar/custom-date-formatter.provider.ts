import { CalendarDateFormatter, DateAdapter, DateFormatterParams, DAYS_OF_WEEK } from 'angular-calendar';
import { DatePipe, formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
    providedIn: 'root'
  })
export class CustomDateFormatter extends CalendarDateFormatter {

    data: string  = '';
    subscription: Subscription;
  // you can override any of the methods defined in the parent class
    public datepipe: DatePipe;
    locale:string;
    timeFormat:string;
    // protected dateAdapter: DateAdapter;
    constructor(
        private dataService: DataService, 
        dateAdapter: DateAdapter) {
        super(dateAdapter);
        this.subscription = this.dataService.data$.subscribe(data => {
          this.timeFormat = data;
        });
      }

    ngOnDestroy() {
    this.subscription.unsubscribe();
    }
// ***********************************  TITLES  **************************************

    // title in a month view
    public monthViewTitle({ date, locale }: DateFormatterParams): string {
        console.log('date',date);
        console.log('locale',locale);
        // console.log('locale',locale);
        // console.log('converted locale',this.getLocaleAngular(locale));
        return formatDate(date, 'LLLL y', this.getLocaleAngular(locale));
    }
    // title in a week view
    public weekViewTitle({ date, locale}: DateFormatterParams): string {
        
        console.log('date',date);
        console.log('locale',locale);
        // const year: string = new DatePipe(locale).transform(date, 'y', locale);
        const startdateofweek= new DatePipe(locale).transform(this.startOfWeek(date),this.weekTitleFormat, locale);
        const enddateofweek= new DatePipe(locale).transform(this.endOfWeek(date),this.weekTitleFormat+', y', locale);
        return `${startdateofweek} — ${enddateofweek}`;
    }
    // title in a day view
    public dayViewTitle({ date, locale }: DateFormatterParams): string {
        console.log('date',date);
        console.log('locale',locale);
        // console.log('locale',locale);
        // console.log('converted locale',this.getLocaleAngular(locale));
        return formatDate(date, this.dayTitleFormat, this.getLocaleAngular(locale)); // ru
    }
    public schedulerViewTitle({ date, locale }: DateFormatterParams): string {
        console.log('date',date);
        console.log('locale',locale);
        // console.log('locale',locale);
        // console.log('converted locale',this.getLocaleAngular(locale));
        return formatDate(date, this.dayTitleFormat, this.getLocaleAngular(locale)); // ru
    }
// *********************************  HOUR FORMAT  ************************************

    public dayViewHour({ date, locale }: DateFormatterParams): string {
        return formatDate(date, this.timeFormat, this.getLocaleAngular(locale));
    }
    
    public weekViewHour({ date, locale }: DateFormatterParams): string {
        return formatDate(date, this.timeFormat, this.getLocaleAngular(locale));
    }

// *********************************  COLUMN HEADERS  **********************************
    // day of week name in month view
    public monthViewColumnHeader({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'EEE', this.getLocaleAngular(locale));
    }

    // day of week name in week view
    public weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'EEE', this.getLocaleAngular(locale));
    }

// *********************************  Common utilites  **********************************
    startOfWeek(date) {  
        console.log("date.getDate()", date.getDate());
        console.log("date.getDay()",  date.getDay());
        console.log("this.locale",this.locale)
        console.log("this.weekStartsOn", this.weekStartsOn);
        var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
        return new Date(date.setDate(diff-(this.weekStartsOn==0?1:0)));  
    }  
    endOfWeek(date) {  
        var lastday = date.getDate() - (date.getDay() - 1) + 6;  
        return new Date(date.setDate(lastday-(this.weekStartsOn==0?1:0)));  
    }
    getLocaleAngular(locale){
        let convertedLocale = ({
        'ru':       'ru',
        'sr-cyrl':  'sr-Cyrl',
        'me':       'sr-Latn-ME',
        'en-au':    'en-AU',
        'en-ca':    'en-CA',
        'en-us':    'en',
        'en-gb':    'en-GB',
        'en-ie':    'en-IE',
        'en-il':    'en-IL',
        'en-in':    'en-IN',
        'en-nz':    'en-NZ',
        'en-sg':    'en-SG',
        'bs':       'bs-Latn',
        'hr':       'hr'
        })[locale];
        if(convertedLocale) this.locale=convertedLocale; else this.locale=locale;
        return convertedLocale?convertedLocale:locale;
    }   
    get weekStartsOn(){
        return ({
        'ru':           DAYS_OF_WEEK.MONDAY,
        'sr-Cyrl':      DAYS_OF_WEEK.MONDAY,
        'sr-Latn-ME':   DAYS_OF_WEEK.MONDAY,
        'en-AU':        DAYS_OF_WEEK.SUNDAY,
        'en-CA':        DAYS_OF_WEEK.SUNDAY,
        'en-US':        DAYS_OF_WEEK.SUNDAY,
        'en':           DAYS_OF_WEEK.SUNDAY,
        'en-GB':        DAYS_OF_WEEK.MONDAY,
        'en-IE':        DAYS_OF_WEEK.SUNDAY,
        'en-IL':        DAYS_OF_WEEK.MONDAY,
        'en-IN':        DAYS_OF_WEEK.SUNDAY,
        'en-NZ':        DAYS_OF_WEEK.MONDAY,
        'en-SG':        DAYS_OF_WEEK.MONDAY,
        'bs-Latn':      DAYS_OF_WEEK.MONDAY,
        'hr':           DAYS_OF_WEEK.MONDAY
        })[this.locale]
    }
    get dayTitleFormat(){
        return ({
        'ru':           'cccc, d MMMM y',
        'sr-Cyrl':      'cccc, d. MMMM y',
        'sr-Latn-ME':   'cccc, d. MMMM y',
        'en-AU':        'cccc, LLL d, y',
        'en-CA':        'cccc, LLL d, y',
        'en-US':        'cccc, LLL d, y',
        'en':           'cccc, LLL d, y',
        'en-GB':        'cccc, LLL d, y',
        'en-IE':        'cccc, LLL d, y',
        'en-IL':        'cccc, LLL d, y',
        'en-IN':        'cccc, LLL d, y',
        'en-NZ':        'cccc, LLL d, y',
        'en-SG':        'cccc, LLL d, y',
        'bs-Latn':      'cccc, d MMMM y',
        'hr':           'cccc, d MMMM y'
        })[this.locale]
    }
    get weekTitleFormat(){
        return ({
        'ru':           'd MMMM',
        'sr-Cyrl':      'd. MMMM',
        'sr-Latn-ME':   'd. MMMM',
        'en-AU':        'LLL d',
        'en-CA':        'LLL d',
        'en-US':        'LLL d',
        'en':           'LLL d',
        'en-GB':        'LLL d',
        'en-IE':        'LLL d',
        'en-IL':        'LLL d',
        'en-IN':        'LLL d',
        'en-NZ':        'LLL d',
        'en-SG':        'LLL d',
        'bs-Latn':      'd MMMM',
        'hr':           'd MMMM'
        })[this.locale]
    }
    // get timeFormat(){
    //     return ({
    //     'ru':         'HH:mm',
    //     'sr-Cyrl':    'HH:mm',
    //     'sr-Latn-ME': 'HH:mm',
    //     'en-AU':      'h:mm a',
    //     'en-CA':      'h:mm a',
    //     'en-US':      'h:mm a',
    //     'en':         'h:mm a',
    //     'en-GB':      'h:mm a',
    //     'en-IE':      'h:mm a',
    //     'en-IL':      'h:mm a',
    //     'en-IN':      'h:mm a',
    //     'en-NZ':      'h:mm a',
    //     'en-SG':      'h:mm a',
    //     'bs-Latn':    'HH:mm',
    //     'hr':         'HH:mm'  
    //     })[this.locale]
    // }

}
