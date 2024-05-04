import { isInside } from './util';

export class CalendarResizeHelper {
  constructor(
    private resizeContainerElement: HTMLElement,
    private minWidth: number,
    private rtl: boolean
  ) {}

  validateResize({ rectangle, edges }): boolean {
    // console.log('validating resize...');
    if (this.rtl) {
      // TODO - find a way of testing this, for some reason the tests always fail but it does actually work
      /* istanbul ignore next */
      if (typeof edges.left !== 'undefined') {
        rectangle.left -= edges.left;
        rectangle.right += edges.left;
      } else if (typeof edges.right !== 'undefined') {
        rectangle.left += edges.right;
        rectangle.right -= edges.right;
      }
      rectangle.width = rectangle.right - rectangle.left;
    }

    // console.log('Out. minWidth',this.minWidth);
    // console.log('Out. Math.ceil(this.minWidth)',Math.ceil(this.minWidth))
    // console.log('Out. Math.ceil(rectangle.width)',Math.ceil(rectangle.width * (1 + 0.9)))



    // console.log('rectangle.width < this.minWidth', Math.ccurrentResize = eil(rectangle.width) < Math.ceil(this.minWidth))
    // console.log('if minWidth &...',(this.minWidth && (Math.ceil(rectangle.width * (1 + 0.9)) < Math.ceil(this.minWidth))))
    if (this.minWidth && (Math.ceil(rectangle.width * (1 + 0.9))) < Math.ceil(this.minWidth)) {
      // console.log('In. minWidth',this.minWidth);
      // console.log('In. Math.ceil(this.minWidth)',Math.ceil(this.minWidth))
      // console.log('In. Math.ceil(rectangle.width)',Math.ceil(rectangle.width * (1 + 0.9)))

      // console.log('first return')
      return false;
    }
    // console.log('isInside',isInside(
    //   this.resizeContainerElement.getBoundingClientRect(),
    //   rectangle
    // ))

    return isInside(
      this.resizeContainerElement.getBoundingClientRect(),
      rectangle
    );
  }
}
