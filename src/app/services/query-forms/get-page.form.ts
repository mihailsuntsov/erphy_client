//1. Здесь определен класс QueryForm, который представляет отправляемые и получаемые данные:
export class GetPageForm{

    // отправляемые данные
    domain: string;
    uid: string;
    route_id: number;
    parameter: string;

    //получаемые данные
    htmlPage: string [];

}