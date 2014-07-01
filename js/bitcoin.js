var bitcoinApp = angular.module("bitcoin", []);

bitcoinApp.controller("BitcoinCtrl", function($scope, $http, CurrencyConversions) {

    $scope.bitcoinAvgExchanges = [];
    $scope.latestAsksFromBcId = [[0,0]];
    $scope.bitcoinGlobalUSDAvg = 0;

    // calculate the percentage difference between the global average and the current cheapest ask on bitcoin.co.id
    $scope.calcPriceDifference = function() {

        var strAnswer = "";
        var percentDiff = 0;
        var latestUSDequivFromBcId = CurrencyConversions.convertToUSD($scope.latestAsksFromBcId[0][0], 'IDR');

        if(latestUSDequivFromBcId < $scope.bitcoinGlobalUSDAvg) {

            percentDiff = calcPercentage(latestUSDequivFromBcId, $scope.bitcoinGlobalUSDAvg);
            strAnswer = percentDiff.toFixed(2) + "% below";
        }
        else {
            percentDiff = calcPercentage($scope.bitcoinGlobalUSDAvg, latestUSDequivFromBcId);
            strAnswer = percentDiff.toFixed(2) + "% above";
        }

        return strAnswer;
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

            $scope.bitcoinGlobalUSDAvg = data.USD.global_averages.last;

            //convert arraylist of objects to an array (so I can use ng-filters)
            for(var exchange in data.USD.exchanges) {
                $scope.bitcoinAvgExchanges.push({name:data.USD.exchanges[exchange].display_name, ask:data.USD.exchanges[exchange].rates.ask});
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

// perform a currency conversion from IDR to USD on mouse rollover
bitcoinApp.directive("currencyConvert",function(CurrencyConversions) {
    return {
        link: function(scope, element, attrs) {
            element.bind("mouseenter", function() {
                scope.tmpValue = element.text();
                element.text(CurrencyConversions.convertToUSD(element.text(), 'IDR'));
            });

            element.bind("mouseleave", function() {
                element.text(scope.tmpValue);

            });
        }
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