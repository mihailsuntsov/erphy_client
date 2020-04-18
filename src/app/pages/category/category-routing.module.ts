import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CategoryComponent } from './category.component';

const routes: Routes = [
  { path: '', redirectTo: '../', pathMatch: 'full',},
  { path: ':id', component: CategoryComponent},
  { path: '**', redirectTo: '../', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CategoryRoutingModule { }
