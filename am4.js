// ==UserScript==
// @name         AM4 bot
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  automate depart for flights
// @author       Adentissa
// @match        https://www.airlinemanager.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant GM_log
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(executeEvery5Minutes, 2000);
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
        var departButton = numberSpan.parentElement;
        if (departButton) {
            departButton.click();
            GM_log("button clicked")
        }
    }
}