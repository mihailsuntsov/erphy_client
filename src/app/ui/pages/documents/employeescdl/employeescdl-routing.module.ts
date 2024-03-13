import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeScdlComponent } from './employeescdl.component';

const routes: Routes = [{ path: '', component: EmployeeScdlComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeScdlRoutingModule { }
