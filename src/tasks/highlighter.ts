import { CoinData } from "../modules/interfaces";
import { findInHTML, getElementsContaining } from "../modules/parsingUtils";
import { BANNED_TICKERS, CSS_ACTIVATED_CLASS, CSS_TOOLTIP_CLASS, ELEMENTS_PROHIBITED_TO_OVERRIDE } from "../modules/settings";
import { toCurrency, unique } from "../modules/utils";

// This script finds crypto values in page and highlights them
export function highlight(coinData: Map<string, CoinData>) {
    // Mush all known tickets into a huge regex
    let allTickers = Array.from(coinData.keys()).filter(key => {
        if (key.length < 3) 
            return false
        if (BANNED_TICKERS.includes(key))
            return false
        return true
    } ).map(key => key.replace(".", "\\.")).join("|")

    const masterRegex = RegExp(`([\\d.,]*\\d+)[\\s]*(${allTickers})`, "gmi");

    let allMatches = Array.from(document.body.innerText.matchAll(masterRegex))
    
    if (allMatches) {
        // Turns match groups into regexes, sort by length to prevent collisions
        let coinRegexes: RegExp[] = unique(
            allMatches.map(match => {
                let expression = `(${match[1]})\\s*(${match[2]})`
                return expression
            })
        ).sort((a, b) => b.length - a.length).map(x => RegExp(x, "m"))

        const elements = getElementsContaining(coinRegexes);

        for(let element of elements) {
            highlightElement(element, coinRegexes, coinData)
        }
    }
}

function highlightElement(element: HTMLElement, coinRegexes: RegExp[], coinData: Map<string, CoinData>) {
    // Need to add global flag to all regexes
    coinRegexes = coinRegexes.map(x => RegExp(x, "gmi"))

    for(let regex of coinRegexes) { 
        let matches = Array.from(element.textContent!!.matchAll(regex))
        let currentIndex = 0

        if (matches) {
            for(let match of matches) {
                // Find the part of html we need to cut out
                let findResult = findInHTML(element.innerHTML, match[1], match[2], currentIndex)
                if (!findResult) continue 
                currentIndex = findResult.index

                // Check if there are prohibited tags in between 
                if (ELEMENTS_PROHIBITED_TO_OVERRIDE.some(x => findResult!!.between.includes(x))) {
                    continue
                }

                // Calculate price in fiat
                let usdPrice = ""
                try {
                    usdPrice = "$" + toCurrency(coinData.get(match[2].toLowerCase())!!.current_price * Number(match[1].replaceAll(",", "")))
                } catch(e) {
                    console.log(`Failed to calculate price of ${match[0]} due to error: ${e}`)
                    continue
                }
                
                // Edit HTML to highlight and add interactive methods
                let replacement = `<span class="${CSS_ACTIVATED_CLASS}">${match[0]}</span>`
                element.innerHTML = element.innerHTML.replaceAll(findResult.between, replacement)

                let highlighedElements = element.querySelectorAll("."+CSS_ACTIVATED_CLASS)
                Array.from(highlighedElements).filter(el => el.textContent == match[0]).map(e => {
                    let el = (e as HTMLElement)
                    el.onmouseover = (evt) => showPrice(evt, usdPrice)
                    el.onmouseleave = killTooltips
                })
            }
        }
    }
}

function showPrice(evt: MouseEvent, usdPrice: string) {
    let originalElement = (evt.currentTarget as HTMLElement)

    // Create new element
    let tooltip = document.createElement("div")
    tooltip.textContent = usdPrice
    tooltip.style.fontSize = window.getComputedStyle(originalElement).getPropertyValue('font-size');
    tooltip.classList.add(CSS_TOOLTIP_CLASS)

    //Position
    var rect = originalElement.getBoundingClientRect();
    tooltip.style.top = (rect.top + rect.height/2) + "px"
    tooltip.style.left = (rect.left + rect.width/2) + "px"

    document.body.appendChild(tooltip)
}

function killTooltips() {
    var tooltips = document.getElementsByClassName(CSS_TOOLTIP_CLASS);
    Array.from(tooltips).forEach(tooltip => {
        tooltip.parentNode!!.removeChild(tooltip);
    });​
}