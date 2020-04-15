import { Component } from '@angular/core'

@Component({
  selector: 'my-component',
  template: `
  
  I am an existing component with name: {{name}} <br />
  projected content: <ng-content></ng-content>
  `,
})
export class EmbeddableComponent {
  name: string;
  ngOnInit(){
    console.log(`EmbeddableComponent.OnInit name=`, this.name)
  }
}
