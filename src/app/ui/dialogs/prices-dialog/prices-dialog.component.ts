import { Component, OnInit , Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

@Component({
  selector: 'app-prices-dialog',
  templateUrl: './prices-dialog.component.html',
  styleUrls: ['./prices-dialog.component.css']
})
export class PricesDialogComponent implements OnInit {
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  url: string; 

  constructor( public dialogRef: MatDialogRef<PricesDialogComponent>,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    public MessageDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
    onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      price: new UntypedFormControl('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      // warning_quantity: new FormControl('',[]),
    });

  }
  savePrices(){
    this.formBaseInformation.get('price').setValue((this.formBaseInformation.get('price').value).toString().replace(",", "."));
    const body =  {
                    priceValue: this.formBaseInformation.get('price').value,
                    productsIds: this.data.productsIds,
                    productsIdsList: JSON.stringify(this.data.productsIds).replace("[", "").replace("]", ""),
                    companyId: this.data.companyId,
                    priceTypeId: this.data.priceTypeId,
                    priceTypesIds: this.getIds(this.data.priceTypesIds),
                    priceTypesIdsList: JSON.stringify(this.getIds(this.data.priceTypesIds)).replace("[", "").replace("]", ""),
                  };
    return this.http.post('/api/auth/savePrices', body)
    .subscribe(
        (data) => {   
                  this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
                  this.dialogRef.close(1);
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  getIds(mass: any[]):number[]{
    let result:number[]=[];
    mass.forEach(element => {result.push(+element.id);});
    return result;
  };

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
}
