import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DepartmentsDocComponent } from './departments-doc.component';

const routes: Routes = [
  { path: '', component: DepartmentsDocComponent },
  { path: ':id', component: DepartmentsDocComponent },
  
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DepartmentsDocRoutingModule { }
