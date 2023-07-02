import { STOR_VISION_ENABLED } from "./modules/settings";
import { getFromStorage } from "./modules/utils";
import { getCoinData } from "./tasks/coindataloader";
import { highlight } from "./tasks/highlighter";
import { processVisionEnabledMessage } from "./tasks/message_processor";

console.log("Crypto Vision activated!")

// Makes content script listen to settings changes
chrome.runtime.onMessage.addListener(message => {
    processVisionEnabledMessage(message)
});

// Run highlight logic every 3 seconds when crypto vision is enabled
setInterval(async () => {
    if (!document.hasFocus()) return

    let isCryptoVisionEnabled = (await getFromStorage(STOR_VISION_ENABLED) ?? true)
    if (isCryptoVisionEnabled) {
        let coinData = await getCoinData()
        if (coinData.size > 0) {
            highlight(coinData)
        }
    }
}, 3000)