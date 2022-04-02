import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { LoadSpravService } from 'src/app/services/loadsprav';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { HttpClient } from '@angular/common/http';
import { translate } from '@ngneat/transloco'; //+++

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
  selector: 'app-income-outcome',
  templateUrl: './income-outcome.component.html',
  styleUrls: ['./income-outcome.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}, LoadSpravService,
  ]
})
export class IncomeOutcomeComponent implements OnInit {

  queryForm:any;//форма для отправки запроса 
  units:UnitsSet[] = [{id:'hour', name:'Чac'}, {id:'day', name:'День'}, {id:'week', name:'Неделя'}, {id:'month', name:'Месяц'}, {id:'year', name:'Год'}];
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
  allowToViewAllCompanies:boolean = false;  //Возможность построения отчётов по объёмам продаж, закупок и др. по всем предприятиям
  allowToViewMyCompany:boolean = false;     //Возможность построения отчётов по объёмам продаж, закупок и др. по всем отделениям своего предпрития
  allowToViewMyDepartments:boolean = false; //Возможность построения отчётов по объёмам продаж, закупок и др. по своим отделениям своего предпрития

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
      periodType: new FormControl('year',[]), // отрезок времени для анализа (день, месяц, год, или выбранный период) 
      unit: new FormControl('month'),       // какая единица одного бара на графике (час, неделя, месяц, день, год)
      dateFrom: new FormControl(moment().startOf('year')),   // дата С
      dateTo: new FormControl(moment().endOf('year')),     // дата По
    });
  }

  onStart(){
    this.units.push();
    this.getCRUD_rights(this.permissionsSet);
    this.getVolumesReportData();
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies =  permissionsSet.some(          function(e){return(e==325)});
    this.allowToViewMyCompany =     permissionsSet.some(          function(e){return(e==326)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==327)});
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
    this.calcUnitsSetForCustomPeriod();
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

  // Формирует набор единиц временных интервалов (часы, дни и т.д.), в зависимости от длины периода, выбранного через поля "С даты" и "По дату" 
  // Зачем это надо? Не все единицы временных интервалов могут быть актуальны при разных временных периодах. Например, если длина периода будет 3 дня, 
  // смысла в отрезках "Неделя" и длиннее нет, также как и смыслав в часовых отрезках при периодах отчета более месяца
  calcUnitsSetForCustomPeriod(){
      this.units = [{id:'month',name:'Месяц'},{id:'year',name:'Год'}];
      this.queryForm.get('unit').setValue('month');
  }

  getVolumesReportData(){
    this.multi=[];
    this.multi2=[];
    this.beforeRequestReportData();
    this.http.post('/api/auth/getIncomeOutcomeReportData', this.queryForm.getRawValue())
    .subscribe(
        (data) => {
          this.multi=data as any []; 
          // this.getBalancesOnDate();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  getBalancesOnDate(){
    let beginBalance:number=0;
    this.http.post('/api/auth/getBalancesOnDate', this.queryForm.getRawValue())
    .subscribe(
        (data) => {
          beginBalance=data as number;
          this.formingBalancesCurve(beginBalance);
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  // сборка объекта для построения графика кривой остатка
  formingBalancesCurve(currentBalance:number){
    // let volumesCurve:VolumesReportJSON = {name: '', series: []};
    let count:number=0;
    this.volumesCurve.name='Остаток'
    let sery:Series = {name: '', value: 0};
    this.multi.map(i => {
      // в каждом объекте в multi есть series, состоящая из [{name: "Приход", value: 11111},{name: "Расход", value: 22222}]
      // нужно по ним пробежаться, и к текущему значению остатка currentBalance прибавить Приход и вычесть Расход
      // и этот остаток записать в массив series вида [{"name": "01.2022","value": 5032},...] находящийся в volumesCurve
      
      // задаём дату
      sery.name=i.name;
      // если это первый объект multi - задаём начальное значение (то которое было на начало периода)
      if(count==0) sery.value = currentBalance;

      i.series.map(s =>{
        sery.value=(s.name=='Приход'?(sery.value+s.value):(sery.value-s.value));
      })
      this.volumesCurve.series.push(sery);

      count++;
    });
    // alert(this.volumesCurve.series.length);
     this.multi2.push(this.volumesCurve);

[
  {
    "name": "Остаток",
    "series": [
      {
        "name": "12.2021",
        "value": 58823
      },
      {
        "name": "12.2021",
        "value": 58823
      }
    ]
  }
]
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

  setXAxisName(){
    this.units.map(i=>{
      if(this.queryForm.get('unit').value==i.id)
        this.xAxisLabel=i.name;
    })
  }

  // calculateSum(){
  //   this.calculatedSum=0;
  //   if(this.multi){
  //     this.multi.map(i=>{
  //         i.series.map(s=>{
  //           this.calculatedSum += s.value;
  //         })
  //     })
  //   }
  // }

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

// export let lineChartSeries = [
//   {
//     "name": "Остаток",
//     "series": [
//       {
//         "name": "11.2021",
//         "value": 50000
//       },  
//       {
//         "name": "12.2021",
//         "value": 58823
//       }
//     ]
//   },






// ];
// export let lineChartSeries = [
//   {
//     name: 'Tablets',
//     series: [
//           {
//       name: 'USA',
//       value: 50
//     },
//       {
//         value: 80,
//         name: 'United Kingdom'
//       },
//       {
//         value: 85,
//         name: 'France'
//       },
//       {
//         value: 90,
//         name: 'Japan'
//       },
//       {
//         value: 100,
//         name: 'China'
//       }
//     ]
//   },
//     {
//     name: 'Cell Phones',
//     series: [
//           {
//       value: 10,
//       name: 'USA'
//     },
//       {
//         value: 20,
//         name: 'United Kingdom'
//       },
//       {
//         value: 30,
//         name: 'France'
//       },
//       {
//         value: 40,
//         name: 'Japan'
//       },
//       {
//         value: 10,
//         name: 'China'
//       }
//     ]
//   },
//     {
//     name: 'Computers',
//     series: [
//           {
//       value: 2,
//       name: 'USA',

//     },
//       {
//         value: 4,
//         name: 'United Kingdom'
//       },
//       {
//         value: 20,
//         name: 'France'
//       },
//       {
//         value: 30,
//         name: 'Japan'
//       },
//       {
//         value: 35,
//         name: 'China'
//       }
//     ]
//   }
// ];

// export let barChart: any = [
//   {
//     name: 'USA',
//     "series":[{"name":"Приход","value":3519.00},{"name":"Расход","value":1300.00}]
//   },
//   {
//     name: 'United Kingdom',
//     "series":[{"name":"Приход","value":4000.00},{"name":"Расход","value":5000.00}]
//   },
//   {
//     name: 'France',
//     "series":[{"name":"Приход","value":3000.00},{"name":"Расход","value":3771.00}]
//   },
//   {
//     name: 'Japan',
//     "series":[{"name":"Приход","value":2000.00},{"name":"Расход","value":2000.00}]
//   },
//   {
//     name: 'China',
//     "series":[{"name":"Приход","value":1000.00},{"name":"Расход","value":6000.00}]
//   }
// ];