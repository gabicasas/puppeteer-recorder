
//https://stackoverflow.com/questions/42863801/chrome-devtools-extension-send-message-from-background-to-currently-open-tab-onl

export default class BackgroundMessage {

    constructor(){

        this.ports = [];
        chrome.runtime.onConnect.addListener((port) => {
            if (port.name !== "fav") return;
            this.ports.push(port);
            // Remove port when destroyed (eg when devtools instance is closed)
            port.onDisconnect.addListener(function() {
                var i = this.ports.indexOf(port);
                if (i !== -1) this.ports.splice(i, 1);
                    chrome.windows.getCurrent(function(win) {
                        chrome.tabs.getAllInWindow(win.id, function(tabs) {
                            var activeTab;
                            $(tabs).each(function(i,v) {
                                if(v.active === true) {
                                    activeTab = tabs[i]['id'];
                                }
                            });
                            chrome.tabs.sendRequest(activeTab, {greeting: 'all_off'});
                        });
                    });      
            });
            port.onMessage.addListener(function(msg) {
                // Received message from devtools. Do something:
                console.log('Received message from devtools page', msg);
        
                chrome.windows.getCurrent(function(win) {
                    chrome.tabs.getAllInWindow(win.id, function(tabs) {
                        var activeTab;
                        $(tabs).each(function(i,v) {
                            if(v.active === true) {
                                activeTab = tabs[i]['id'];
                            }
                        });
                        chrome.tabs.sendRequest(activeTab, msg)
                    });
                });
            });
        });
       
        
        chrome.runtime.onMessage.addListener(this.listen_from_content);

    }



     // Function to send a message to all devtools.html views:
    notifyDevtools(msg) {
        this.ports.forEach((port) => {
            port.postMessage(msg);
        });
    }
    
    listen_from_content(request, sender, sendResponse)
    {
        this.ports.forEach((port) => {
            port.postMessage(request);
        });
        sendResponse('hello');
    }








}