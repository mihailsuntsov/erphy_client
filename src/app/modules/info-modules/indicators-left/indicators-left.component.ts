import { Component, Input, OnInit } from '@angular/core';
import { LoadSpravService } from 'src/app/services/loadsprav';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
interface IdAndName {
  id: number;
  name:string;
}
@Component({
  selector: 'app-indicators-left',
  templateUrl: './indicators-left.component.html',
  styleUrls: ['./indicators-left.component.css'],
  providers: [LoadSpravService,
  ]
})
export class IndicatorsLeftComponent implements OnInit {

  //переменные для построения графиков
  multi: any[]=[];// для приёма данных для построения графиков прихода и расхода
  view: any[] = [700, 140]; // размеры области графика
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
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  cardColor: string = '#232837';
  lineChartScheme = {
    name: 'coolthree',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b', '#7aa3e5', '#a8385d', '#00bfa5']
  };
  legendPosition = 'right';
  single: any[];  

  //переменные прав
  allowToViewAllCompanies:boolean = false;  //Возможность построения отчётов по объёмам продаж, закупок и др. по всем предприятиям
  allowToViewMyCompany:boolean = false;     //Возможность построения отчётов по объёмам продаж, закупок и др. по всем отделениям своего предпрития
  allowToViewMyDepartments:boolean = false; //Возможность построения отчётов по объёмам продаж, закупок и др. по своим отделениям своего предпрития

  @Input() companyId: number;                       // id предприятия, для которого запрашиваем данные
  @Input() myCompanyId: number;                     // id своего предприятия, для которого запрашиваем данные
  @Input() permissionsSet: any[];                   // сет прав на документ

  constructor(
    private _router:Router,
    private http: HttpClient,
    private MessageDialog: MatDialog,) {}

  ngOnInit(): void {

  }

  onStart(){
    this.getCRUD_rights(this.permissionsSet);
    this.getIndicatorsData();
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

  getIndicatorsData(){
    this.multi=[];
    this.http.get('/api/auth/getIndicatorsData?company_id='+this.companyId)
    .subscribe(
        (data) => {
          this.multi=data as any []; 
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }

  moneyFormat(m) {
    return parseFloat(m).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1 ").replace('.', ',');
  }   

  onSelect(data): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));

    switch (data.name) {
      case 'Просроченные счета': {
        this._router.navigate(['ui/invoiceout',{company: this.companyId, option: 2}]);
        break;}
      case 'Просроченные заказы': {
        this._router.navigate(['ui/customersorders',{company: this.companyId, option: 2}]);
        break;}
      case 'Новые заказы': {
        this._router.navigate(['ui/customersorders',{company: this.companyId, option: 3}]);
        break;}
      case 'Деньги': {
        this._router.navigate(['ui/moneyflow',{company: this.companyId}]);
        break;}
      case 'Мы должны': {
        this._router.navigate(['ui/mutualpayment',{company: this.companyId, option: 1}]);
        break;}
      case 'Нам должны': {
        this._router.navigate(['ui/mutualpayment',{company: this.companyId, option: 2}]);
        break;}
  }




  }

  onActivate(data): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }


}
