//1. Здесь определен класс QueryForm, который представляет отправляемые и получаемые данные:
export class ProductHistoryQuery{

    //отправляемые данные
    productId:any;
    companyId:any;
    departmentId:any;
    dateFrom:any;
    dateTo:any;
    sortColumn: string;
    offset: any;
    sortAsc: any;
    result: any;//количество записей на странице
    dockTypesIds: string;//строка с id документов, по которым надо вывести данные (например, по приёмке и оприходованию)

}