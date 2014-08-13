var bitcoinApp = angular.module("bitcoin", ["firebase"]);

bitcoinApp.controller("BitcoinCtrl", function($scope, $interval, CurrencyConversions, $firebase) {

    $scope.bitcoinExchanges = [];
    $scope.latestAsksFromBcId = [];
    $scope.bitcoinAvgPrices = CurrencyConversions.getBTCAvgPrices();

    // calculate the percentage difference between the current cheapest ask on bitcoin.co.id and a USD buy value
    var calcPercentDifference = function(usdValue) {

        var latestUSDequivFromBcId = CurrencyConversions.convertToUSD($scope.latestAsksFromBcId[0][0], 'IDR');

        if(latestUSDequivFromBcId < usdValue) {

            return {
                percentage: calcPercentage(latestUSDequivFromBcId, usdValue),
                argLarger: true
            }
        }
        else {

            return {
                percentage: calcPercentage(usdValue, latestUSDequivFromBcId),
                argLarger: false
            }
        }
    };

    $scope.latestAgainstUSDGlobalAvg = function() {

        if($scope.appReady()) {
            var percentDiff = calcPercentDifference($scope.bitcoinAvgPrices.USD);

            if(percentDiff.argLarger) {
                return percentDiff.percentage.toFixed(2) + "% below";
            }
            else {
                return percentDiff.percentage.toFixed(2) + "% above";
            }
        }
    };

    $scope.latestAgainstExchange = function(exchangeBid) {

        if($scope.appReady()) {
            var percentDiff = calcPercentDifference(exchangeBid);

            if(percentDiff.argLarger) {
                return percentDiff.percentage.toFixed(2) + "% profit";
            }
            else {
                return percentDiff.percentage.toFixed(2) + "% loss";
            }
        }
    };

    $scope.appReady = function() {

        return (($scope.bitcoinExchanges.length > 1)
                && angular.isDefined($scope.bitcoinAvgPrices.USD)
                && ($scope.latestAsksFromBcId.length > 1));
    };

    var calcPercentage = function(smallerNum, largerNum) {
        return 100 - ((smallerNum / largerNum) * 100);
    };

    // get BTC buyers
    var initBcAvgPrices = function() {

        var ref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/buyers');
        var sync = $firebase(ref);
        $scope.bitcoinExchanges = sync.$asArray();
    };

    // get bitcoin average prices in all currencies
    var initBcGlobalAvgPrices = function() {

        var ref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/currencies');
        var sync = $firebase(ref);
        var syncObject = sync.$asObject();
        syncObject.$bindTo($scope, "bitcoinAvgPrices");
    };

    // get current sells for bitcoin at bitcoin.co.id
    var initBcIdCurrSells = function() {

        var ref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/sellers/bitcoincoid/sells');
        var sync = $firebase(ref);
        $scope.latestAsksFromBcId = sync.$asArray();
    };

    initBcAvgPrices();    
    initBcIdCurrSells();
    initBcGlobalAvgPrices();

    $scope.alertForm = {};
    $scope.alertForm.submitUserDetails = function(item, event) {
        console.log("Adding alert for " + $scope.alertForm.name + " for email " + $scope.alertForm.email +
                    " for values over " + $scope.alertForm.percentDiff);
        $scope.alertForm.name = '';
        $scope.alertForm.email = '';
        $scope.alertForm.percentDiff = '';
        
        $scope.alertForm.success = true;
    };
});

bitcoinApp.directive("runningTotal", function() {

    return {
        link: function(scope, element, attrs) {
            element.bind("mouseenter", function() {
                scope.tmpBTCvalue = element.text();
                element.text(calcCurrentBTCtotal());
            });

            element.bind("mouseleave", function() {
                element.text(scope.tmpBTCvalue);
            });

            function calcCurrentBTCtotal() {

                var currTotal = 0;

                for (var i = 0; i <= attrs.currindex; i++) {
                    currTotal += +scope.latestAsksFromBcId[i][1];
                }

                return currTotal.toFixed(8);
            }
        }
    };
});

// perform a currency conversion from IDR to USD on mouse rollover
bitcoinApp.directive("currencyConvert", function(CurrencyConversions) {
    return function(scope, element, attrs) {
        element.bind("mouseenter", function() {
            scope.tmpValue = element.text();
            element.text(CurrencyConversions.convertToUSD(element.text(), 'IDR'));
        });

        element.bind("mouseleave", function() {
            element.text(scope.tmpValue);

        });
    };
});

// Service that converts from a currency into USD
bitcoinApp.factory('CurrencyConversions', function ($firebase) {

    var bitcoinAvgPrices = {};

    var ref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/currencies');
    var sync = $firebase(ref);
    bitcoinAvgPrices = sync.$asObject();

    return {
        convertToUSD: function (value, origCurrency) {
            return ((value / bitcoinAvgPrices[origCurrency]) * bitcoinAvgPrices.USD).toFixed(2);
        },
        getBTCAvgPrices: function() {
            return bitcoinAvgPrices;
        }
    }
});