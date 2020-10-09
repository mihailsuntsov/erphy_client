//1. Здесь определен класс QueryForm, который представляет отправляемые и получаемые данные:
export class QueryForm{

    // отправляемые данные
    searchString: string;
    sortColumn: string;
    offset: any;
    sortAsc: any;
    result: any;
    companyId:any;
    departmentId:any;
    searchCategoryString:any;

    //получаемые данные
    htmlPagination: string [];

}