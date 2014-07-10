var bitcoinApp = angular.module("bitcoin", []);

bitcoinApp.controller("BitcoinCtrl", function($scope, $http, CurrencyConversions) {

    $scope.bitcoinAvgExchanges = [];
    $scope.latestAsksFromBcId = [[0,0]];
    $scope.bitcoinGlobalUSDAvg = 0;

    // calculate the percentage difference between the current cheapest ask on bitcoin.co.id and a USD value
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

    $scope.latestAgainstGlobalAvg = function() {

        var percentDiff = calcPercentDifference($scope.bitcoinGlobalUSDAvg);

        if(percentDiff.argLarger) {
            return percentDiff.percentage.toFixed(2) + "% below";
        }
        else {
            return percentDiff.percentage.toFixed(2) + "% above";
        }
    };

    $scope.latestAgainstExchange = function(exchangeAsk) {

        var percentDiff = calcPercentDifference(exchangeAsk);

        if(percentDiff.argLarger) {
            return percentDiff.percentage.toFixed(2) + "% profit";
        }
        else {
            return percentDiff.percentage.toFixed(2) + "% loss";
        }
    };

    $scope.globalAvgDataReady = function() {

        return ($scope.bitcoinAvgExchanges.length > 1);
    };

    var calcPercentage = function(smallerNum, largerNum) {
        return 100 - ((smallerNum / largerNum) * 100);
    };

    // get bitcoin average prices in all currencies
    var getBcAvgPrices = function() {

        $http.get("https://api.bitcoinaverage.com/all")
        .success(function(data) {

            $scope.bitcoinGlobalUSDAvg = data.USD.global_averages.ask;

            //convert arraylist of objects to an array (so I can use ng-filters)
            for(var exchange in data.USD.exchanges) {
                $scope.bitcoinAvgExchanges.push({name:data.USD.exchanges[exchange].display_name, ask:data.USD.exchanges[exchange].rates.ask, url:data.USD.exchanges[exchange].display_URL});
            }
        });
    };

    // get current sells for bitcoin at bitcoin.co.id
    var getBcIdCurrSells = function() {

        $http.get("https://vip.bitcoin.co.id/api/btc_idr/depth")
        .success(function(data) {

            $scope.latestAsksFromBcId = data['sell'];
        });
    };

    getBcAvgPrices();
    getBcIdCurrSells();

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
bitcoinApp.factory('CurrencyConversions', function ($http) {

    var latestExchangeRates = {'USD':0};

    $http.get("http://openexchangerates.org/api/latest.json?app_id=7bbeb62c36df464cbd9cfa47a9236803")
    .success(function(data) {

        latestExchangeRates = data['rates'];
    });

    return {
        convertToUSD: function (value, origCurrency) {

            return (parseFloat(value) / parseFloat(latestExchangeRates[origCurrency])).toFixed(2);
        }
    }
});