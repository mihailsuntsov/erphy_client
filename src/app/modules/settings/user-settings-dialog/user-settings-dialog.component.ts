import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { startWith, map } from 'rxjs/operators';
import { LoadSpravService } from '../../../services/loadsprav';
import { Observable } from 'rxjs';

interface IdAndName{
  id: string;
  name: string;
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
  // locale:string='en-us';// locale (for dates, calendar etc.)
  suffix:string='en';   // en es ru etc
  
  spravSysTimeZones: IdAndName[] = [];                // here will be loaded all time zones
  spravSysLanguages: IdAndName[] = [];                // here will be loaded all languages
  spravSysLocales  : IdAndName[] = [];                // here will be loaded all locales
  filteredSpravSysTimeZones: Observable<IdAndName[]>; // here will be filtered time zones for showing in select list
  filteredSpravSysLanguages: Observable<IdAndName[]>; // here will be filtered languages for showing in select list
  filteredSpravSysLocales:   Observable<IdAndName[]>; // here will be filtered locales for showing in select list

  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<UserSettingsDialogComponent>,
    public MessageDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.SettingsDialog.close();
    }
  
  ngOnInit(): void {

    this.settingsForm = new FormGroup({
      timeZoneId: new FormControl                 (this.data.timeZoneId,[Validators.required]),
      timeZoneName: new FormControl               ('',[]),
      languageId: new FormControl                 (this.data.languageId,[Validators.required]),
      languageName: new FormControl               ('',[]),
      localeId: new FormControl                   (this.data.localeId,[Validators.required]),
      localeName: new FormControl                 ('',[]),
    });

    // this.locale=this.data.locale;
    this.suffix=this.data.suffix;

    // listener of time zones field change
    this.filteredSpravSysTimeZones = this.settingsForm.get('timeZoneName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value,this.spravSysTimeZones))
    );

    // listener of language field change
    this.filteredSpravSysLanguages = this.settingsForm.get('languageName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value,this.spravSysLanguages))
    );

    // listener of locale field change
    this.filteredSpravSysLocales = this.settingsForm.get('localeName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value, this.spravSysLocales))
    );
    this.getSpravSysTimeZones();
    this.getSpravSysLanguages();
    this.getSpravSysLocales();
  }
  
  // filtration on each change of text field
  private _filter(value: string, list:IdAndName[]): IdAndName[] {
    const filterValue = value.toLowerCase();
    return list.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  getSpravSysTimeZones():void {    
    this.http.get('/api/auth/getSpravSysTimeZones?suffix='+this.suffix)  // 
    .subscribe((data) => {this.spravSysTimeZones = data as any[];
    this.updateValues('timeZoneId','timeZoneName',this.spravSysTimeZones); },
    error => console.log(error));
  }
  getSpravSysLanguages():void {    
    this.http.get('/api/auth/getSpravSysLanguages')  // 
    .subscribe((data) => {this.spravSysLanguages = data as any[];
    this.updateValues('languageId','languageName',this.spravSysLanguages); },
    error => console.log(error));
  }
  getSpravSysLocales():void {    
    this.http.get('/api/auth/getSpravSysLocales')  // 
    .subscribe((data) => {this.spravSysLocales = data as any[];
    this.updateValues('localeId','localeName',this.spravSysLocales); },
    error => console.log(error));
  }

  //set name into text field, that matched id in list IdAndName[] (if id is not null)
  updateValues(id:string,name:string,list:IdAndName[]){
    if(+this.settingsForm.get(id).value!=0){
      list.forEach(x => {
        if(x.id==this.settingsForm.get(id).value){
          this.settingsForm.get(name).setValue(x.name);
    }})} 
    else{ // if id is null - setting '' into the field (if we don't do it - there will be no list of values, when place cursor into the field)
      this.settingsForm.get(name).setValue('');
      this.settingsForm.get(id).setValue('');
    }
  }

  // set id of field value into null when field search value is '' 
  checkEmptyFields(id:string,name:string){
    if( this.settingsForm.get(name).value.length==0){
      this.settingsForm.get(id).setValue(null);
    }
  }

  setLocale(localeId:string){
    this.settingsForm.get('localeId').setValue(localeId); //set id of locale
    this.updateValues('localeId','localeName',this.spravSysLocales); //change value of locale text field
  }

  clearField(field:string){
    this.settingsForm.get(field).setValue('');
  }

  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }
  
}
