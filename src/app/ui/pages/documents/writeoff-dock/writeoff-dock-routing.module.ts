import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WriteoffDockComponent } from './writeoff-dock.component';

const routes: Routes = [
  { path: '', component: WriteoffDockComponent },
  { path: ':id', component: WriteoffDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WriteoffDockRoutingModule { }
