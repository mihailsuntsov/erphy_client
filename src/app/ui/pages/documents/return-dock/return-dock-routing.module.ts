import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnDockComponent } from './return-dock.component';

const routes: Routes = [
  { path: '', component: ReturnDockComponent },
  { path: ':id', component: ReturnDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReturnDockRoutingModule { }
