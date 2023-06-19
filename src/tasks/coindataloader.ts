import { CoinData } from "../modules/interfaces";
import { COIN_DATA_LOAD_STAGGER_PERIOD, COIN_DATA_PAGES, STOR_COIN_DATA, THROTTLING_WAIT_PERIOD } from "../modules/settings";
import { getFromStorage, getJSON, setToStorage, sleep } from "../modules/utils";

// Grabs coin data from CoinGecko
export async function loadCoinData() {
    let coinData: Map<string, CoinData> = await getCoinData()

    // Load multiple pages of data, waiting in between
    for (var i = 0; i < COIN_DATA_PAGES; i++) {
        let rawData = await loadDataPage(i+1)
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
        await sleep(COIN_DATA_LOAD_STAGGER_PERIOD)
    }
}

var throttlingWaitTil = 0

async function loadDataPage(i: number): Promise<CoinData[]> {
    if (throttlingWaitTil > Date.now()) {
        console.log("Waiting to call API, throttling period.")
        return []
    }

    console.log("Loading coin data from CoinGecko. Loading page " + i)
    let response = await getJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=${i}&sparkline=false&locale=en`)

    if (response == "429") {
        throttlingWaitTil = Date.now() + THROTTLING_WAIT_PERIOD
        console.log("Coin Gecko throttled API call. Waiting for seconds: " + (THROTTLING_WAIT_PERIOD/1000))
        return []
    } else {
        let coinDataRaw: CoinData[] = JSON.parse(response)
        return coinDataRaw
    }
}

export async function getCoinData(): Promise<Map<string, CoinData>> {
    try {
        let storedCoinDataJson = await getFromStorage(STOR_COIN_DATA)
        let coinDataMap: Map<string, CoinData> = new Map(JSON.parse(storedCoinDataJson))

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