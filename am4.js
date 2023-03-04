// ==UserScript==
// @name         AM4 bot
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  automate depart for flights, better autoprice for new routes
// @author       Adentissa
// @match        https://www.airlinemanager.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant GM_log
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(executeEvery5Minutes, 2000);
    betterAutoprice();
})();

function executeEvery5Minutes() {
    // Trying to avoid detection
    // 4-6 minutes interval between each check
    const min = 240000;
    const max = 360000;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    GM_log("Next check in " + Math.floor(randomNum/60000) + " minutes and " + (randomNum%60000)/1000 + " seconds.");
    setTimeout(function() {
        executeEvery5Minutes();
    }, randomNum);
    GM_log("checking for available departures");
    departAll()
}

function departAll() {
    var numberSpan = document.getElementById("listDepartAmount");
    GM_log(numberSpan.innerText + " flight(s) to depart.");
    if (numberSpan.innerText !== "0"){
        // before departing, start eco-friendly campaign
        // No better way to do it, since countdown is not visible by default
        startEcoCampaign();
        var departButton = numberSpan.parentElement;
        if (departButton) {
            departButton.click();
            GM_log("button clicked")
        }
    }
}

function startEcoCampaign() {
    // Create a new XMLHttpRequest object
    var xhttp = new XMLHttpRequest();

    // Define the callback function that will be executed when the request completes
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Do something with the response
            GM_log("Eco-friendly campaign started " + this.responseText);
        }
    };

    // Open the connection to the server and send the request
    xhttp.open("GET", "marketing_new.php?type=5&mode=do&c=1", true);
    xhttp.send();
}


function betterAutoprice() {
    const observer = new MutationObserver(
        ()=> {
            var autopriceButton = document.getElementById('introAuto');
            if (autopriceButton) {
                const line = autopriceButton.getAttribute('onclick');
                const values = line.slice(line.indexOf('(') + 1, line.indexOf(')')).split(',');
                const priceValues = values.slice(0, 4);
                GM_log(priceValues); // Output: ["799", "1798", "2946"]
                autoPrice(Math.floor(priceValues[0] * 1.1), Math.floor(priceValues[1] * 1.08), Math.floor(priceValues[2] * 1.06), priceValues[3]);
                observer.disconnect();
                setTimeout(executeEvery5Minutes, 10000);
            }
        });

    // watch the new routes window
    const targetNode = document.getElementById('newRouteInfo');
    const config = {attributes: true, childList: true, subtree: true};
    observer.observe(targetNode, config);
}