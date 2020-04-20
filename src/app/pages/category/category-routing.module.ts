import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from '../home/home.component';
import { CategoryComponent } from './category.component';

const routes: Routes = [
  { path: '', redirectTo: '../', pathMatch: 'full',},
  // { path: ''   , component: CategoryComponent},
  { path: ':id', component: CategoryComponent},
  { path: '**' , redirectTo: '../', pathMatch: 'full'},
  { path: '../', component: HomeComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CategoryRoutingModule { }
