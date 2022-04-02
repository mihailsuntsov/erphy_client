import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesDocRoutingModule } from './files-doc-routing.module';
import { FilesDocComponent } from './files-doc.component';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [FilesDocComponent],
  imports: [
    CommonModule,
    FilesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslocoModule
    
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class FilesDocModule { }
