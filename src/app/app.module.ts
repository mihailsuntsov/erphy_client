import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';

import { ContentViewer, EmbeddedComponents, embeddedComponents } from './dynamic-content-viewer/dynamic-content-viewer';


@NgModule({
  declarations: [
    AppComponent,  ContentViewer, embeddedComponents 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: [EmbeddedComponents],
  bootstrap: [AppComponent],
  entryComponents: [embeddedComponents],
})
export class AppModule { }
