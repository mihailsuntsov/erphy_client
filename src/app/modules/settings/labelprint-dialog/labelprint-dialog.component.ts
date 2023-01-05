import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, UntypedFormArray, Validators, UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from '../../../services/loadsprav';
// import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
// import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { translate } from '@ngneat/transloco'; //+++

export interface IdAndName {
  id: number;
  name:string;
}

@Component({
  selector: 'app-labelprint-dialog',
  templateUrl: './labelprint-dialog.component.html',
  styleUrls: ['./labelprint-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class LabelsPrintDialogComponent implements OnInit {

  gettingData: boolean=false;
  // company_id: number;  // id предприятия
  // productIds: number[] = [];
  priceTypesList:any[] = [];
  trackByIndex = (i) => i;
  displayedColumns: string[] = ['product_name','labels_quantity'];
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе

  constructor(
    private fb: UntypedFormBuilder,
    private http: HttpClient,
    public LabelsPrintDialog: MatDialogRef<LabelsPrintDialogComponent>,
    public MessageDialog: MatDialog,
    public dialogAddFiles: MatDialog,
    // private _snackBar: MatSnackBar,
    // public ConfirmDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.LabelsPrintDialog.close();
    }
  
  ngOnInit(): void {

    this.formBaseInformation = new UntypedFormGroup({
      company_id:               new UntypedFormControl        (this.data.company_id, [Validators.required]),
      pricetype_id:             new UntypedFormControl        (null,[Validators.required]),
      num_labels_in_row:        new UntypedFormControl        (this.data.num_labels_in_row,[Validators.required]),
      file_name:                new UntypedFormControl        (this.data.file_name,[Validators.required]),
      labelsPrintProductsList:  new UntypedFormArray          ([]) ,
    });

    this.getPriceTypesList();
    this.fillLabelsPrintArray(this.data.products);
  }

  getPriceTypesList(){
    this.gettingData=true;
    this.http.get('/api/auth/getPriceTypesList?companyId='+this.data.company_id).subscribe
    (
      data => 
      {         
        this.priceTypesList=data as any[];
        this.gettingData=false;
        this.getDefaultPriceTypeId();
      },
      error => {console.log(error);this.gettingData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
    );
  }

  getDefaultPriceTypeId(){
    this.priceTypesList.forEach(priceType=>{
      if(priceType.is_default) 
        this.formBaseInformation.get('pricetype_id').setValue(priceType.id);
    });
  }

  fillLabelsPrintArray(arr: IdAndName[]){
    const add = this.formBaseInformation.get('labelsPrintProductsList') as UntypedFormArray;
    add.clear();
    arr.forEach(m =>{
      // alert("id - " + m.id + ", name - " + m.name )
      add.push(this.fb.group({
        product_id:           new UntypedFormControl (m.id,[Validators.required]),
        product_name:         new UntypedFormControl (m.name,[]),
        labels_quantity:      new UntypedFormControl (1,[Validators.required, Validators.max(1000)]),
      }))
    })
  }

  printLabels(){
    const baseUrl = '/api/auth/labelsPrint';
    this.http.post(baseUrl, this.formBaseInformation.value, 
                  { responseType: 'blob' as 'json', withCredentials: false}).subscribe(
      (response: any) =>{
          let dataType = response.type;
          let binaryData = [];
          binaryData.push(response);
          let downloadLink = document.createElement('a');
          downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
          downloadLink.setAttribute('download', 'labels.xls');
          document.body.appendChild(downloadLink);
          downloadLink.click();
      }, 
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    ); 
  }

  // printLabels(){
  //   const baseUrl = '/api/auth/labelsPrint/';
  //   this.http.get(baseUrl+ 
  //                 // "?file_name="+template.file_name+
  //                 "?file_name=94ca2b16-dc1-2023-01-02-12-51-33-559.xls"+
  //                 "&doc_id="+this.id,
  //                 // "&tt_id="+template.template_type_id,
  //                 { responseType: 'blob' as 'json', withCredentials: false}).subscribe(
  //     (response: any) =>{
  //         let dataType = response.type;
  //         let binaryData = [];
  //         binaryData.push(response);
  //         let downloadLink = document.createElement('a');
  //         downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
  //         // downloadLink.setAttribute('download', template.file_original_name);
          
  //         downloadLink.setAttribute('download', "94ca2b16-dc1-2023-01-02-12-51-33-559.xls");
  //         document.body.appendChild(downloadLink);
  //         downloadLink.click();
  //     }, 
  //     error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
  //   ); 
  // }
  // openSnackBar(message: string, action: string) {
  //   this._snackBar.open(message, action, {
  //     duration: 3000,
  //   });
  // }

  getControlTablefield(){
    const control = <UntypedFormArray>this.formBaseInformation.get('labelsPrintProductsList');
    return control;
  }
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && ((charCode < 48 || charCode > 57))) { return false; } return true;}
}
