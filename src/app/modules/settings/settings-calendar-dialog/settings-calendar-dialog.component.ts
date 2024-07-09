import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from '../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco';
import moment from 'moment';

@Component({
  selector: 'app-settings-calendar-dialog',
  templateUrl: './settings-calendar-dialog.component.html',
  styleUrls: ['./settings-calendar-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsCalendarDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  id: number;
  timeFormat:string = '';
  //права
  allowToCreateAllCompanies:boolean;
  allowToCreateMyCompany:boolean;
  timelineStep_virtualValue:number = 1;

  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<SettingsCalendarDialogComponent>,
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
      startView: new UntypedFormControl                 ('month',[]),    // month / scheduler / resources
      timelineStep: new UntypedFormControl              (30,[]),      // step of timeline in minutes (15 / 30 / 60)
      dayStartMinute: new UntypedFormControl            (0,[]),    // minute of day start (0-1438) that means 00:00 - 23:58
      dayEndMinute: new UntypedFormControl              (1439,[]),    // minute of day end (1-1439)   that means 00:01 - 23:59
      resourcesScreenScale: new UntypedFormControl      ('month',[]),    // month / week / day
      displayCancelled: new UntypedFormControl          (false,[]),    // display or not cancelled events by default
    });
    this.getSettings();    
  }

  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsCalendar').subscribe
    (data => 
      { 
        result=data as any;
        this.gettingData=false;
        //вставляем настройки в форму настроек
        if(this.isCompanyInList(+result.companyId)){
          //данная группа настроек зависит от предприятия
          this.settingsForm.get('companyId').setValue(result.companyId);
          this.settingsForm.get('startView').setValue(result.startView);
          this.settingsForm.get('timelineStep').setValue(result.timelineStep);
          this.settingsForm.get('dayStartMinute').setValue(result.dayStartMinute);
          this.settingsForm.get('dayEndMinute').setValue(result.dayEndMinute);
          this.settingsForm.get('resourcesScreenScale').setValue(result.resourcesScreenScale);
          this.settingsForm.get('displayCancelled').setValue(result.displayCancelled);
          // alert(this.settingsForm.get('timelineStep').value)
          // alert(this.timelineStep_virtualValue)
        }
        this.timelineStep_virtualValue = this.setTimelineStep_VirtualValueByTimelineStep();
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

  formatLabel(value: number): string {
    console.log('this.data.timeFormat',this.data.timeFormat)
    console.log('this.data.timeFormat==12',this.data.timeFormat=='12')

    return  moment().startOf('day').add(value, 'minutes').format(this.data.timeFormat=='12'?'hh:mm A':'HH:mm')
  }

  setTimelineStepByVirtualValue(){
    switch (this.timelineStep_virtualValue){
      case 1: this.settingsForm.get('timelineStep').setValue(15);break;
      case 2: this.settingsForm.get('timelineStep').setValue(30);break;
      case 3: this.settingsForm.get('timelineStep').setValue(60);break;
    }
  }

  get timeRangeInText(){
    return  moment().startOf('day').add(this.settingsForm.get('dayStartMinute').value, 'minutes').format(this.data.timeFormat=='12'?'hh:mm A':'HH:mm') +'-'+
    moment().startOf('day').add(this.settingsForm.get('dayEndMinute').value, 'minutes').format(this.data.timeFormat=='12'?'hh:mm A':'HH:mm')
  }

  setTimelineStep_VirtualValueByTimelineStep(){
    switch (this.settingsForm.get('timelineStep').value){
      case 15:  return 1;
      case 30:  return 2;
      case 60:  return 3;
    }
  }

  onCompanyChange(){}

  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }



}
