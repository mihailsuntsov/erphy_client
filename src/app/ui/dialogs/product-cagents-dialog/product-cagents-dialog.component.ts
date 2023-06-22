import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

@Component({
  selector: 'app-product-cagents-dialog',
  templateUrl: './product-cagents-dialog.component.html',
  styleUrls: ['./product-cagents-dialog.component.css']
})
export class ProductCagentsDialogComponent implements OnInit {

  formBaseInformation:any;//форма для основной информации, содержащейся в документе


  constructor(public dialogRef: MatDialogRef<ProductCagentsDialogComponent>,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    public MessageDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
  onNoClick(): void {
    this.dialogRef.close();}

  ngOnInit() {

    console.log("cagentId:"+this.data.cagentId);
    console.log("cagentArticle:"+this.data.cagentArticle);
    console.log("cagentAdditional:"+this.data.cagentAdditional);
    
    this.formBaseInformation = new UntypedFormGroup({
      cagentArticle: new UntypedFormControl(this.data.cagentArticle,[]),// артикул товара у поставщика
      cagentAdditional: new UntypedFormControl(this.data.cagentAdditional,[]),// примечание (дополнительная информация)
      docName: new UntypedFormControl(this.data.docName,[]),// 
    });
  }
  
  updateProductCagentProperties(){
    const body = {"id1":+this.data.cagentId,
                  "id2":+this.data.productId,
                  "string1":this.formBaseInformation.get('cagentArticle').value,
                  "string2":this.formBaseInformation.get('cagentAdditional').value};
    return this.http.post('/api/auth/updateProductCagentProperties', body)
            .subscribe(
                (data) => {   
                            this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
                            this.dialogRef.close();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }  




}
