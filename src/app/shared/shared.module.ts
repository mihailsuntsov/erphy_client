import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from '../pages/about/about.component';
import { ContactsComponent } from '../pages/contacts/contacts.component';
import { HomeComponent } from '../pages/home/home.component';
// import { EmbeddableComponent } from '../embeddable-components/example.component'
import { ContentViewer, EmbeddedComponents, embeddedComponents } from '../dynamic-content-viewer/dynamic-content-viewer';

@NgModule({
  declarations: [
    AboutComponent,
    ContactsComponent,
    HomeComponent,
    // EmbeddableComponent,  
    ContentViewer,  
  ],
  imports: [
    CommonModule,
    
  ],
  exports: [
    AboutComponent
  ],
  providers: [EmbeddedComponents],
  entryComponents: [embeddedComponents],
})
export class SharedModule { }
