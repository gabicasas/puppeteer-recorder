import Bridge from 'crx-bridge';

export default class DevtoolsMessage {
    constructor() {
        this.port = chrome.runtime.connect({ name: 'fav' });
        this.port.onMessage.addListener((msg) => {
            //debugger;
           
            //alert("Mensaje recibido en devtools");
            console.log(msg);
            try{
            Bridge.sendMessage("dataToAPI",msg,"content-script")
            }catch(e){
                alert(e.message);
            }
        });
    }
}