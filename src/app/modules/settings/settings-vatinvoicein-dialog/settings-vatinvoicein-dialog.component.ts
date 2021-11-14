import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { LoadSpravService } from '../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';

interface statusInterface{
  id:number;
  name:string;
  status_type:number;//тип статуса: 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
  output_order:number;
  color:string;
  description:string;
  is_default:boolean;
}
@Component({
  selector: 'app-settings-vatinvoicein-dialog',
  templateUrl: './settings-vatinvoicein-dialog.component.html',
  styleUrls: ['./settings-vatinvoicein-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsVatinvoiceinDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий

  // права
  allowToCreateAllCompanies:boolean;
  allowToCreateMyCompany:boolean;

  // статусы
  receivedStatusesList: statusInterface [] = []; // массив для получения статусов
  status_color: string = '';
  id:number; 

  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<SettingsVatinvoiceinDialogComponent>,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.SettingsDialog.close();
    }
  
  ngOnInit(): void {
    this.receivedCompaniesList=this.data.receivedCompaniesList;
    this.id=+this.data.id;
    this.allowToCreateAllCompanies=this.data.allowToCreateAllCompanies;
    this.allowToCreateMyCompany=this.data.allowToCreateMyCompany;

    this.settingsForm = new FormGroup({
      
      //предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[Validators.required]),
      //статус при успешном проведении
      statusIdOnComplete: new FormControl(null,[]),
    });

    this.getSettings();
    
  }
  //загрузка настроек
  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsVatinvoicein').subscribe
    (
      data => 
      { 
        result=data as any;
        this.gettingData=false;
        //вставляем настройки в форму настроек
        if(this.isCompanyInList(+result.companyId)){
          //данная группа настроек зависит от предприятия
          this.settingsForm.get('companyId').setValue(result.companyId);
          this.settingsForm.get('statusIdOnComplete').setValue(result.statusIdOnComplete);
        }
        //данная группа настроек не зависит от предприятия
        //(таковой тут нет)

        if(+this.settingsForm.get('companyId').value>0){
          this.getStatusesList();
        }
      },
      error => console.log(error)
    );
  }
  //определяет, есть ли предприятие в загруженном списке предприятий
  isCompanyInList(companyId:number):boolean{
    let inList:boolean=false;
    if(this.receivedCompaniesList) this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }

  onCompanyChange(){
    this.settingsForm.get('statusIdOnComplete').setValue(null);
    this.getStatusesList();
  }
  
  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }
  
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  
  //------------------------------С Т А Т У С Ы-------------------------------------------------
  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.settingsForm.get('companyId').value,38) //38 - id документа из таблицы documents
      .subscribe(
          (data) => 
          { this.receivedStatusesList=data as statusInterface[];
            if(+this.settingsForm.get('statusIdOnComplete').value==0) this.setDefaultStatus();
            this.setStatusColor();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
           
  }
  setDefaultStatus(){
    if(this.receivedStatusesList.length>0)
    {
      this.receivedStatusesList.forEach(a=>{
          if(a.is_default){
            this.settingsForm.get('statusIdOnComplete').setValue(a.id);
          }
      });
    }
  }
  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  setStatusColor():void{
    this.receivedStatusesList.forEach(m=>
      {
        if(m.id==+this.settingsForm.get('statusIdOnComplete').value){
          this.status_color=m.color;
        }
      });
      console.log(' this.status_color = '+ this.status_color);
  }
}
