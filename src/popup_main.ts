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
    let button = document.getElementById(Settings.CSS_ACTIVATION_BUTTON_ID)!!
    button.onclick = toggleActivationButton

    // Immediately make button inactive when setting set to false, if not set assume true
    let isCryptoVisionEnabled = (await getFromStorage(Settings.STOR_VISION_ENABLED) ?? true)
    if (!isCryptoVisionEnabled) toggleActivationButton()
}

window.onload = init