import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FilesDocComponent } from './files-doc.component';

const routes: Routes = [
  { path: '', component: FilesDocComponent },
  { path: ':id', component: FilesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FilesDocRoutingModule { }
