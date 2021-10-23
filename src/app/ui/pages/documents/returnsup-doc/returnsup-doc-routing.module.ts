import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnsupDocComponent } from './returnsup-doc.component';

const routes: Routes = [
  { path: '', component: ReturnsupDocComponent },
  { path: ':id', component: ReturnsupDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReturnsupDocRoutingModule { }