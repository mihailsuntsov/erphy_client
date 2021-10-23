import { Component, OnInit } from '@angular/core';
import { QueryForm } from './query-form';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-traderesults-table.service';
import { QuerySumService } from './get-sum-by-period.service';

import { MomentDateAdapter} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';
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

export interface DocTable {
  id: number;
}


@Component({
  selector: 'app-traderesults-report',
  templateUrl: './traderesults-report.component.html',
  styleUrls: ['./traderesults-report.component.css'],
  providers: [QueryFormService,LoadSpravService,QuerySumService,
  {provide: MAT_DATE_LOCALE, useValue: 'ru'},
  {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
  {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})
export class TraderesultsReportComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы
  receivedMatTable: DocTable []=[] ;//массив для получения данных для материал таблицы
  receivedSumByPeriod: any;//массив для получения данных по суммам показателей за месяц
  dataSource = new MatTableDataSource<DocTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отделений
  receivedUsersList  : any [];//массив для получения списка пользователей
  defaultId:number=0;//для подстановки дефолтных значений выпадающих списков
  doneLoadData:boolean=false;

  //переменные прав
  permissionsSet: any[];//сет прав на документ

  allowToAllCompanies:boolean = false;
  allowToMyCompany:boolean = false;
  allowToMyDepartments:boolean = false;
  allowToMy:boolean = false;

  constructor(
    private queryFormService:   QueryFormService,
    private querySumService:   QuerySumService,
    private httpService:   LoadSpravService,
    private http: HttpClient) { }

  ngOnInit() {
    this.sendingQueryForm.companyId="0";
    this.sendingQueryForm.departmentId="0";
    this.sendingQueryForm.employeeId="0";


    this.getSetOfPermissions();
    this.setDefaultDates();
  }

  getData(){
    this.getCompaniesList();
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=8')
          .subscribe(
              (data) => {   
                          this.permissionsSet=data as any [];
                          console.log("permissions:"+this.permissionsSet);
                          this.getCRUD_rights(this.permissionsSet);
                      },
              error => console.log(error),
          );
  }
  getCRUD_rights(permissionsSet:any[]){
  //some проверяет, удовлетворяет ли хоть какой-нибудь элемент массива условию, заданному в передаваемой функции
  this.allowToAllCompanies = permissionsSet.some(this.isAllowToAllCompanies);
  this.allowToMyCompany = permissionsSet.some(this.isAllowToMyCompany);
  this.allowToMyDepartments = permissionsSet.some(this.isAllowToMyDepartments);
  this.allowToMy = permissionsSet.some(this.isAllowToMy);
  this.getTableHeaderTitles();
  this.getData();
  }

  isAllowToAllCompanies(e){return(e==86);}      //Информация по всем предприятиям
  isAllowToMyCompany(e){return(e==87);}         //Информация по своему предприятию
  isAllowToMyDepartments(e){return(e==88);}     //Информация по своим отделениям
  isAllowToMy (e){return(e==89);}               //Информация по своим документам

  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getTableHeaderTitles(){
    this.displayedColumns.push('opendoc');
    this.displayedColumns.push('trade_date');
    this.displayedColumns.push('department');
    this.displayedColumns.push('employee');
    this.displayedColumns.push('creator');
    //this.displayedColumns.push('date_time_created');
    this.displayedColumns.push('cash_all');
    this.displayedColumns.push('cash_minus_encashment');
    this.displayedColumns.push('total_incoming');
    }

  getTable(){
    this.queryFormService.getTable(this.sendingQueryForm)
            .subscribe(
                (data) => {
                  this.receivedMatTable=data as any []; 
                  this.dataSource.data = this.receivedMatTable;
                  this.getSums();
                },
                error => console.log(error) 
            );
  }

  getSums(){
    this.querySumService.getTradeResultsSumByPeriod(this.sendingQueryForm)
            .subscribe(
                (data) => {
                  this.receivedSumByPeriod=data as any; 
                  this.doneLoadData=true;
                },
                error => console.log(error) 
            );

  }
  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.httpService.getCompaniesList()
            .subscribe(
                (data) => {this.receivedCompaniesList=data as any [];
                  /*console.log("receivedCompaniesList-"+this.receivedCompaniesList)*/
                  this.setDefaultCompany();
                },
                error => console.log(error)
            );
  }

  setDefaultCompany(){
    if(this.receivedCompaniesList.length==1)
    {
      this.receivedCompaniesList.forEach(data =>{this.defaultId=+data.id;});
      this.sendingQueryForm.companyId=this.defaultId;
      this.getDepartmentsList();
    }else this.getDepartmentsList();
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    if(this.isAllowToAllCompanies||this.isAllowToMyCompany)
    {
      this.httpService.getDepartmentsListByCompanyId(this.sendingQueryForm.companyId,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                  this.setDefaultDepartment();},
                error => console.log(error)
            );
    }else if(this.isAllowToMyDepartments||this.isAllowToMy){
      this.httpService.getMyDepartmentsListByCompanyId(this.sendingQueryForm.companyId,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                  this.setDefaultDepartment();},
                error => console.log(error)
            );
    }

  }

  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      this.receivedDepartmentsList.forEach(data =>{this.defaultId=+data.id;});
      this.sendingQueryForm.departmentId=this.defaultId;
      this.getUsersListByDepartmentId();
    } else this.getUsersListByDepartmentId();
  }

  getUsersListByDepartmentId(){
    this.receivedUsersList=null;
    this.httpService.getUsersListByDepartmentId(this.sendingQueryForm.departmentId)
            .subscribe(
                (data) => {this.receivedUsersList=data as any [];
                  console.log("receivedUsersList="+this.receivedUsersList);
                  //this.setDefaultUser();
                  this.getTable();
                  
                },
                error => console.log(error)
            );
  }

  setDefaultDates(){
    this.sendingQueryForm.dateFrom=moment().startOf('month');
    this.sendingQueryForm.dateTo=moment().endOf('month');;
  }

  addEvent(type: string, event: any) {
    console.log("type="+type);
    if(type=='dateFrom') this.sendingQueryForm.dateFrom = event.value;
    else this.sendingQueryForm.dateTo = event.value;
    this.getTable();
  }



















}
