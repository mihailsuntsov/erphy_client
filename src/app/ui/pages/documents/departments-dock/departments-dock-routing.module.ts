import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DepartmentsDockComponent } from './departments-dock.component';

const routes: Routes = [
  { path: '', component: DepartmentsDockComponent },
  { path: ':id', component: DepartmentsDockComponent },
  
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DepartmentsDockRoutingModule { }
