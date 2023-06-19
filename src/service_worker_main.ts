import { COIN_DATA_LOAD_FREQUENCY } from "./modules/settings";
import { loadCoinData } from "./tasks/coindataloader";

console.log("Crypto Vision Service Worker Initiated")

setInterval(async () => {
    await loadCoinData()
}, COIN_DATA_LOAD_FREQUENCY);
