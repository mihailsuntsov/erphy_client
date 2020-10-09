import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AcceptanceDockComponent } from './acceptance-dock.component';

const routes: Routes = [
  { path: '', component: AcceptanceDockComponent },
  { path: ':id', component: AcceptanceDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcceptanceDockRoutingModule { }
