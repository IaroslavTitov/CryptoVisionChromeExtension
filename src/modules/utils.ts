import { CoinData, Message } from "./interfaces";
import { BANNED_TICKERS } from "./settings";

// filter out repeating values
export function unique(input: any[]) {
    return input.filter((value, index, array) => array.indexOf(value) === index)
}

// Loads json data from URL
export async function getJSON(url:string) {
    const response = await fetch(url);
    if(!response.ok) {
        if (response.status == 429) {
            console.log("Failed retrieving JSON from url " + url + " due to rate throttling. Retry later.")
            return "429"
        } else {
            console.log("Exception retrieving JSON from url " + url + ", returned status "+ response.status)
            throw new Error(response.statusText);
        }
    }
    return response.text();
}

// Converts a number into a dollar value
export function toCurrency(value: number) {
    return Number(value.toFixed(2)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
}

// Gets all active tabs and sends a chrome message
export function sendMessageToAllTabs(message: Message) {
    chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id!!, message);
      });
    });
}

export async function getFromStorage(key: string): Promise<any> {
    if (chrome.runtime?.id) {
        let loadedData = await chrome.storage.local.get(key)
        return loadedData[key]
    }
    return undefined
}

export async function setToStorage(key: string, value: any) {
    if (chrome.runtime?.id) {
        await chrome.storage.local.set({[key]: value})
    }
}

// Mush all known tickets into a huge regex
export function generateMasterRegex(coinData: Map<string, CoinData>): RegExp {
    let allTickers = Array.from(coinData.keys()).filter(key => {
        if (key.length < 3) 
            return false
        if (BANNED_TICKERS.includes(key))
            return false
        return true
    } ).map(key => key.replace(".", "\\.")).join("|")

    return RegExp(`^[^\\d$]*([\\d.,]*\\d+)[\\s]*(${allTickers})`, "gmi");
}