import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from '../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++

export interface IdAndName {
  id: number;
  name:string;
}

@Component({
  selector: 'app-settings-dashboard',
  templateUrl: './settings-dashboard.component.html',
  styleUrls: ['./settings-dashboard.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsDashboardComponent implements OnInit {getSettingsDashboard
  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  receivedCompaniesList: IdAndName [] = [];//массив для получения списка предприятий
  myCompanyId: number; // предприятие пользователя
  id:number; 
  permissionsSet: any[];//сет прав стартовой страницы
  allowToViewAllCompanies:boolean = false;

  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<SettingsDashboardComponent>,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  ngOnInit(): void {
    this.receivedCompaniesList=this.data.receivedCompaniesList;
    this.permissionsSet=this.data.permissionsSet;
    this.myCompanyId = this.data.myCompanyId;

    //форма для сохранения настроек (настройки сохраняются в родительском модуле (dashboard), куда отправляются при закрытии диалога)
    this.settingsForm = new UntypedFormGroup({
      companyId: new UntypedFormControl                (null,[Validators.required]),
    });

    this.getSettings();

  }

  //загрузка настроек. 
  //В данный момент из настроек присутствует только выбор предприятия, для которого будет загружаться информация во всех виджетах стартовой страницы
  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsDashboard').subscribe
    (
      data => 
      { 
        result=data as any;
        this.gettingData=false;
        //вставляем настройки в форму настроек
        this.settingsForm.get('companyId').setValue(result.companyId);
        this.getCRUD_rights();
      },
      error => console.log(error)
    );
  } 

  // Нужно отобразить список предприятий. Но что отображать - все предприятия главного аккаунта, или только своё предприятие?
  // Если у хотя бы одного виджета будет право на "Просмотр по всем предприятиям" - нужно отобразить все предприятия. 
  // Иначе - фильтруем список полученных предприятий главного аккаунта, и оставляем только своё
  getCRUD_rights(){
    this.allowToViewAllCompanies = 
      this.permissionsSet.some(         function(e){return(e==325)}) 
    ||this.permissionsSet.some(         function(e){return(e==592)}) 
    ||this.permissionsSet.some(         function(e){return(e==594)}) 
    ||this.permissionsSet.some(         function(e){return(e==596)}) 
    ||this.permissionsSet.some(         function(e){return(e==598)}) 
    ||this.permissionsSet.some(         function(e){return(e==600)}) 
    ||this.permissionsSet.some(         function(e){return(e==602)}) 
    ||this.permissionsSet.some(         function(e){return(e==604)})     
    ||this.permissionsSet.some(         function(e){return(e==606)}) 
    ;
    this.getCompaniesList();
  }

  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
    .subscribe(
      (data)  => {
        this.receivedCompaniesList=data as IdAndName [];
        this.doFilterCompaniesList();
      },
      error   => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
    );
  }

  doFilterCompaniesList(){
    let myCompany:IdAndName;
    if(!this.allowToViewAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
      this.settingsForm.get('companyId').setValue(this.myCompanyId);//на тот случай, если ранее было выбрано не своё предприятие, но потом изменили права
    }
  }
  
  onNoClick(): void {
    this.SettingsDialog.close();
  }
  
  //нажали "Сохранить настройки"
  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }

  onCompanyChange(){
    // ничто: делает
  }
 
}
