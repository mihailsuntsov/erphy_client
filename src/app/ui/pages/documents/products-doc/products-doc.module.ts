import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsDocRoutingModule } from './products-doc-routing.module';
import { ProductsDocComponent } from './products-doc.component';
// import { HttpClientModule} from '@angular/common/http';
// import { AngularEditorModule } from '@kolkov/angular-editor';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule/*, FormArray, FormControl, FormGroup, FormBuilder */} from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';
import { QuillModule } from 'ngx-quill';
// import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { LabelsPrintDialogModule } from '../../../../modules/settings/labelprint-dialog/labelprint-dialog.module';
import { ControlMessagesComponent } from './control-messages.component';


@NgModule({
  declarations: [ProductsDocComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    ProductsDocRoutingModule,
    MaterialModule,
    // TemplatesDialogModule,
    LabelsPrintDialogModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule,
    // HttpClientModule,
    // AngularEditorModule
    QuillModule.forRoot(),
    ProductCategoriesSelectModule,
    // FormArray, FormControl, FormGroup, FormBuilder 
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ProductsDocModule { }
