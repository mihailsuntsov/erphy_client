import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, UntypedFormArray, Validators, UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FilesComponent } from 'src/app/ui/pages/documents/files/files.component';
import { FilesDocComponent } from 'src/app/ui/pages/documents/files-doc/files-doc.component';
import { LoadSpravService } from '../../../services/loadsprav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { translate } from '@ngneat/transloco'; //+++

interface TemplatesList{
    id: number;                   // id из таблицы template_docs
    company_id: number;           // id предприятия, для которого эти настройки
    name: string;                 // наименование шаблона. Например, Товарный чек
    file_id: number;              // id из таблицы files
    file_name: string;            // наименование файла как он хранится на диске
    file_original_name: string;   // оригинальное наименование файла
    document_id: number;          // id документа, в котором будет возможность печати данного шаблона (соответствует id в таблице documents)
    is_show: boolean;             // показывать шаблон в выпадающем списке на печать
    output_order: number;         // порядок вывода наименований шаблонов в списке на печать
    type: string;                 // the type of template/ Can be: "document", "label"
    num_labels_in_row: string;    // quantity of labels in the each row
}
interface filesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
}
@Component({
  selector: 'app-templates-dialog',
  templateUrl: './templates-dialog.component.html',
  styleUrls: ['./templates-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class TemplatesDialogComponent implements OnInit {

  gettingData: boolean=false;
  company_id: number;  // id предприятия
  document_id: number; // id документа, в котором будет возможность печати данного шаблона (соответствует id в таблице documents)
  templatesList: TemplatesList[]; // массив для приёма списка уже имеющихся шаблонов для данного document_id (document_id = id из таблицы documents)
  checkedList:any[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
  editability:boolean = true;
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  fileInfo : filesInfo = null; //массив для получения информации по прикрепленным к документу файлам 
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе

  constructor(
    private fb: UntypedFormBuilder,
    private http: HttpClient,
    public TemplatesDialog: MatDialogRef<TemplatesDialogComponent>,
    public MessageDialog: MatDialog,
    public dialogAddFiles: MatDialog,
    private _snackBar: MatSnackBar,
    public ConfirmDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.TemplatesDialog.close();
    }
  
  ngOnInit(): void {
    this.company_id=this.data.company_id;
    this.document_id=this.data.document_id;

    this.formBaseInformation = new UntypedFormGroup({
      company_id:     new UntypedFormControl       (this.data.company_id, [Validators.required]),
      document_id:    new UntypedFormControl       (this.data.document_id,[Validators.required]),
      templatesList:  new UntypedFormArray         ([]) ,
    });

    this.getTemplatesList();
    
  }

  getTemplatesList(){
    let result:TemplatesList[];
    this.gettingData=true;
    this.http.get('/api/auth/getTemplatesList?company_id='+this.company_id+"&document_id="+this.document_id+"&is_show="+false).subscribe
    (
      data => 
      {         
        result=data as TemplatesList[];
        this.fillTemplatesArray(result);
        this.gettingData=false;
      },
      error => {console.log(error);this.gettingData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
    );
  }

  fillTemplatesArray(arr: TemplatesList[]){
    const add = this.formBaseInformation.get('templatesList') as UntypedFormArray;
    add.clear();
    arr.forEach(m =>{
      add.push(this.fb.group({
      id:                   new UntypedFormControl (m.id,[]),
      company_id:           new UntypedFormControl (m.company_id,[Validators.required]),
      document_id:          new UntypedFormControl (m.document_id,[Validators.required]),
      file_id:              new UntypedFormControl (m.file_id,[Validators.required]),
      file_name:            new UntypedFormControl (m.file_name,[]),
      file_original_name:   new UntypedFormControl (m.file_original_name,[Validators.required]),
      is_show:              new UntypedFormControl (m.is_show,[Validators.required]),
      name:                 new UntypedFormControl (m.name,[Validators.required]),
      output_order:         this.getTemplatesOutputOrder(),
      type:                 new UntypedFormControl (m.type,[Validators.required]),
      num_labels_in_row:    new UntypedFormControl (m.num_labels_in_row.toString(),[Validators.required]),
      }))
    })
  }
  getTemplatesOutputOrder(){//генерирует очередность для нового шаблона
    const add = this.formBaseInformation.get('templatesList') as UntypedFormArray; 
    return (add.length+1);
  }

  dropTemplate(event: CdkDragDrop<string[]>) {//отрабатывает при перетаскивании шаблона
    //в массиве типа FormArray нельзя поменять местами элементы через moveItemInArray.
    //поэтому выгрузим их в отдельный массив, там поменяем местами а потом зальём обратно уже с нужным порядком
    let resultContainer: TemplatesList[] = [];
    this.formBaseInformation.get('templatesList').controls.forEach(m =>{
                      resultContainer.push({
                        id: m.get('id').value,
                        company_id:         m.get('company_id').value,
                        document_id:        m.get('document_id').value,
                        file_id:            m.get('file_id').value,
                        file_name:          m.get('file_name').value,
                        file_original_name: m.get('file_original_name').value,
                        is_show:            m.get('is_show').value,
                        name:               m.get('name').value,
                        output_order:       m.get('output_order').value,
                        type:               m.get('type').value,
                        num_labels_in_row:  m.get('num_labels_in_row').value
                      })
                    });
    moveItemInArray(resultContainer, event.previousIndex, event.currentIndex);
    this.fillTemplatesArray(resultContainer);
    this.setTemplatesOutputOrders();//после того как переставили шаблоны местами - нужно обновить их очередность вывода (output_order)
  }

  setTemplatesOutputOrders(){//заново переустанавливает очередность у всех шаблонов (при перетаскивании)
    let i:number=1;
    this.formBaseInformation.get('templatesList').controls.forEach(m =>{
      m.get('output_order').setValue(i);
      i++;
    });
  }

  addNewTemplate() {
    const add = this.formBaseInformation.get('templatesList') as UntypedFormArray;
    add.push(this.fb.group({
      id:                   new UntypedFormControl (null,[]),
      company_id:           new UntypedFormControl (this.company_id,[Validators.required]),
      document_id:          new UntypedFormControl (this.document_id,[Validators.required]),
      file_id:              new UntypedFormControl ('',[Validators.required]),
      file_name:            new UntypedFormControl ('',[]),
      file_original_name:   new UntypedFormControl ('',[Validators.required]),
      is_show:              new UntypedFormControl (true,[Validators.required]),
      name:                 new UntypedFormControl ('',[Validators.required]),
      output_order:         this.getTemplatesOutputOrder(),
      type:                 new UntypedFormControl ('document',[Validators.required]),
      num_labels_in_row:    new UntypedFormControl ('1',[Validators.required]),
    }))
  }

  deleteTemplate(index: number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_acc_t'),
        query: translate('docs.msg.del_acc_t_q'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const add = this.formBaseInformation.get('templatesList') as UntypedFormArray;
        add.removeAt(index);
        this.setTemplatesOutputOrders();
      }
    });  
  }

  applyTemplates(){
    this.http.post('/api/auth/saveTemplates', this.formBaseInformation.getRawValue())
    .subscribe(
        (data) => {
          let result = data as any;
          if(result)
            this.openSnackBar(translate('docs.msg.settngs_saved'), translate('docs.msg.close'));
          else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.save_error')}});
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
    
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  getControlTablefield(){
    const control = <UntypedFormArray>this.formBaseInformation.get('templatesList');
    return control;
  }
//*****************************************************************************************************************************************/
//*******************************************************       Ф  А  Й  Л  Ы       *******************************************************/
//*****************************************************************************************************************************************/
  openFileCard(docId:number) {
    if(+docId>0){
      const dialogRef = this.dialogAddFiles.open(FilesDocComponent, {
        maxWidth: '95vw',
        maxHeight: '95vh',
        height: '95%',
        width: '95%',
        data:
        { 
          mode: 'window',
          docId: docId
        },
      });
    }
    
  }
  // using output_order as a row id, because id of new rows is null
  addFileInField(output_order:number) {
    console.log(`output_order: ${output_order}`);
    const dialogRef = this.dialogAddFiles.open(FilesComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'select',
        companyId: this.company_id
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result){
        this.formBaseInformation.get('templatesList').controls.forEach(m =>{
          if(m.get('output_order').value==output_order){
            m.get('file_id').setValue(result[0]);
            m.get('file_original_name').setValue(translate('docs.msg.file_slctd'));
          }
        });
      };
    });
  }
  // addFileInField(template_id:number) {
  //   const dialogRef = this.dialogAddFiles.open(FilesComponent, {
  //     maxWidth: '95vw',
  //     maxHeight: '95vh',
  //     height: '95%',
  //     width: '95%',
  //     data:
  //     { 
  //       mode: 'select',
  //       companyId: this.company_id
  //     },
  //   });
  //   dialogRef.afterClosed().subscribe(result => {
  //     console.log(`Dialog result: ${result}`);
  //     if(result){
  //       this.formBaseInformation.get('templatesList').controls.forEach(m =>{
  //         // for rows that is already exists in database and have an id
  //         if(m.get('id').value==template_id){
  //           m.get('file_id').setValue(result[0]);
  //           m.get('file_original_name').setValue(translate('docs.msg.file_slctd'));
  //         }
  //       });
  //     };
  //   });
  // }

  // using output_order as a row id, because the same file id can't be unic, as it can be repeated in many fields
  deleteFileInField(output_order:number) {
    this.formBaseInformation.get('templatesList').controls.forEach(m =>{
      if(m.get('output_order').value==output_order){
        m.get('file_id').setValue(null);
        m.get('file_original_name').setValue("");
      }
    });
  }
  
}
