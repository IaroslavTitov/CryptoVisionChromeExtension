import { CoinData } from "../modules/interfaces";
import { COIN_DATA_LOAD_STAGGER_PERIOD, COIN_DATA_PAGES, STOR_COIN_DATA, STOR_DATA_PAGE_INDEX, STOR_NEXT_LOAD_TIMESTAMP, WAIT_PERIOD } from "../modules/settings";
import { getFromStorage, getJSON, setToStorage } from "../modules/utils";

// Grabs coin data from CoinGecko
export async function loadCoinData(coinData: Map<string, CoinData>): Promise<Map<string, CoinData>> {
    let loadTimestamp = await getFromStorage(STOR_NEXT_LOAD_TIMESTAMP)

    if (loadTimestamp && loadTimestamp > Date.now()) {
        return coinData;
    }

    let dataPageIndex = await getFromStorage(STOR_DATA_PAGE_INDEX)
    if (!dataPageIndex) dataPageIndex = 0

    // Load multiple pages of data, waiting in between
    let rawData = await loadDataPage(dataPageIndex)
    if (rawData.length > 0) {
        rawData.forEach(
            x => {
                let coin: CoinData = {
                    id: x.id,
                    name: x.name,
                    symbol: x.symbol,
                    current_price: x.current_price
                }
                coinData.set(coin.symbol, coin)
            }
        )
    }
    let jsonData = JSON.stringify(Array.from(coinData.entries()))
    await setToStorage(STOR_COIN_DATA, jsonData)

    dataPageIndex+=1
    if (dataPageIndex == COIN_DATA_PAGES) {
        dataPageIndex = 0;
    }
    await setToStorage(STOR_DATA_PAGE_INDEX, dataPageIndex)

    let nextTimestamp = Date.now()
    if (dataPageIndex == 0) {
        nextTimestamp += WAIT_PERIOD
    } else {
        nextTimestamp += COIN_DATA_LOAD_STAGGER_PERIOD
    }
    await setToStorage(STOR_NEXT_LOAD_TIMESTAMP, nextTimestamp)

    return coinData
}

var throttlingWaitTil = 0

async function loadDataPage(i: number): Promise<CoinData[]> {
    if (throttlingWaitTil > Date.now()) {
        console.log("Waiting to call API, throttling period.")
        return []
    }

    console.log("Loading coin data from CoinGecko. Loading page " + i)
    let response = null
    try {
        response = await getJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=${i}&sparkline=false&locale=en`)
        if (response == "429") {
            console.log("Coin Gecko throttled API call. Waiting for seconds: " + (WAIT_PERIOD/1000))
            await setToStorage(STOR_NEXT_LOAD_TIMESTAMP, Date.now() + WAIT_PERIOD)
            return []
        }
        
        let coinDataRaw: CoinData[] = JSON.parse(response)
        console.log("Loaded data successfully!")
        return coinDataRaw
    } catch (e) {
        console.log("Failed to grab data from Coin Gecko. Waiting for seconds: " + (WAIT_PERIOD/1000))
        await setToStorage(STOR_NEXT_LOAD_TIMESTAMP, Date.now() + WAIT_PERIOD)
        return []
    } 
}

export async function getCoinData(): Promise<Map<string, CoinData>> {
    try {
        let storedCoinDataJson = await getFromStorage(STOR_COIN_DATA)
        let coinDataMap: Map<string, CoinData> = new Map()
        if (storedCoinDataJson){
            coinDataMap = new Map(JSON.parse(storedCoinDataJson))
        }

        Array.from(coinDataMap).map(x => console.log(x));

        coinDataMap = await loadCoinData(coinDataMap);

        if (Array.from(coinDataMap.keys()).length == 0) {
            console.log("Failed to load coin data from local storage. Waiting for service worker to sync. This may take up to a couple minutes!")
        }

        return coinDataMap
    }
    catch (e) {
        // if we can't access runtime id, then extension was updated
        if (chrome.runtime?.id) {
            throw e
        }
        console.log("Extension updated to a new version. Reload the page to re-enable Crypto Vision.")
        return new Map()
    }
}