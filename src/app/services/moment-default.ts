import {default as _rollupMoment} from 'moment';
import * as _moment from 'moment';
export class MomentDefault
{
    static getMomentDefault() {
        const original = _rollupMoment || _moment;
        original.prototype.toJSON = function() {
            return this.format("DD.MM.YYYY");
        }
        return original;
    };

    static getMomentFormat(){
        return ({
            parse: {
              dateInput: 'L',
            },
            display: {
              dateInput: 'L',
              monthYearLabel: 'MMM YYYY',
              dateA11yLabel: 'L',
              monthYearA11yLabel: 'MMMM YYYY',
            },
          })
    }

}
export interface MomentConstructor extends _moment.Moment {}