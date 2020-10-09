//1. Здесь определен класс QueryForm, который представляет отправляемые и получаемые данные:
export class QueryForm{

    // отправляемые данные
    
    companyId:any;
    // departmentId:any;
    // departmentsIdsList: string;
    cagentId: any;
    cagentName:any;
    priceTypeId:any;
    priceTypesIdsList:string;
    searchString: string;
    sortColumn: string;
    offset: any;
    sortAsc: any;
    result: any;//количество записей на странице
    selectedNodeId:any;
    selectedNodeName:any;
    searchCategoryString:any;
    filterOptionsIds: number[];
    
}