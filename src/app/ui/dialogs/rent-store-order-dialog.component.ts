import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component , OnInit, Inject} from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { Validators, UntypedFormGroup, UntypedFormControl, FormBuilder} from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++
import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/cdk/stepper';
import { Observable, map } from 'rxjs';

interface Agreement{
    type: string;
    version: string;
    version_date: string;
    name: string;
    text: string;
}

@Component({
    selector: 'deletedialog',
    template:` 
    
    <mat-card class="card for-sticky-header" *transloco="let t" style="height: 100%;">

        <mat-spinner 
        strokeWidth="3" 
        class="spinner"
        [diameter]="50"
        *ngIf="gettingTableData"
        ></mat-spinner>

        <mat-card-title class="top-bar container-fluid"> 
            <div class="row" id="topBlock">
                <div class="card-name">
                    <span>{{t('docs.card.store_ordering')}}</span>
                </div>
            </div>
        </mat-card-title>
        <mat-card-content>


            <mat-stepper
            class="example-stepper"
            [orientation]="(stepperOrientation | async)!">
                <mat-step [stepControl]="firstFormGroup" label="{{t('docs.card.agreement')}}">

                    <form [formGroup]="firstFormGroup">

                        <mat-card class="card for-sticky-header" style="height: 570px; margin-top: 10px;">
                            <mat-card-title class="top-bar container-fluid"> 
                                <div class="row" id="topBlock">
                                    <div class="card-name">
                                        <span>{{agreementName}}</span>
                                    </div>
                                </div>
                            </mat-card-title>
                            <mat-card-content>

                                        <textarea   matInput 
                                                    style="width:100%;"
                                                    [rows]="27"
                                                    [readonly]="true"
                                                    [(ngModel)]="agreementText"
                                                    [ngModelOptions]="{standalone: true}">
                                        </textarea>
                                    
                                        <div style="display:flex; margin-top:20px">
                                            <div style="width:50%">
                                                <mat-checkbox class="example-margin" formControlName="agree" required>{{t('docs.button.i_agree')}}</mat-checkbox>
                                            </div>

                                            <div *ngIf = "firstFormGroup.get('agree').value" style="width:50%">
                                                <button mat-button 
                                                style="background-color:#673ab7; color:white; position: absolute; right: 25px;"
                                                type="button" matStepperNext>{{t('docs.button.order_store')}}!</button>
                                            </div>
                                        </div>
                                    
                                    

                            </mat-card-content>

                        </mat-card>

                    </form>

                </mat-step>
                <mat-step>
                    <ng-template matStepLabel>Done</ng-template>
                    <p>You are now done.</p>
                    <div>
                    <button mat-button matStepperPrevious>Back</button>
                    </div>
                </mat-step>
            </mat-stepper>
        </mat-card-content>
    </mat-card>
    `,
    styles: [` 
    .example-stepper {
        margin-top: 8px;
      }
      
    .mat-mdc-form-field {
    margin-top: 16px;
    }
    `]
  })
  

  export class RentStoreOrderDialog  implements OnInit {

    firstFormGroup = this._formBuilder.group({
        agree: ['', Validators.required],
      });
    
    
    stepperOrientation: Observable<StepperOrientation>;
    agreement: Agreement;
    agreementName: string = '';
    agreementText: string = '';
    gettingTableData = true;

    constructor(
        private _snackBar: MatSnackBar,
        private http:HttpClient, 
        public MessageDialog: MatDialog,
        public dialogRef: MatDialogRef<RentStoreOrderDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _formBuilder: FormBuilder, breakpointObserver: BreakpointObserver
    ) {this.stepperOrientation = breakpointObserver
        .observe('(min-width: 800px)')
        .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
    }
      
    onNoClick(): void {
        this.dialogRef.close();
    }
    
    ngOnInit() {

        //console.log("productId:"+this.data.productId);
        this.getLastVersionAgreement();
    
    }

    getLastVersionAgreement(){ 
        this.gettingTableData = true;   
        this.http.get('/api/auth/getLastVersionAgreement?type=site_hosting')
            .subscribe(
                data => { 

                    switch(data){
                        case null:{
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.error_msg')}});
                          break;
                        }
                        default:{
                          this.agreement     = data as Agreement; 
                          this.agreementName = this.agreement.name;
                          this.agreementText = this.agreement.text;
                          break;
                        }
                    }
                    this.gettingTableData = false;                    
                },
                error => {this.gettingTableData = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
            );
      }

    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
          duration: 3000,
        });
    } 


  }
  