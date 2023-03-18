// ==UserScript==
// @name         AM4 bot
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  automate depart for flights, better auto-price for new routes, automatic low price fuel and CO2 buying, start eco-friendly campaign before departing
// @author       LouisJ
// @match        https://www.airlinemanager.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant GM_log
// ==/UserScript==
// noinspection JSUnresolvedFunction

// Set the price thresholds under which we buy fuel and CO2
let fuelPriceThreshold = 550;
let co2PriceThreshold = 120;

(function () {
    'use strict';
    setTimeout(executeEvery5Minutes, 10000);
    betterAutoPrice();
    setTimeout(scanConsumable, 4000);
})();

function executeEvery5Minutes() {
    // Trying to avoid detection
    // 4-6 minutes interval between each check
    const min = 240000;
    const max = 360000;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    GM_log("Next check in " + Math.floor(randomNum / 60000) + " minutes and " + (randomNum % 60000) / 1000 + " seconds.");
    setTimeout(function () {
        executeEvery5Minutes();
    }, randomNum);
    GM_log("checking for available departures");
    departAll()
}

function departAll() {
    const numberSpan = document.getElementById("listDepartAmount");
    GM_log(numberSpan.innerText + " flight(s) to depart.");
    if (numberSpan.innerText !== "0") {
        // before departing, start eco-friendly campaign
        // No better way to do it, since countdown is not visible by default
        startEcoCampaign();
        const departButton = numberSpan.parentElement;
        if (departButton) {
            departButton.click();
            GM_log("button clicked")
        }
    }
}

function startEcoCampaign() {
    // Create a new XMLHttpRequest object
    const xhttp = new XMLHttpRequest();

    // Define the callback function that will be executed when the request completes
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            // Do something with the response
            GM_log("Eco-friendly campaign started " + this.responseText);
        }
    };

    // Open the connection to the server and send the request
    xhttp.open("GET", "marketing_new.php?type=5&mode=do&c=1", true);
    xhttp.send();
}


function betterAutoPrice() {
    const observer = new MutationObserver(
        () => {
            const autoPriceButton = document.getElementById('introAuto');
            if (autoPriceButton) {
                const line = autoPriceButton.getAttribute('onclick');
                const values = line.slice(line.indexOf('(') + 1, line.indexOf(')')).split(',');
                const priceValues = values.slice(0, 4);
                GM_log(priceValues);
                autoPrice(Math.floor(priceValues[0] * 1.1) - 10, Math.floor(priceValues[1] * 1.08) - 10, Math.floor(priceValues[2] * 1.06) - 10, priceValues[3]);
                observer.disconnect();
                setTimeout(betterAutoPrice, 5000);
            }
        });

    // watch the new routes window
    const targetNode = document.getElementById('newRouteInfo');
    const config = {attributes: true, childList: true, subtree: true};
    observer.observe(targetNode, config);
}

function getBankBalance() {
    // Get the top left element with the bank balance
    const bankBalance = document.getElementById("headerAccount");
    const intBankBalance = parseInt(bankBalance.innerText.replace(/[^0-9]/g, ""));
    GM_log("Bank balance: " + intBankBalance);
    return intBankBalance;
}

function call(url) {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = xhr.responseText;
                // Do something with the response
                GM_log('Response:', response);
            } else {
                GM_log('AJAX request failed:', xhr.status);
            }
        }
    };

    xhr.open('GET', url, true);
    xhr.send();
}

function buyFuel(intAmount) {
    const url = 'fuel.php?mode=do&amount=' + encodeURIComponent(intAmount);
    call(url);
}


function buyCO2(intAmount) {
    const url = 'co2.php?mode=do&amount=' + encodeURIComponent(intAmount);
    call(url)
}

function scanConsumable() {
    // open the fuel window
    popup('fuel.php', 'Fuel', false, false, true);
    // wait for the window to load, then do the fuel routine
    setTimeout(function () {
        // get the main element
        const element = document.getElementById("fuelMain");

        // Get the price text
        const price = element.children[0].children[0].children[2].children[0].innerText;
        // Transform the price into an integer
        const intPrice = parseInt(price.replace(/[^0-9]/g, ""));

        // if the price is lower than 550, buy fuel
        if (intPrice <= fuelPriceThreshold) {
            GM_log("Fuel price is low: " + intPrice);

            // Get the capacity text
            const capacity = element.children[0].children[2].children[2].innerText;
            // transform the capacity into an integer
            const intCapacity = parseInt(capacity.replace(/[^0-9]/g, ""));

            // Get the bank balance
            const intBankBalance = getBankBalance();
            // Calculate the amount of fuel buyable
            const intBuyable = Math.floor(intBankBalance / intPrice * 1000);

            // Buy the minimum between the amount of fuel buyable and the capacity
            const intBuy = Math.min(intBuyable, intCapacity);

            GM_log("Buying " + intBuy + " fuel");
            buyFuel(intBuy);
        }
    }, 500);

    // do the CO2 routine
    setTimeout(function () {
        // click on the CO2 window button
        document.getElementById("popBtn2").click();

        // wait for the window to load, then do the CO2 routine
        setTimeout(function () {
            // get the main element
            const element = document.getElementById("co2Main");

            // Get the price text
            const price = element.children[0].children[1].children[2].children[0].innerText;
            // Transform the price into an integer
            const intPrice = parseInt(price.replace(/[^0-9]/g, ""));

            // if the price is lower than 120, buy CO2
            if (intPrice <= co2PriceThreshold) {
                // Get the capacity text, transform it into an integer
                const capacity = element.children[0].children[3].children[2].innerText;
                const intCapacity = parseInt(capacity.replace(/[^0-9]/g, ""));

                // get the bank balance
                const intBankBalance = getBankBalance();
                // calculate the amount of CO2 buyable
                const intBuyable = Math.floor(intBankBalance / intPrice * 1000);

                // buy the minimum between the buyable amount and the capacity
                const intBuy = Math.min(intBuyable, intCapacity);

                GM_log("Buying " + intBuy + " CO2");
                buyCO2(intBuy);
            }

            setTimeout(function () {
                // close the window
                closePop();
                GM_log("Consumable scan done");
            }, 1000);

            // Wait 30 mins before scanning again
            const time = 30 * 60 * 1000;
            setTimeout(scanConsumable, time)
        }, 500);

    }, 2000);
}