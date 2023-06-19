// For Coin Data loader
export interface CoinData {
    id: string,
    symbol: string,
    name: string,
    current_price: number
}

// For parsing logic
export interface NodeStatus{
    foundInThisOne: boolean,
    foundInChildren: boolean
}
export const NODE_STATUS_NOTHING_FOUND: NodeStatus = { foundInChildren: false, foundInThisOne: false }
export const NODE_STATUS_FOUND: NodeStatus = { foundInChildren: false, foundInThisOne: true }

export interface FindInHtmlResult {
    between: string,
    index: number
}

// App Interconnectivity
export enum MessageType {
    VISION_ENABLED_NOTIFICATION
}

export interface Message {
    type: MessageType
}

export interface VisionEnabledMessage extends Message {
    value: boolean
}