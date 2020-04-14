import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from '../pages/about/about.component';
import { ContactsComponent } from '../pages/contacts/contacts.component';
import { HomeComponent } from '../pages/home/home.component';

@NgModule({
  declarations: [
    AboutComponent,
    ContactsComponent,
    HomeComponent
  ],
  imports: [
    CommonModule,
    
  ],
  exports: [
    AboutComponent
  ]
})
export class SharedModule { }
