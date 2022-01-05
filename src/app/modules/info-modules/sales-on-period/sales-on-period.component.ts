import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
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

@Component({
  selector: 'app-sales-on-period',
  templateUrl: './sales-on-period.component.html',
  styleUrls: ['./sales-on-period.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    ProductCategoriesSelectComponent, LoadSpravService,
  ]
})
export class SalesOnPeriodComponent implements OnInit {

  queryForm:any;//форма для отправки запроса 
  units:UnitsSet[] = [{id:'hour', name:'Чac'}, {id:'day', name:'День'}, {id:'week', name:'Неделя'}, {id:'month', name:'Месяц'}, {id:'year', name:'Год'}];
  reportTypeName: string = '';
  departmentControl = new FormControl(); //поле для поиска и отображения наименования выбранного отделения
  employeeControl = new FormControl(); //поле для поиска и отображения выбранного сотрудника
  receivedEmployeeList: IdAndName[]; // список сотрудников
  filteredDepartments: Observable<IdAndName[]>;
  filteredEmployee: Observable<IdAndName[]>;
  selectedObjects: IdAndName[]=[]; // выбранные объекты (категории или товары)
  selectable = true;
  removable = true;
  showSettingsForm = false;
  departmentsList: IdAndName[] = []; // массив отделений, разрешенных к выбору для отчета (это могут быть как все отделения предприятия, так и отделения предприятия, к которым приписан пользователь, в зависимости от прав)
  //т.е. из головной Dashboard приходит 2 списка отделений предприятия - все и пользователя. Смотрим permissionsSet, и на основании него определяем, чему будет равен итоговый departmentsList - всем отделениям или только отделениям пользователя
  
  //переменные для построения графиков
  multi: any[]=[];// для приёма данных для построения графиков
  view: any[] = [700, 400]; // размеры области графика
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = true;
  showLegend: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Месяцы';
  showYAxisLabel: boolean = true;
  yAxisLabel: string = 'Продажи, руб';
  legendTitle: string = 'Категории';
  calculatedSum : number = 0; // суммированный объем по всем барам
  colorScheme = {domain: ['#5AA454', '#C7B42C', '#AAAAAA']};



  //переменные прав
  allowToViewAllCompanies:boolean = false;  //Возможность построения отчётов по объёмам продаж, закупок и др. по всем предприятиям
  allowToViewMyCompany:boolean = false;     //Возможность построения отчётов по объёмам продаж, закупок и др. по всем отделениям своего предпрития
  allowToViewMyDepartments:boolean = false; //Возможность построения отчётов по объёмам продаж, закупок и др. по своим отделениям своего предпрития

  // @ViewChild(ProductCategoriesSelectComponent, {static: false}) public productCategoriesSelectComponent:ProductCategoriesSelectComponent; // блок выбора категорий и товаров/услуг
  @Input() companyId: number;                       // id предприятия, для которого запрашиваем данные
  @Input() myCompanyId: number;                     // id своего предприятия, для которого запрашиваем данные
  @Input() permissionsSet: any[];                   // сет прав на документ
  @Input() receivedDepartmentsList: IdAndName[];    // массив всех отделений предприятия
  @Input() receivedMyDepartmentsList: IdAndName[];  // массив своих отделений предприятия

  constructor(
    private loadSpravService:   LoadSpravService,
    private productCategoriesSelectComponent: MatDialog,
    private http: HttpClient,
    private MessageDialog: MatDialog,) {}

  ngOnInit(): void {

    this.queryForm = new FormGroup({ //форма для отправки запроса 
      companyId: new FormControl(this.companyId,[]), // предприятие, по которому идет запрос данных
      periodType: new FormControl('month',[]), // отрезок времени для анализа (день, месяц, год, или выбранный период) 
      unit: new FormControl(),       // какая единица одного бара на графике (час, неделя, месяц, день, год)
      dateFrom: new FormControl(),   // дата С
      dateTo: new FormControl(),     // дата По
      type: new FormControl('sell',[]), // тип отчета - продажи или закупки (buy, sell)
      reportOn:new FormControl('categories',[]), // по категориям или по товарам/услугам (categories, products)
      reportOnIds: new FormControl([],[]), //id категорий/товаров/услуг (того, что выбрано в reportOn)
      departmentsIds: new FormControl([],[]), //id всех отобранных отделений
      departmentId: new FormControl(0,[]), //id выбранного по autocomplete отделения
      employeeIds: new FormControl([],[]), //id сотрудников
      employeeId: new FormControl(0,[]), //id выбранного по autocomplete сотрудника
      all: new FormControl(false,[]), //отчет по всем (категориям или товарам-услугам, в зависимости от того, что выбрано)
      includeChilds: new FormControl(true,[]), // включая все подкатегории выбранных категорий
      withSeparation: new FormControl(false,[]), // с разбивкой. Например, на каждый временной отрезок будет представлено несколько значений выбранных категорий по отдельности (иначе эти значения суммируются)
    });

    // this.onStart(); - запуск вызывается из модуля Dashboard после загрузки всех справочников
  }

  onStart(){
    
    this.units.push();
    this.onPeriodChange();
    this.setReportName();
    this.getCRUD_rights(this.permissionsSet);
    this.departmentsList=[];
    this.selectedObjects=[];
    this.resetDepartmentFormSearch();
    
    this.determineDepartmentsList();    
    this.filterDepartments();
    
    this.getVolumesReportData();
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies =  permissionsSet.some(          function(e){return(e==325)});
    this.allowToViewMyCompany =     permissionsSet.some(          function(e){return(e==326)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==327)});
  }

  //определяет, на какой из списков отделений (все отделения предприятия или только пользователя) пользователь имеет право
  determineDepartmentsList(){
    // console.log('------receivedMyDepartmentsList------');
    // this.receivedMyDepartmentsList.map(i=>{
    //   console.log('id - '+i.id+', name - '+i.name);
    // });
    // console.log('---------------------------------');

    // console.log('------receivedDepartmentsList------');
    // this.receivedDepartmentsList.map(i=>{
    //   console.log('id - '+i.id+', name - '+i.name);
    // });
    // console.log('---------------------------------');
    //если разрешен просмотр по всем предприятиям, или по своему предприятию и мое предприятие = тому предприятию, чьи отделения переданы в данный модуль
    if(this.allowToViewAllCompanies || (this.allowToViewMyCompany && this.companyId==this.myCompanyId)){
      this.fillDepartmentsList(this.receivedDepartmentsList); //имеем доступ к просмотру отчета по всем отделениям текущего предприятия
    } else if(this.allowToViewMyDepartments){ //иначе если есть право на свои отделения - имеем доступ к просмотру отчета по своим отделениям
      this.fillDepartmentsList(this.receivedMyDepartmentsList);
    }  //иначе не имеем прав вообще, и departmentsList будет пуст. Соответственно, не загрузятся и сотрудники, и сами данные. 
  }

  //заполняет список отделений разрешенными по правам отделениями
  fillDepartmentsList(list: IdAndName[]){
    if(list)
      list.map(i => {
        this.departmentsList.push({id:i.id,name:i.name});
      });
    // console.log('------Разрешенные отделения------');
    // this.departmentsList.map(i=>{
    //   console.log('id - '+i.id+', name - '+i.name);
    // });
    // console.log('---------------------------------');
  }

  setDepartmentId(){
    this.queryForm.get('departmentId').setValue(this.departmentControl.value.id?this.departmentControl.value.id:0);
    if(+this.queryForm.get('departmentId').value>0)
      this.getEmployeeList(); 
  }

  setEmployeeId(){
    this.queryForm.get('employeeId').setValue(this.employeeControl.value.id?this.employeeControl.value.id:0);
  }

  //удаляет фокус ( курсор ) из окна поиска. Вызывается только из html 
  removeFocus(field, input){
    setTimeout(function(){
      field._elementRef.nativeElement.classList.remove('mat-focused');input.blur();}, 100);
  }

  resetDepartmentFormSearch(){
    this.queryForm.get('departmentsIds').setValue([]);
    this.queryForm.get('departmentId').setValue('');
    this.departmentControl.setValue('');

    //т.к. отделение сбросили - нужно сбросить и его сотрудников:
    this.resetEmployeeFormSearch();
    this.receivedEmployeeList=[]; 
    this.filterEmployee(); //чтобы сбросить filteredEmployee, в котором есть список сотрудников от сброшенного отделения
  }

  resetEmployeeFormSearch(){
    this.queryForm.get('employeeIds').setValue([]);
    this.queryForm.get('employeeId').setValue('');
    this.employeeControl.setValue('');
  }

  // возвращает название из объекта типа IdAndName
  displayFn(object: IdAndName): string {
    return object && object.name ? object.name : '';
  }

  //фильтрует массив с данными о отделениях
  private _filterDepartments(name: string): IdAndName[] {
    const filterValue = name.toLowerCase();
    return this.departmentsList.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  //фильтрует массив с данными о сотрудниках
  private _filterEmployee(name: string): IdAndName[] {
    const filterValue = name.toLowerCase();
    return this.receivedEmployeeList.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  getEmployeeList(){
    this.receivedEmployeeList=null;
    this.loadSpravService.getEmployeeListByDepartmentId(this.queryForm.get('departmentId').value)
            .subscribe(
                (data) => {this.receivedEmployeeList=data as IdAndName [];
                  this.filterEmployee();
                  
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }
  
  filterEmployee(){
    this.filteredEmployee = this.employeeControl.valueChanges
                  .pipe(
                    startWith(''),
                    map(value => typeof value === 'string' ? value : value.name),
                    map(name => name ? this._filterEmployee(name) : this.receivedEmployeeList.slice())
                    );
  }

  filterDepartments(){
                  this.filteredDepartments = this.departmentControl.valueChanges
                  .pipe(
                    startWith(''),
                    map(value => typeof value === 'string' ? value : value.name),
                    map(name => name ? this._filterDepartments(name) : this.departmentsList.slice())
                  );
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
    switch(this.queryForm.get('periodType').value){
      case "day":{
        this.queryForm.get('dateFrom').setValue(moment());
        this.queryForm.get('dateTo').setValue(moment());
        break;
      }
      case "week":{
        this.queryForm.get('dateFrom').setValue(moment().startOf('isoWeek'));
        this.queryForm.get('dateTo').setValue(moment().endOf('isoWeek'));
        break;
      }
      case "month":{
        this.queryForm.get('dateFrom').setValue(moment().startOf('month'));
        this.queryForm.get('dateTo').setValue(moment().endOf('month'));
        break;
      }
      case "year":{
        this.queryForm.get('dateFrom').setValue(moment().startOf('year'));
        this.queryForm.get('dateTo').setValue(moment().endOf('year'));
        break;
      }
      default:{ //period
      }
    }
  }

  // формирует набор единиц временных интервалов (часы, дни и т.д.), в зависимости от выбранного периода
  calcUnitsSet(){
    switch(this.queryForm.get('periodType').value){
      case "day":{
        this.units = [{id:'hour',name:'Чac'}];
        this.queryForm.get('unit').setValue('hour');
        break;
      }
      case "week":{
        this.units = [{id:'day',name:'День'}];
        this.queryForm.get('unit').setValue('day');
        break;
      }
      case "month":{
        this.units = [{id:'day',name:'День'}];
        this.queryForm.get('unit').setValue('day');
        break;
      }
      case "year":{
        this.units = [{id:'month',name:'Месяц'}];
        this.queryForm.get('unit').setValue('month');
        break;
      }
      default:{ //period
      }
    }
    this.setXAxisName();
  }

  // Формирует набор единиц временных интервалов (часы, дни и т.д.), в зависимости от длины периода, выбранного через поля "С даты" и "По дату" 
  // Зачем это надо? Не все единицы временных интервалов могут быть актуальны при разных временных периодах. Например, если длина периода будет 3 дня, 
  // смысла в отрезках "Неделя" и длиннее нет, также как и смыслав в часовых отрезках при периодах отчета более месяца
  calcUnitsSetForCustomPeriod(){
    
    var days:number = this.getDuration();
    if(days==0){ //если 1 день -  оставляем только часы
      this.units = [{id:'hour',name:'Чac'}];
      this.queryForm.get('unit').setValue('hour');
    }
    if(days>0 && days<27){ //если меньше 4 недель - смысла показывать недели нет, оставляем только дни
      this.units = [{id:'day',name:'День'}];
      this.queryForm.get('unit').setValue('day');
    }
    if(days>=27 && days<89){ //если меньше 3 месяцев - показываем дни. Отсюда и далее - без часов
      this.units = [{id:'day',name:'День'}];
      this.queryForm.get('unit').setValue('day');
    }
    if(days>=89 && days<729){ //если меньше 2 лет - показываем месяцы и годы
      this.units = [{id:'month',name:'Месяц'},{id:'year',name:'Год'}];
      this.queryForm.get('unit').setValue('month');
    }
    // if(days>=729){ //если 2 года и более - показываеи месяцы и годы
    //   this.units = [{id:'month',name:'Месяц'},{id:'year',name:'Год'}];
    //   this.queryForm.get('unit').setValue('year');
    // }
    this.setXAxisName();
  }

  onPeriodChange(){
    this.setRange();      // устанавливаем даты в полях "С даты" и "По дату" в зависимости от выбранного периода
    if(this.queryForm.get('periodType').value != 'period') // если стандартные периоды отчета...
      this.calcUnitsSet();  // формируем набор единиц временных интервалов (часы, дни и т.д.), в зависимости от выбранного периода
    else
      this.calcUnitsSetForCustomPeriod();// Формируем набор единиц временных интервалов (часы, дни и т.д.), в зависимости от длины периода, выбранного через поля "С даты" и "По дату" 
  }

  setReportName(){
    switch(this.queryForm.get('type').value){
      case "sell":{
        this.reportTypeName="Объёмы продаж"
        break;
      }
      case "buy":{
        this.reportTypeName="Объёмы закупок"
        break;
      }
    }
  }

  openDialogProductCategoriesSelect(){
    const dialogSettings = this.productCategoriesSelectComponent.open(ProductCategoriesSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        idTypes:    this.queryForm.get('reportOn').value, // "Отчёт по ..." (Категории, товары и услуги, ...)
        companyId:  this.companyId, //предприятие, по которому будут отображаться товары и категории
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        result.map(i => {
          this.selectedObjects.push(i);
        });
        this.getVolumesReportData();
      }
    });
  }
  
  remove(obj: IdAndName): void {
    const index = this.selectedObjects.indexOf(obj);

    if (index >= 0) 
      this.selectedObjects.splice(index, 1);

    if(this.selectedObjects.length==1)
      this.queryForm.get('withSeparation').setValue(false);

    this.getVolumesReportData();
  }

  onSwitchAllSlideToggle(){
    if((this.queryForm.get('all').value && this.selectedObjects.length>0) || this.selectedObjects.length>0) this.getVolumesReportData(); //запрос на обновление графика только если переключили с "Не все категориии/товары" на "Все категориии/товары", при этом были выбраны категории/товары, или уже есть выбранные товары/категории
  }

  onSwitchWithSeparationSlideToggle(){
    if(this.selectedObjects.length>0) this.getVolumesReportData(); //запрос на обновление графика только если есть выбранные товары/категории
  }

  getVolumesReportData(){
    this.multi=[];
    this.beforeRequestReportData();
    this.http.post('/api/auth/getVolumesReportData', this.queryForm.getRawValue())
    .subscribe(
        (data) => {
          this.multi=data as any [];
          this.calculateSum();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }

  onClickEmployee(){
    if(+this.queryForm.get('departmentId').value==0)
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Сначала необходимо выбрать отделение"}})
    else if(this.receivedEmployeeList.length==0)
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Нет списка сотрудников для выбранного отделения"}})
  }

  onClickDates(){
    if(this.queryForm.get('periodType').value!=='period'){
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Чтобы сменить дату, необходимо в поле "Время" выбрать "Период"'}})
    }
  }

  //подготовка к запросу данных отчёта
  beforeRequestReportData(){
    this.queryForm.get('companyId').setValue(this.companyId);//в том случае, если в головном модуле изменяем предприятие для всех виджетов - нужно его изменить и в форме для отправки запроса
    if(+this.queryForm.get('departmentId').value!=0) // в бэкэнде можно обработать не одно отделение, а несколько. Во фронте пока можно выбрать только одно (т.е. это задел на будущее)
      this.queryForm.get('departmentsIds').setValue([+this.queryForm.get('departmentId').value]); //т.е. нужно отправить массив с одним значением. Тут его и заполняем
    if(+this.queryForm.get('employeeId').value!=0)// то же самое с сотрудниками
      this.queryForm.get('employeeIds').setValue([+this.queryForm.get('employeeId').value]); // заполняем массив сотрудников
    if(this.selectedObjects.length>0){//если не по всем категориям или номенклатуре - заполняем массив выбранных объектов (например id-шниками категорий если выбирали категории)
      var ids:any[] = [];
      this.selectedObjects.map(i =>{ids.push(i.id);});
      this.queryForm.get('reportOnIds').setValue(ids);// по чему id-шники (номенклатура или категории)
    }
    if(!this.queryForm.get('all').value && this.selectedObjects.length==0)//если выбрано не "Все (категории, товары)", но сами категории/товары не отобраны в список на отправку, включить переключатель "Все категории/товары"
      this.queryForm.get('all').setValue(true);
  }

  reportOnChange(){
    this.selectedObjects=[];
    switch (this.queryForm.get('reportOn').value){
      case 'categories':
        {this.legendTitle = 'Категории'; break;}
      case 'products':
        {this.legendTitle = 'Товары/услуги'; break;}
    }
  }

  onChangeCompany(newCompanyId:number){
    if(newCompanyId!=this.companyId){
      this.companyId=newCompanyId;
      this.resetDepartmentFormSearch;
    }
  }

  setXAxisName(){
    this.units.map(i=>{
      if(this.queryForm.get('unit').value==i.id)
        this.xAxisLabel=i.name;
    })
  }

  calculateSum(){
    this.calculatedSum=0;
    if(this.multi){
      this.multi.map(i=>{
          i.series.map(s=>{
            this.calculatedSum += s.value;
          })
      })
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
