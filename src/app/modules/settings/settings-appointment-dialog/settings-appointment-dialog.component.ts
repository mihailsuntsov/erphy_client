import { Component, OnInit , Inject, Input, SimpleChanges } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from '../../../services/loadsprav';
import { translate } from '@ngneat/transloco';
import moment from 'moment';

@Component({
  selector: 'app-settings-appointment-dialog',
  templateUrl: './settings-appointment-dialog.component.html',
  styleUrls: ['./settings-appointment-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsAppointmentDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  id: number;
  timeFormat:string='24';
  //права
  allowToCreateAllCompanies:boolean;
  allowToCreateMyCompany:boolean;
  timelineStep_virtualValue:number = 1;

  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<SettingsAppointmentDialogComponent>,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.SettingsDialog.close();
    }
  ngOnInit(): void {
    this.receivedCompaniesList=this.data.receivedCompaniesList;
    this.timeFormat = this.data.timeFormat;
    this.allowToCreateAllCompanies=this.data.allowToCreateAllCompanies;
    this.allowToCreateMyCompany=this.data.allowToCreateMyCompany;

    this.settingsForm = new UntypedFormGroup({
      companyId: new UntypedFormControl                 (null,[]),    // company by default
      startTime: new UntypedFormControl                 ('current',[]), // current / set_manually
      endDateTime: new UntypedFormControl               ('sum_all_length',[]), // no_calc / sum_all_length / max_length 
      startTimeManually: new UntypedFormControl         ('00:00',[]), // 'HH:mm' if start_time = 'set_manually'
      endTimeManually: new UntypedFormControl           ('00:01',[]), // 'HH:mm' if end_time = 'no_calc' || calcDateButTime = 'true'
      hideEmployeeField: new UntypedFormControl         ('false',[]), // If for all services of company employees are not needed
      calcDateButTime: new UntypedFormControl           ('false',[]), // If user wants to calc only dates. Suitable for hotels for checkout time
    });
    // TO DISABLE REACTIVE FORM FIELD IN ANGULAR 14 & >
    this.settingsForm.controls.endDateTime.valueChanges.subscribe((value: string) => {
      if(value != 'no_calc') {
        this.settingsForm.get('calcDateButTime').enable();
        
        if(this.settingsForm.controls.calcDateButTime.value)
          this.settingsForm.get('endTimeManually').enable();
        else this.settingsForm.get('endTimeManually').disable();

      }
      else {
        this.settingsForm.get('calcDateButTime').disable();
        this.settingsForm.get('endTimeManually').enable();

      }
    })
    this.settingsForm.controls.startTime.valueChanges.subscribe((value: string) => {
      if(value != 'set_manually') this.settingsForm.get('startTimeManually').disable();
      else this.settingsForm.get('startTimeManually').enable();
    })
    
    this.settingsForm.controls.calcDateButTime.valueChanges.subscribe((value: boolean) => {
      if(value) this.settingsForm.get('endTimeManually').enable();
      else this.settingsForm.get('endTimeManually').disable();
    })
    this.getSettings();  
  }

  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsAppointment').subscribe
    (data => 
      {
        result=data as any;
        this.gettingData=false;
        //  вставляем настройки в форму настроек
        this.settingsForm.get('startTime').setValue(result.startTime);
        this.settingsForm.get('endDateTime').setValue(result.endDateTime);
        this.settingsForm.get('startTimeManually').setValue(result.startTimeManually);
        this.settingsForm.get('endTimeManually').setValue(result.endTimeManually);
        this.settingsForm.get('hideEmployeeField').setValue(result.hideEmployeeField);
        this.settingsForm.get('calcDateButTime').setValue(result.calcDateButTime);
        //  if(this.isCompanyInList(+result.companyId)){
        //  данная группа настроек зависит от предприятия
        this.settingsForm.get('companyId').setValue(this.data.companyId);
        // }
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

  onCompanyChange(){}

  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }



}
