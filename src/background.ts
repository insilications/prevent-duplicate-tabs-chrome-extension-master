let preventedDuplicatesCount = 0;
let active = true;

chrome.browserAction.setBadgeBackgroundColor({
    color: '#933EC5'
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TurnOnOff') {
        active = !active;
        updateBadge();
    }
    else if (request.action === 'Deduplicate') {
        chrome.tabs.query({}, tabs => {
            const alreadyEncounteredTabUrls = new Set();
            tabs.forEach(tab => {
                if (alreadyEncounteredTabUrls.has(tab.url)) {
                    chrome.tabs.remove(tab.id);
                    preventedDuplicatesCount++;
                }
                alreadyEncounteredTabUrls.add(tab.url);
            });
            updateBadge();
        });
    }
});

chrome.tabs.onCreated.addListener(newTab => {
    if (active && newTab.url) {
        verifyAndDeduplicate(newTab.id, newTab.url);
    }
});

chrome.tabs.onUpdated.addListener((updatedTabId, updateInfo, updatedTab) => {
    if (active && updateInfo.url) {
        verifyAndDeduplicate(updatedTabId, updateInfo.url);
    }
});

function verifyAndDeduplicate(currentTabId, currentTabUrl) {
    chrome.tabs.query({}, tabs => {
        let duplicateTab = null;
        tabs.forEach(otherTab => {
            const regex1 = RegExp('(?<=uri=).*', 'g');
            let array3 = regex1.exec(otherTab.url);
            let array4;
            if (array3 === null) {
                array4 = "";
            } else {
                array4 = array3.toString();
            }
            console.log("Result 3: " + array3)
            console.log("Result 4: " + array4)
            if (otherTab.id !== currentTabId && otherTab.url === currentTabUrl || array4 === currentTabUrl) {
                duplicateTab = otherTab;
            }
        });
        if (duplicateTab) {
            chrome.tabs.update(duplicateTab.id, {
                "active": true
            });
            chrome.windows.update(duplicateTab.windowId, {
                focused: true
            });
            chrome.tabs.reload(duplicateTab.id);
            chrome.tabs.remove(currentTabId);
            preventedDuplicatesCount++;
            updateBadge();
        }
    });
}

function updateBadge() {
    chrome.browserAction.setBadgeText({
        text: active ? (preventedDuplicatesCount > 0 ? `${preventedDuplicatesCount}` : '') : 'OFF'
    });
}
