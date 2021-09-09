import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnsupDockComponent } from './returnsup-dock.component';

const routes: Routes = [
  { path: '', component: ReturnsupDockComponent },
  { path: ':id', component: ReturnsupDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReturnsupDockRoutingModule { }