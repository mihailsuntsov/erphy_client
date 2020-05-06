import { Component } from '@angular/core'

@Component({
  selector: 'router-outlet-component',
  template: `<router-outlet></router-outlet>`,
})
export class RouterOutletComponent {
  name: string;
  insidecontent: string='';
  ngOnInit(){
    this.name='';

  }
}
