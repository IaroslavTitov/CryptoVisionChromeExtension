import { MessageType, VisionEnabledMessage } from "./modules/interfaces"
import * as Settings from "./modules/settings"
import { getFromStorage, sendMessageToAllTabs, setToStorage } from "./modules/utils"

// Turns Crypto Vision on and off
async function toggleActivationButton() {
    let button = document.getElementById(Settings.CSS_ACTIVATION_BUTTON_ID)!!
    let text = document.getElementById(Settings.CSS_ACTIVATION_BUTTON_TEXT_ID)!!

    // Apply change to popup
    button.classList.toggle(Settings.CSS_ACTIVE)
    let isVisionEnabled = button.classList.contains(Settings.CSS_ACTIVE)
    text.textContent = isVisionEnabled ? Settings.TEXT_CRYPTO_VISION_ACTIVATED : Settings.TEXT_CRYPTO_VISION_DEACTIVATED

    //Set icon
    chrome.action.setIcon({
        path : isVisionEnabled ? "icons/logo.png" : "icons/logo_inactive.png"
    });
    
    // Persist setting
    await setToStorage(Settings.STOR_VISION_ENABLED, isVisionEnabled)

    // Apply to other program parts
    let message: VisionEnabledMessage = {
        type: MessageType.VISION_ENABLED_NOTIFICATION,
        value: isVisionEnabled
    }
    sendMessageToAllTabs(message)
}

// Initializes the popup on load
async function init() {
    let activation_button = document.getElementById(Settings.CSS_ACTIVATION_BUTTON_ID)!!
    activation_button.onclick = toggleActivationButton

    // Immediately make button inactive when setting set to false, if not set assume true
    let isCryptoVisionEnabled = (await getFromStorage(Settings.STOR_VISION_ENABLED) ?? true)
    if (!isCryptoVisionEnabled) toggleActivationButton()

    // Add links to donations buttons
    let cash = document.getElementById(Settings.CSS_DONATION_LINK_CASH_ID)!!
    cash.onclick = () => { chrome.tabs.create({
        url: "https://cash.app/$IaroslavTitov"
    }) }
    
    let strike = document.getElementById(Settings.CSS_DONATION_LINK_STRIKE_ID)!!
    strike.onclick = () => { chrome.tabs.create({
        url: "https://strike.me/tias"
    }) }

    let address = document.getElementById(Settings.CSS_DONATION_LINK_ADDRESS_ID)!!
    address.onclick = () => { 
        navigator.clipboard.writeText("0xF1A7ea9D0ff5F787452240CC2BBF187B6692F1e4");
        address.classList.toggle(Settings.CSS_COPIED_CLASS)
        setTimeout(() => {
            address.classList.toggle(Settings.CSS_COPIED_CLASS)
        }, 2000);
    }

    let box = document.getElementById(Settings.CSS_DONATION_BOX_ID)!!
    let donation_button = document.getElementById(Settings.CSS_DONATION_BUTTON_ID)!!
    donation_button.onclick = () => { 
        box.classList.toggle(Settings.CSS_OPEN_CLASS)
    }
}

window.onload = init