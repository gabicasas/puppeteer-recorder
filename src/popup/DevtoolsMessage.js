export default class DevtoolsMessage {
    constructor() {
        this.port = chrome.runtime.connect({ name: 'fav' });
        this.port.onMessage.addListener((msg) => {
            alert("Mensaje recibido en devtools");
            console.log(msg);
        });
    }
}