/**
 * Product visit count data for statistics aggregation.
 */
export interface IProductVisitsData {
    idProduct: number;
    visits: number;
}

/**
 * Input for getTopByVisitsForStatistics.
 */
export interface IGetTopByVisitsForStatisticsInput {
    visitData: IProductVisitsData[];
    idBusiness: number;
}
