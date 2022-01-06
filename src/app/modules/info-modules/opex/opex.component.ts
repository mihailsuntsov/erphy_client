import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { LoadSpravService } from 'src/app/services/loadsprav';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { HttpClient } from '@angular/common/http';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE}  from '@angular/material/core';
import { MomentDateAdapter} from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import { default as _rollupMoment} from 'moment';
const moment = _rollupMoment || _moment;
moment.defaultFormat = "DD.MM.YYYY";
moment.fn.toJSON = function() { return this.format('DD.MM.YYYY'); }
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
interface IdAndName {
  id: number;
  name:string;
}
interface UnitsSet{
  id: string;
  name: string;
}

interface Series {
  name:string;
  value:number;
}
interface VolumesReportJSON {
  name:string;
  series: Series [];
}

@Component({
  selector: 'app-opex',
  templateUrl: './opex.component.html',
  styleUrls: ['./opex.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}, LoadSpravService,
  ]
})
export class OpexComponent implements OnInit {

  queryForm:any;//форма для отправки запроса 
  showSettingsForm = false;
  
  //переменные для построения графиков
  multi: any[]=[];// для приёма данных для построения графиков прихода и расхода
  volumesCurve:VolumesReportJSON = {name: '', series: []};// объект, в котором будут содержаться данные для построения кривой баланса
  multi2: VolumesReportJSON[]=[];// массив объектов (в котором будет только 1 элемент volumesCurve), для "скармливания" модулю графика
  view: any[] = [700, 400]; // размеры области графика
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = true;
  showLegend: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Месяцы';
  showYAxisLabel: boolean = true;
  showRightYAxisLabel: boolean = true;  
  yAxisLabelRight: string = 'Остаток';
  yAxisLabel: string = '';
  legendTitle: string = 'Категории';
  calculatedSum : number = 0; // суммированный объем по всем барам
  colorScheme = {domain: ['#5AA454', '#C7B42C', '#AAAAAA']};
  lineChartScheme = {
    name: 'coolthree',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b', '#7aa3e5', '#a8385d', '#00bfa5']
  };
  legendPosition = 'right';
  
  // lineChartSeries: any[] = lineChartSeries;
  // barChart: any[] = barChart;



  //переменные прав
  allowToViewAllCompanies:boolean = false;  //Возможность построения отчётов по всем предприятиям
  allowToViewMyCompany:boolean = false;     //Возможность построения отчётов по своему предприятию

  @Input() companyId: number;                       // id предприятия, для которого запрашиваем данные
  @Input() myCompanyId: number;                     // id своего предприятия, для которого запрашиваем данные
  @Input() permissionsSet: any[];                   // сет прав на документ

  constructor(
    private loadSpravService:   LoadSpravService,
    private http: HttpClient,
    private MessageDialog: MatDialog,) {}

  ngOnInit(): void {

    this.queryForm = new FormGroup({ //форма для отправки запроса 
      companyId: new FormControl(this.companyId,[]), // предприятие, по которому идет запрос данных
      dateFrom: new FormControl(moment().startOf('year')),   // дата С
      dateTo: new FormControl(moment().endOf('year')),     // дата По
    });
  }
 
  onStart(){
    this.getCRUD_rights(this.permissionsSet);
    this.getVolumesReportData();
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies =  permissionsSet.some(          function(e){return(e==609)});
    this.allowToViewMyCompany =     permissionsSet.some(          function(e){return(e==610)});
  }

  // возвращает название из объекта типа IdAndName
  displayFn(object: IdAndName): string {
    return object && object.name ? object.name : '';
  }
  
  // при изменении даты в одном из полей ("С даты" или "По дату")
  onDateChange(type: string, event: any) {
    // если отрицательная разница между датами
    if(this.getDuration()<0)
      this.setRange();//возвращаем даты как было
  }
  percentageFormatting(c) {
    return Math.round(c);
    // return c;
  }
  // возвращает длительность периода в днях
  getDuration():number{
    var duration = moment.duration(this.queryForm.get('dateTo').value.diff(this.queryForm.get('dateFrom').value));
    return duration.asDays();
  }

  // устанавливает даты в полях "С даты" и "По дату" в зависимости от выбранного периода
  setRange(){
        this.queryForm.get('dateFrom').setValue(moment().startOf('year'));
        this.queryForm.get('dateTo').setValue(moment().endOf('year'));
  }

  getVolumesReportData(){
    this.multi=[];
    this.beforeRequestReportData();
    this.http.post('/api/auth/getOpexOnly', this.queryForm.getRawValue())
    .subscribe(
        (data) => {
          this.multi=data as any []; 
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }
  //подготовка к запросу данных отчёта
  beforeRequestReportData(){
    this.queryForm.get('companyId').setValue(this.companyId);//в том случае, если в головном модуле изменяем предприятие для всех виджетов - нужно его изменить и в форме для отправки запроса
  }

  onChangeCompany(newCompanyId:number){
    if(newCompanyId!=this.companyId){
      this.companyId=newCompanyId;
    }
  }

  moneyFormat(m) {
    return parseFloat(m).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1 ").replace('.', ',');
  }   

  onClickMenuIcon(){
    this.showSettingsForm = !this.showSettingsForm;
  }

  onSelect(data): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }


}
