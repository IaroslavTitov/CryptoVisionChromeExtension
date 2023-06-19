import { Message, MessageType, VisionEnabledMessage } from "../modules/interfaces";
import { CSS_ACTIVATED_CLASS } from "../modules/settings";

export function processVisionEnabledMessage(message: Message) {
    if(message.type != MessageType.VISION_ENABLED_NOTIFICATION) return

    let parsedMessage = message as VisionEnabledMessage

    // If message signals vision off, remove all highlights
    if (!parsedMessage.value) {
        let highlightedElements = document.querySelectorAll("."+CSS_ACTIVATED_CLASS)
        highlightedElements.forEach(element => {
            element.classList.remove(CSS_ACTIVATED_CLASS);
            (element as HTMLElement).onmouseover = function() {};
        })
    }
}