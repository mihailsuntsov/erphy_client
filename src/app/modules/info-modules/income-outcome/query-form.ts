//1. Здесь определен класс QueryForm, который представляет отправляемые и получаемые данные:
export class QueryForm{
    unit: string; // единица отображения (hour, day, week, month, year, custom)
    dateFrom: string; // дата С
    dateTo: string // дата По
    buyOrSell: string; // продажи или закупки (buy, sell)
    type:string; // тип отчета - по категориям или по товарам/услугам
    ids: number[]; //id-шники категорий или товаров/услуг
}