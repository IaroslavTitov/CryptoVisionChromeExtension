import { generateMasterRegex, toCurrency } from "./modules/utils";
import { getCoinData } from "./tasks/coindataloader";

// Clear cache on install
chrome.runtime.onInstalled.addListener(async (details) => {
    if(details.reason == "install"){
        await chrome.storage.local.clear()
    }
});

// Omnibox logic
let help = "Type in a number and a ticker to convert, for example \"1337 BTC\""
let defaultResult = {
    description: help,
    content: help
}
let error = "Failed to load crypto data. Try again in a few minutes."
let errorResult = {
    description: error,
    content: error
}

chrome.omnibox.onInputChanged.addListener(async (text, callback) => {
    let coinData = await getCoinData()
    if (coinData.size > 0) {
        let masterRegex = generateMasterRegex(coinData);
        let matches = Array.from(text.matchAll(masterRegex))
        console.log(matches)

        if (matches.length > 0 && matches[0]) {
            // Calculate price in fiat
            let match = matches[0]
            console.log(match)
            let usdPrice = ""
            let coinId = ""
            try {
                usdPrice = "$" + toCurrency(coinData.get(match[2].toLowerCase())!!.current_price * Number(match[1].replaceAll(",", "")))
                coinId = coinData.get(match[2].toLowerCase())!!.id
            } catch(e) {
                console.log(`Failed to calculate price of ${match[0]} due to error: ${e}`)
                callback([errorResult])
                return
            }
            callback([{
                description: "= "+usdPrice,
                content:"https://www.coingecko.com/en/coins/" + coinId
            }])
        } else {
            callback([defaultResult])
        }
    } else {
        callback([errorResult])
    }
});

chrome.omnibox.onInputEntered.addListener((url) => {
    if (url.includes("https")) {
        chrome.tabs.create({url});
    }
});