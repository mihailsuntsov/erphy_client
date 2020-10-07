//1. Здесь определен класс QueryForm, который представляет отправляемые и получаемые данные:
export class QueryForm{

    // отправляемые данные
    searchString: string;
    sortColumn: string;
    offset: any;
    sortAsc: any;
    result: any;//количество записей на странице
    companyId:any;
    selectedNodeId:any;
    selectedNodeName:any;
    searchCategoryString:any;
    trash:Boolean; //true - показывать файлы в корзине, false - нет
    showOnlyAnonymeAccessFiles:Boolean;//true - показывать только файлы с разрешенным анонимным доступом, false - все файлы

    //departmentId:any;

    //получаемые данные
    arrClients: string [];
    htmlPagination: string [];

}