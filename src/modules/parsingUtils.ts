import { NODE_STATUS_FOUND, FindInHtmlResult, NODE_STATUS_NOTHING_FOUND, NodeStatus } from "./interfaces";
import { CSS_ACTIVATED_CLASS } from "./settings";

// Recursively goes through nodes, finding nodes that contain certain strings in their text content
export function getElementsContaining(coinRegexes: RegExp[]) {
    let masterList: HTMLElement[] = []
    searchNode(document.body, coinRegexes, masterList)
    return masterList;
}

// checks if any of the strings are in a large text
function hasAnyMatches(text: string, coinRegexes: RegExp[]) {
    for (let regex of coinRegexes) {
        if (regex.exec(text)) return true
    }
    return false;
}

// Recursive function that calls itself on all child nodes
function searchNode(node: Node, coinRegexes: RegExp[], masterList: Node[]): NodeStatus {
    if (node.nodeName == 'SCRIPT' || node.nodeName == '#text' || !node.textContent) return NODE_STATUS_NOTHING_FOUND

    let foundInChildren = false
    // Loops through children, calls this function on each
    for(let child of Array.from(node.childNodes)) {
        let childStatus = searchNode(child, coinRegexes, masterList)
        foundInChildren ||= childStatus.foundInChildren || childStatus.foundInThisOne
    }

    let foundInMe = false
    let alreadyDone = false
    if (!foundInChildren) {
        // Checks if this one 
        foundInMe = hasAnyMatches(node.textContent, coinRegexes)
        alreadyDone = (node as HTMLElement)?.classList?.contains(CSS_ACTIVATED_CLASS)

        if (foundInMe && !alreadyDone) {
            masterList.push(node as HTMLElement)
            return NODE_STATUS_FOUND
        }
    }

    return { foundInChildren: foundInChildren, foundInThisOne: foundInMe || alreadyDone };
}

// Finds given text, but not within tags
export function findInHTML(html: string, amount: string, ticker: string, startingIndex: number): FindInHtmlResult|null {
    let foundAmount = 0, foundTicker = 0, nextAmount = 0
    let nextFlag = false
    let currentIndex = startingIndex

    do {
        // Find the amount or grab it from previous iteration
        if (nextFlag) {
            foundAmount = nextAmount
        } else {
            foundAmount = findIndexNotInTag(html, amount, currentIndex)
        }
        nextFlag = false
        
        // Find the ticker
        foundTicker = findIndexNotInTag(html, ticker, foundAmount + amount.length, )

        if (foundAmount == -1 || foundTicker == -1) return null

        // Checks if there is the same amount closer to the ticker
        nextAmount = findIndexNotInTag(html, amount, foundAmount + amount.length)
        if (nextAmount != -1 && nextAmount < foundTicker) {
            currentIndex = nextAmount
            nextFlag = true
        } 
    } while (nextFlag)

    return {
        between: html.substring(foundAmount, foundTicker + ticker.length),
        index: foundAmount + 1
    }
}

function findIndexNotInTag(html: string, target: string, startingIndex: number): number {
    let currentIndex = startingIndex
    let foundTarget = 0
    let tagFlag = false, quoteFlag = false, activatedFlag = false

    var regex = RegExp(CSS_ACTIVATED_CLASS, "gmi"), activatedIndices = [];
    while (regex.exec(html)) {
        activatedIndices.push(regex.lastIndex);
    }

    do {
        foundTarget = html.indexOf(target, currentIndex)
        if (foundTarget == -1) return foundTarget

        // Prevents finding values inside node definitions
        for (var i = currentIndex; i < foundTarget; i++) {
            if (activatedIndices.includes(i)) {
                activatedFlag = true
            }

            if (tagFlag && html[i] == "\"") quoteFlag = !quoteFlag

            if (!quoteFlag && html[i] == "<") {
                activatedFlag = false
                tagFlag = true
            }
            if (!quoteFlag && html[i] == ">") tagFlag = false
        }
        currentIndex = foundTarget+1
    } while (tagFlag || quoteFlag || activatedFlag)

    return foundTarget
}