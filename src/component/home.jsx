import { useEffect, useState } from 'react';
import {
    Grid,
    Row,
    Col,
    DateRangePicker,
    Loader,
    Placeholder,
    Button,
    Slider,
    InputNumber,
    Table,
    Progress
} from 'rsuite';
import ArrowUpIcon from '@rsuite/icons/ArrowUp';
import ArrowDownIcon from '@rsuite/icons/ArrowDown';
import SortUpIcon from '@rsuite/icons/SortUp';
import SortDownIcon from '@rsuite/icons/SortDown';
import * as allStockSymbolImport from '../data/all-stock-symbol.json';
import * as apiKeys from '../data/api-key.json';
import Dexie from 'dexie';


const Home = () => {
    // //define state variables and set state variables all stock symbol
    const db = new Dexie("stock-analysis");
    //create database store
    db.version(1).stores({
        stocks: "stock,data"
    });
    db.open().catch((err) => {
        console.log("Error while creating indexedDB", err.stack || err)
    })

    const [stockSymbols, setStockSymbols] = useState([]);
    const [dateRange, setDateRange] = useState([
        new Date(),
        new Date(new Date().setMonth(new Date().getMonth() + 1))
    ]);
    const [startDatesRange, setStartDatesRange] = useState([]);
    const [endDatesRange, setEndDatesRange] = useState([]);
    const [profit, setProfit] = useState(0);
    const [finalResult, setFinalResult] = useState([]);
    const [rangeYearWiseHistoryData, setRangeYearWiseHistoryData] = useState([]);
    const [isLoaderShow, setIsLoaderShow] = useState(false);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [sortColumn, setSortColumn] = useState();
    const [sortType, setSortType] = useState();

    let apiKeyCount = 0;
    let stockAnalysisCount = 0;

    //call nseindia and get all F&O stock symbols
    const getStockSymbols = async () => {
        setStockSymbols(allStockSymbolImport);
    }

    useEffect(() => {
        getStockSymbols();
        apiKeyCount = 0;
        stockAnalysisCount = 0;
        //get last updated date from local storage
        const lastUpdatedDate = localStorage.getItem('lastUpdatedDate');
        if (!lastUpdatedDate) {
            localStorage.setItem('lastUpdatedDate', new Date().toLocaleDateString());
        }
        const currentDate = new Date();
        if (lastUpdatedDate && (currentDate.getTime() - lastUpdatedDate) > 604800000) {
            localStorage.clear();
            localStorage.setItem('lastUpdatedDate', currentDate.getTime());
        }
    }, [])

    const getResults = () => {
        setFinalResult([]);
        let startDate = dateRange[0];
        let endDate = dateRange[1];
        let startDateArray = [];
        let endDateArray = [];
        for (let i = 0; i < 15; i++) {
            let today = new Date();
            if (startDate >= today || endDate >= today) {
                i--;
                startDate = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
                endDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
            } else {
                startDateArray.push(new Date(startDate.getFullYear() - i, startDate.getMonth(), startDate.getDate()));
                endDateArray.push(new Date(endDate.getFullYear() - i, endDate.getMonth(), endDate.getDate()));
            }
        }
        setStartDatesRange(startDateArray); setEndDatesRange(endDateArray);
        getStockWiseAnalysis(allStockSymbolImport.default[0], startDateArray, endDateArray, apiKeys.default[0]);
    }

    const getStockWiseAnalysis = async (stock, startDateArray, endDateArray, apiKey) => {
        let data = null;
        const stockData = await db.stocks.get(stock.scrip_id);
        if (stockData) {
            data = stockData.data;
            //check if note or error is present in response
            if (data.Note || data["Error Message"]) {
                if (apiKeyCount < apiKeys.default.length) {
                    apiKeyCount++;
                } else {
                    apiKeyCount = 0;
                }

                if (stockAnalysisCount < allStockSymbolImport.default.length) {
                    stockAnalysisCount++;
                    let progress = (stockAnalysisCount / allStockSymbolImport.default.length) * 100;
                    progress = Math.round(progress * 100) / 100;
                    setProgressPercentage(progress);
                    
                    let nextStock = allStockSymbolImport.default[stockAnalysisCount];
                    let nextStockData = await db.stocks.get(nextStock.scrip_id);
                    if (nextStockData) {
                        getStockWiseAnalysis(allStockSymbolImport.default[stockAnalysisCount], startDateArray, endDateArray, apiKeys.default[apiKeyCount]);
                    } else {
                        setTimeout(() => {
                            getStockWiseAnalysis(allStockSymbolImport.default[stockAnalysisCount], startDateArray, endDateArray, apiKeys.default[apiKeyCount]);
                        }, 10000);
                    }
                }
            }
        } else {
            let APIUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${stock.scrip_id}.BSE&outputsize=full&apikey=${apiKey}`;
            const response = await fetch(APIUrl);
            data = await response.json();
            //check if note or error is present in response
            if (data.Note || data["Error Message"]) {
                if (apiKeyCount < apiKeys.default.length) {
                    apiKeyCount++;
                } else {
                    apiKeyCount = 0;
                }

                if (stockAnalysisCount < allStockSymbolImport.default.length) {
                    stockAnalysisCount++;
                    let progress = (stockAnalysisCount / allStockSymbolImport.default.length) * 100;
                    progress = Math.round(progress * 100) / 100;
                    setProgressPercentage(progress);
                    //set timeout for 12 sec

                    //next stock analysis
                    let nextStock = allStockSymbolImport.default[stockAnalysisCount];
                    let nextStockData = await db.stocks.get(nextStock.scrip_id);
                    if (nextStockData) {
                        getStockWiseAnalysis(allStockSymbolImport.default[stockAnalysisCount], startDateArray, endDateArray, apiKeys.default[apiKeyCount]);
                    } else {
                        setTimeout(() => {
                            getStockWiseAnalysis(allStockSymbolImport.default[stockAnalysisCount], startDateArray, endDateArray, apiKeys.default[apiKeyCount]);
                        }, 10000);
                    }
                }
            }
            db.stocks.add({ stock: stock.scrip_id, data: data });
        }
        let stockHistoryDataObject = data['Time Series (Daily)']
        /*
        Start Data Analysis
        */
        let startDateFindResults = [];
        for (let i = 0; i < startDateArray.length; i++) {
            let selectedDate = startDateArray[i];
            let selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
            let stockHistoryDataObjectKeys = Object.keys(stockHistoryDataObject);
            if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                startDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
            }
            else {
                selectedDate.setDate(selectedDate.getDate() + 1);
                selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
                if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                    startDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
                }
                else {
                    selectedDate.setDate(selectedDate.getDate() + 1);
                    selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
                    if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                        startDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
                    }
                    else {
                        selectedDate.setDate(selectedDate.getDate() + 1);
                        selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
                        if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                            startDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
                        } else {
                            selectedDate.setDate(selectedDate.getDate() + 1);
                            selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
                            if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                                startDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
                            }
                            else {
                                startDateFindResults.push({ key: selectedDateStr, data: null });
                            }
                        }
                    }
                }
            }
        }


        /*
        End Date Analysis
        */
        let endDateFindResults = [];
        for (let i = 0; i < endDateArray.length; i++) {
            let selectedDate = endDateArray[i];
            let selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
            let stockHistoryDataObjectKeys = Object.keys(stockHistoryDataObject);
            if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                endDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
            } else {
                //add one day in selected date and check again
                selectedDate.setDate(selectedDate.getDate() + 1);
                selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1) + "-" + selectedDate.getDate();
                if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                    endDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
                } else {
                    //add one day in selected date and check again
                    selectedDate.setDate(selectedDate.getDate() + 1);
                    selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
                    if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                        endDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
                    } else {
                        //add one day in selected date and check again
                        selectedDate.setDate(selectedDate.getDate() + 1);
                        selectedDateStr = selectedDate.getFullYear() + "-" + (selectedDate.getMonth() + 1 < 10 ? "0" + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1) + "-" + (selectedDate.getDate() < 10 ? "0" + selectedDate.getDate() : selectedDate.getDate());
                        if (stockHistoryDataObjectKeys.includes(selectedDateStr)) {
                            endDateFindResults.push({ key: selectedDateStr, data: stockHistoryDataObject[selectedDateStr] });
                        }
                        else {
                            endDateFindResults.push({ key: selectedDateStr, data: null });
                        }
                    }
                }
            }
        }

        let startEndRatio = [];
        for (let i = 0; i < 10; i++) {
            let startDate = startDateFindResults[i];
            let endDate = endDateFindResults[i];
            if (startDate.data && endDate.data) {
                let startDateClose = parseFloat(startDate.data['5. adjusted close']);
                let endDateClose = parseFloat(endDate.data['5. adjusted close']);
                let ratio = ((endDateClose / startDateClose) - 1) * 100; startEndRatio.push({ startDate, endDate, ratio });
            }
            else {
                startEndRatio.push({ startDate, endDate, ratio: null });
            }
        }

        let negativeProfit = -1 * profit;
        let positiveProfit = profit;
        //count negative occurance and positive occurance from startEndRatio conpare with negativeProfit and positive profit 
        let negativeOccurance = 0;
        let positiveOccurance = 0;
        let totalNegativeCount = 0;
        let totalPositiveCount = 0;
        for (let i = 0; i < startEndRatio.length; i++) {
            let ratio = startEndRatio[i].ratio;
            if (ratio < negativeProfit) {
                negativeOccurance++;
            } else if (ratio > positiveProfit) {
                positiveOccurance++;
            }
            if (ratio < 0) {
                totalNegativeCount++;
            }
            else if (ratio > 0) {
                totalPositiveCount++;
            }
        }
        let result = {
            stock_name: stock.Scrip_Name,
            stock_id: stock.scrip_id,
            startDateRangeResults: startDateFindResults,
            endDateRangeResults: endDateFindResults,
            startEndRatio: startEndRatio,
            negativeOccurance: negativeOccurance,
            positiveOccurance: positiveOccurance,
            totalNegativeCount: totalNegativeCount,
            totalPositiveCount: totalPositiveCount,
            totalEvents: totalNegativeCount + totalPositiveCount,
            negativePercentage: (totalNegativeCount / (totalNegativeCount + totalPositiveCount)) * 100,
            positivePercentage: (totalPositiveCount / (totalNegativeCount + totalPositiveCount)) * 100,
            probabilityOfUpMove: (positiveOccurance / (totalNegativeCount + totalPositiveCount)) * 100,
            probabilityOfDownMove: (negativeOccurance / (totalNegativeCount + totalPositiveCount)) * 100,
            standardDeviationRisk: standardDeviation(startEndRatio.map(x => x.ratio)),
            avarageReturn: average(startEndRatio.map(x => x.ratio)),
            standardAverageReturn: totalNegativeCount + totalPositiveCount > 7 ? (average(startEndRatio.map(x => x.ratio)) / standardDeviation(startEndRatio.map(x => x.ratio))) * 100 : 0

        }

        //push result to result array
        finalResult.push(result);
        setFinalResult(finalResult);

        setIsLoaderShow(false);

        if (apiKeyCount < apiKeys.default.length) {
            apiKeyCount++;
        } else {
            apiKeyCount = 0;
        }

        if (stockAnalysisCount < allStockSymbolImport.default.length) {
            stockAnalysisCount++;
            let progress = (stockAnalysisCount / allStockSymbolImport.default.length) * 100;
            progress = Math.round(progress * 100) / 100;
            setProgressPercentage(progress);
            //set timeout for 12 sec

            //next stock analysis
            let nextStock = allStockSymbolImport.default[stockAnalysisCount];
            if (nextStock) {
                let nextStockData = await db.stocks.get(nextStock.scrip_id);
                if (nextStockData) {
                    getStockWiseAnalysis(allStockSymbolImport.default[stockAnalysisCount], startDateArray, endDateArray, apiKeys.default[apiKeyCount]);
                } else {
                    setTimeout(() => {
                        getStockWiseAnalysis(allStockSymbolImport.default[stockAnalysisCount], startDateArray, endDateArray, apiKeys.default[apiKeyCount]);
                    }, 10000);
                }
            }
        }
    }

    const sortData = () => {
        if (sortColumn && sortType) {
            return finalResult.sort((a, b) => {
                let x = a[sortColumn];
                let y = b[sortColumn];
                if (typeof x === 'string') {
                    x = x.charCodeAt();
                }
                if (typeof y === 'string') {
                    y = y.charCodeAt();
                }
                if (sortType === 'asc') {
                    return x - y;
                } else {
                    return y - x;
                }
            });
        }
        return finalResult;
    };

    const handleSortColumn = (sortColumn, sortType) => {
        setTimeout(() => {
            setSortColumn(sortColumn);
            setSortType(sortType);
        }, 500);
    };

    const standardDeviation = (values) => {
        const avg = average(values);

        const squareDiffs = values.map((value) => {
            const diff = value - avg;
            const sqrDiff = diff * diff;
            return sqrDiff;
        });

        const avgSquareDiff = average(squareDiffs);

        const stdDev = Math.sqrt(avgSquareDiff);
        return stdDev;
    }

    const average = (data) => {
        const sum = data.reduce((sum, value) => {
            return sum + value;
        }, 0);

        const avg = sum / data.length;
        return avg;
    }

    const defaultColumns = [
        {
            key: 'stock_name',
            label: 'Name',
            width: 200
        },
        {
            key: 'stock_id',
            label: 'ID'
        },
        {
            key: 'negativeOccurance',
            label: 'Negative Count < - Profit',
            width: 200
        },
        {
            key: 'positiveOccurance',
            label: 'Positive Count > + Profit',
            width: 200
        },
        {
            key: 'totalNegativeCount',
            label: 'Total Negative',
            width: 100
        },
        {
            key: 'totalPositiveCount',
            label: 'Total Positive',
            width: 100
        },
        {
            key: 'totalEvents',
            label: 'Total Events'
        },
        {
            key: 'negativePercentage',
            label: 'Negative %',
            width: 200
        },
        {
            key: 'positivePercentage',
            label: 'Positive %',
            width: 200
        },
        {
            key: 'probabilityOfUpMove',
            label: 'Probability of Up Move',
            width: 200
        },
        {
            key: 'probabilityOfDownMove',
            label: 'Probability of Down Move',
            width: 200
        },
        {
            key: 'standardDeviationRisk',
            label: 'Standard Deviation Risk',
            width: 200
        },
        {
            key: 'avarageReturn',
            label: 'Avarage Return',
            width: 200
        },
        {
            key: 'standardAverageReturn',
            label: 'Standard Average Return',
            width: 200
        }
    ];

    const { Column, HeaderCell, Cell } = Table;
    const { beforeToday } = DateRangePicker;

    const status = progressPercentage === 100 ? 'success' : null;
    const color = progressPercentage === 100 ? '#52c41a' : '#3385ff';

    return (
        <div>
            <Grid fluid>
                <Row className="show-grid">
                    <Col xs={24} sm={24} md={24}>
                        <p> <b>Select Date Range which you want to analysis </b></p>
                        <DateRangePicker
                            size="lg"
                            format="dd-MM-yyyy"
                            block
                            disabledDate={beforeToday()}
                            appearance="default"
                            placeholder="Select Date Range"
                            defaultValue={dateRange}
                            defaultCalendarValue={dateRange}
                            onChange={
                                (e) => setDateRange(e)
                            } >
                        </DateRangePicker>
                    </ Col>
                    <Col xs={16} sm={16} md={16} style={{
                        paddingTop: "14px"
                    }}>
                        <p> <b>Set Profit Ratio</b> </p>
                        <Slider progress style={{ marginTop: 16 }
                        } value={profit} onChange={value => {
                            setProfit(value);
                        }
                        }
                        /> </Col>
                    <Col xs={8} sm={8} md={8}
                        style={{ paddingTop: "33px" }
                        }>
                        <InputNumber min={0} max={
                            100} value={profit}
                            onChange={value => {
                                setProfit(value);
                            }
                            }
                        /> </Col>

                    <Col xs={24} sm={24
                    } md={24} style={
                        {
                            paddingTop: "14px"
                        }}>
                        <Button
                            appearance="primary"
                            block onClick={
                                () => {
                                    setIsLoaderShow(true)
                                    getResults()
                                }
                            } >
                            Get Analyis
                            Results </Button>
                    </Col>
                </Row>
            </Grid>
            <div className='pt-3'>
                <Row>  <Col xs={8} sm={8} md={8}>
                    <p align="justify">Below Progress showing you have only that percentage analysis has been done. if you loading at
                        first time then it will take a time around to 15 minutes.</p>
                </Col>
                    <Col xs={16} sm={16} md={16}>
                        <Progress.Line percent={progressPercentage} strokeColor={color} status={status} />
                    </Col>
                </Row>
            </div>


            <Table
                data={sortData()}
                sortColumn={sortColumn}
                sortType={sortType}
                onSortColumn={handleSortColumn}
                height={400}
            >
                {defaultColumns.map(column => {
                    const { key, label, width, ...rest } = column;
                    return (
                        <Column {...rest} key={key} sortable fixed={key === "stock_name" ? true : false} width={width}>
                            <HeaderCell>{label}</HeaderCell>
                            {
                                //if key is totalPositiveCount then show the value in green color with up arrow if value is above 7 or higher
                                key === 'totalPositiveCount' ?
                                    <Cell dataKey={key}>
                                        {rowData => {
                                            return (
                                                <span style={{ color: rowData[key] >= 7 ? '#52c41a' : '#3385ff' }}>
                                                    {rowData[key]} {rowData[key] >= 7 ? <ArrowUpIcon></ArrowUpIcon> : null}
                                                </span>
                                            );
                                        }
                                        }
                                    </Cell>
                                    : key === 'totalNegativeCount' ?
                                        <Cell dataKey={key}>
                                            {rowData => {
                                                return (
                                                    <span style={{ color: rowData[key] >= 7 ? '#ff4d4f' : '#3385ff' }}>
                                                        {rowData[key]} {rowData[key] >= 7 ? <ArrowDownIcon></ArrowDownIcon> : null}
                                                    </span>
                                                );
                                            }
                                            }
                                        </Cell>

                                        :
                                        //set process for negativePercentage and set progress bar with color
                                        key === 'negativePercentage' ?
                                            <Cell dataKey={key}>
                                                {rowData => {
                                                    return (
                                                        <div>
                                                            <Progress.Line percent={rowData[key]} strokeColor="#ff4d4f" status="active" />
                                                        </div>
                                                    );
                                                }
                                                }
                                            </Cell>
                                            //set process for positivePercentage and set progress bar with color
                                            : key === 'positivePercentage' ?

                                                <Cell dataKey={key}>
                                                    {rowData => {
                                                        return (
                                                            <div>
                                                                <Progress.Line percent={rowData[key]} strokeColor="#52c41a" status="active" />
                                                            </div>
                                                        );
                                                    }
                                                    }
                                                </Cell>


                                                :
                                                //if probabilityOfUpMove then show shortup arraw with color
                                                key === 'probabilityOfUpMove' ?

                                                    <Cell dataKey={key}>
                                                        {rowData => {
                                                            return (
                                                                <span style={{ color: rowData[key] > 0 ? '#52c41a' : '#3385ff' }}>
                                                                    {rowData[key].toFixed(2)} {rowData[key] > 0 ? <SortUpIcon></SortUpIcon> : null}
                                                                </span>
                                                            );
                                                        }
                                                        }
                                                    </Cell>
                                                    :
                                                    //if probabilityOfDownMove then show shortdown arraw with color
                                                    key === 'probabilityOfDownMove' ?

                                                        <Cell dataKey={key}>
                                                            {rowData => {
                                                                return (
                                                                    <span style={{ color: rowData[key] > 0 ? '#ff4d4f' : '#3385ff' }}>
                                                                        {rowData[key].toFixed(2)} {rowData[key] > 0 ? <SortDownIcon></SortDownIcon> : null}
                                                                    </span>
                                                                );
                                                            }
                                                            }
                                                        </Cell>
                                                        :
                                                        //if averageReturn is positive then show the value in green color if negative then show in red color
                                                        key === 'avarageReturn' ?

                                                            <Cell dataKey={key}>
                                                                {rowData => {
                                                                    return (
                                                                        <span style={{ color: rowData[key] > 0 ? '#52c41a' : '#ff4d4f' }}>
                                                                            {rowData[key].toFixed(2)}
                                                                        </span>
                                                                    );
                                                                }
                                                                }
                                                            </Cell>
                                                            :
                                                            key === 'standardDeviationRisk' || key === 'standardAverageReturn' ?
                                                                <Cell dataKey={key}>
                                                                    {rowData => {
                                                                        return (
                                                                            <span>
                                                                                {rowData[key].toFixed(2)}
                                                                            </span>
                                                                        );
                                                                    }
                                                                    }
                                                                </Cell>
                                                                :
                                                                <Cell dataKey={key} >
                                                                </Cell>

                            }

                        </Column>
                    );
                })}
            </Table>
            {
                isLoaderShow ? <div>
                    <Placeholder.Paragraph rows={8} />
                    <Loader size="lg" backdrop content="Analysis is in progress Please wait for a moment...." vertical />
                </div> : null
            }

        </div>

    )
}
export default Home;