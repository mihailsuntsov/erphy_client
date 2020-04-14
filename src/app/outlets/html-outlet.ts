import {NgModule,Component,Directive,Input,ComponentRef,Compiler,ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
  
  @Directive({ selector: 'html-outlet' }) 
  export class HtmlOutlet {
    @Input() html: string;
    cmpRef: ComponentRef<any>;
  
    constructor(private vcRef: ViewContainerRef, private compiler: Compiler) { }
  
    ngOnChanges() {
      const html = this.html;
      if (!html) return;
      
      if(this.cmpRef) {
        this.cmpRef.destroy();
      }
      
      @Component({
        selector: 'dynamic-comp',
        template: html
      })
      class DynamicHtmlComponent  {};
  
       @NgModule({
        imports: [CommonModule ],
        declarations: [DynamicHtmlComponent]
      })
      class DynamicHtmlModule {}
  
      this.compiler.compileModuleAndAllComponentsAsync(DynamicHtmlModule)
        .then(factory => {
          const moduleRef = factory.ngModuleFactory.create(this.vcRef.parentInjector);
          
          const compFactory = factory.componentFactories.find(x => x.componentType === DynamicHtmlComponent);
          const cmpRef = this.vcRef.createComponent(compFactory, 0, moduleRef.injector);
        });
    }
    
    ngOnDestroy() {
      if(this.cmpRef) {
        this.cmpRef.destroy();
      }    
    }
  }