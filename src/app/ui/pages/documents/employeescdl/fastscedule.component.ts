import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';

@Component({

  selector: 'fast-scedule',

  template: `
    <mat-card appearance="outlined" class="card" *transloco="let t">
        <mat-card-header>
            <mat-card-title class="flex">
                <div class="card-name">{{('docs.card.scdl_constr' | transloco)}}</div>
                <button 
                    mat-raised-button 
                    (click)="applySelect()"
                    color="primary"
                    matTooltip="{{t('docs.tip.select')}}"
                    class="button small-button">
                    <i class="material-icons">done</i>
                </button>
                <button 
                    (click)="onNoClick()"
                    matTooltip="{{t('docs.tip.close')}}"
                    mat-raised-button 
                    color="accent"
                    class="button small-button">
                    <i class="material-icons">close</i>
                </button>
            </mat-card-title>
        </mat-card-header>
    <mat-card-content>

        <form [formGroup]="formBaseInformation">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-lg-6 col-12"> 
                        <mat-form-field  class="mat-form-field-100">
                            <mat-label>{{t('docs.field.amount')}}</mat-label>
                            <mat-select formControlName="amount">
                                <mat-option [value]="1">1</mat-option>
                                <mat-option [value]="2">2</mat-option>
                                <mat-option [value]="3">3</mat-option>
                                <mat-option [value]="4">4</mat-option>
                                <mat-option [value]="5">5</mat-option>
                                <mat-option [value]="6">6</mat-option>
                                <mat-option [value]="7">7</mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                    <div class="col-lg-6 col-12"> 
                        <mat-form-field  class="mat-form-field-100">
                            <mat-label>{{t('docs.field.step')}}</mat-label>
                            <mat-select formControlName="step">
                                <mat-option [value]="0">0</mat-option>
                                <mat-option [value]="1">1</mat-option>
                                <mat-option [value]="2">2</mat-option>
                                <mat-option [value]="3">3</mat-option>
                                <mat-option [value]="4">4</mat-option>
                                <mat-option [value]="5">5</mat-option>
                                <mat-option [value]="6">6</mat-option>
                            </mat-select>
                        </mat-form-field>

                    </div>
                    <hr style="display: block; margin: 10px 0 10px 0; border-top: 1px solid rgba(0, 0, 0, .12); width: 100%">
                    <div class="col-12 center">
                        <h4 style="margin-top:10px">{{t('docs.field.presets')}}</h4>
                    </div>
                    <mat-chip-set>
                        <mat-chip (click)="onPresetClick('each_day')">{{t('docs.list.each_day')}}</mat-chip>
                        <mat-chip (click)="onPresetClick('two_two')">{{t('docs.list.two_two')}}</mat-chip>
                        <mat-chip (click)="onPresetClick('three_one')">{{t('docs.list.three_one')}}</mat-chip>
                        <mat-chip (click)="onPresetClick('one_pweek')">{{t('docs.list.one_pweek')}}</mat-chip>
                    </mat-chip-set>
                </div>
            </div>
        </form>
    </mat-card-content>
  `,
  
  styleUrls: ['./employeescdl.component.css'],

})
export class FastSceduleComponent implements OnInit {
    formBaseInformation:any;//форма для основной информации, содержащейся в документе

  constructor(
    public dialogFastScedule: MatDialogRef<FastSceduleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    this.formBaseInformation = new UntypedFormGroup({
        amount:  new UntypedFormControl(1,[]),
        step:    new UntypedFormControl(1,[]),
      });
  }

  onNoClick(): void {
    this.dialogFastScedule.close();
  }

  applySelect(){
    this.dialogFastScedule.close(this.formBaseInformation.value);
  }

  onPresetClick(preset:string){
    switch(preset){
        case 'each_day':{
          this.formBaseInformation.get('amount').setValue(1);
          this.formBaseInformation.get('step').setValue(0);
          break;
        };
        case 'two_two':{
            this.formBaseInformation.get('amount').setValue(2);
            this.formBaseInformation.get('step').setValue(2);
          break;
        };
        case 'three_one':{
            this.formBaseInformation.get('amount').setValue(3);
            this.formBaseInformation.get('step').setValue(1);
          break;
        };
        case 'one_pweek':{
            this.formBaseInformation.get('amount').setValue(1);
            this.formBaseInformation.get('step').setValue(6);
          break;
        };
      }
  }



}
