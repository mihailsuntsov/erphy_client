import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, tap, switchMap, startWith, map } from 'rxjs/operators';
import { LoadSpravService } from '../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Observable } from 'rxjs';

interface IdAndName{
  id: string;
  name_rus: string;
}

@Component({
  selector: 'app-user-settings-dialog',
  templateUrl: './user-settings-dialog.component.html',
  styleUrls: ['./user-settings-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class UserSettingsDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // form for all settings
  receivedTimeZonesList:  any [] = [];
  receivedLanguagesList:  any [] = [];
  receivedLocalesList:    any [] = [];
  locale:string='en-us';// locale (for dates, calendar etc.)
  suffix:string='en';   // en es ru etc

  
  spravSysTimeZones: IdAndName[] = [];                // here will be loaded all time zones
  filteredSpravSysTimeZones: Observable<IdAndName[]>; //here will be filtered time zones


  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<UserSettingsDialogComponent>,
    public MessageDialog: MatDialog,
    // private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.SettingsDialog.close();
    }
  
  ngOnInit(): void {

    this.settingsForm = new FormGroup({
      timeZoneId: new FormControl                 (this.data.timeZoneId,[]),
      timeZoneName: new FormControl                 (this.data.timeZoneId,[]),
      languageId: new FormControl                 (this.data.languageId,[]),
      localeId: new FormControl                   (this.data.localeId,[]),
    });
    this.locale=this.data.locale;
    this.suffix=this.data.suffix;

    // listener of time zones field change
    this.filteredSpravSysTimeZones = this.settingsForm.get('timeZoneName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value))
    );

    this.getSpravSysTimeZones();
    // this.getSpravSysLanguages();
    // this.getSpravSysLocales();

  }
  
  //фильтрация при каждом изменении в поле Часовой пояс
  private _filter(value: string): IdAndName[] {
    const filterValue = value.toLowerCase();
    return this.spravSysTimeZones.filter(option => option.name_rus.toLowerCase().includes(filterValue));
  }
  getSpravSysTimeZones():void {    
    this.http.get('/api/auth/getSpravSysTimeZones?suffix='+this.suffix, {})  // 
    .subscribe((data) => {this.spravSysTimeZones = data as any[];
    this.updateValues('timeZoneId','timeZoneName'); },
    error => console.log(error));
    }
  //если значение уже выбрано (id загрузилось), надо из массива объектов найти имя, соответствующее этому id 
  updateValues(id:string,name:string){
    if(+this.settingsForm.get(id).value!=0)
      {
        this.spravSysTimeZones.forEach(x => {
          if(x.id==this.settingsForm.get(id).value){
            this.settingsForm.get(name).setValue(x.name_rus);
          }
        })
      } 
      else //иначе обнулить поля id и имени. Без этого при установке курсора в поле список выскакивать не будет (х.з. почему так)
      {
        this.settingsForm.get(name).setValue('');
        this.settingsForm.get(id).setValue('');
      }
  }
  //вызывается из html. необходима для сброса уже имеющегося значения. когда имя стирается, в id установится 0 
  checkEmptyTimeZoneField(){
    if( this.settingsForm.get('timeZoneName').value.length==0){
      this.settingsForm.get('timeZoneId').setValue('');
    }
  }
  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }
  
}
