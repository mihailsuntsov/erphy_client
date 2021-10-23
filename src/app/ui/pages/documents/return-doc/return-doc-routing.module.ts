import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnDocComponent } from './return-doc.component';

const routes: Routes = [
  { path: '', component: ReturnDocComponent },
  { path: ':id', component: ReturnDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReturnDocRoutingModule { }
