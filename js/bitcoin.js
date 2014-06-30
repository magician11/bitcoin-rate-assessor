var bitcoinApp = angular.module("bitcoin", []);

bitcoinApp.controller("BitcoinCtrl", function($scope, $http, CurrencyConversions) {

    $scope.bitcoinAvgUSDData = {};
    $scope.latestAsksFromBcId = {};

    // calculate the percentage difference between the global average and the current cheapest ask on bitcoin.co.id
    $scope.calcPriceDifference = function() {

        /*
        if(angular.isUndefined($scope.latestAsksFromBcId[0][0]) || !CurrencyConversions.isReady()) {
            return "calculating..";
        }
*/
        var percentDiff = 0;
        var strAnswer = "";
        var latestUSDequivFromBcId = CurrencyConversions.convertToUSD($scope.latestAsksFromBcId[0][0], 'IDR');

        if(latestUSDequivFromBcId < $scope.getUSDcurrAvg()) {

            percentDiff = calcPercentage(latestUSDequivFromBcId, $scope.getUSDcurrAvg());
            strAnswer = percentDiff.toFixed(2) + "% below";
        }
        else {
            percentDiff = calcPercentage($scope.getUSDcurrAvg(), latestUSDequivFromBcId);
            strAnswer = percentDiff.toFixed(2) + "% above";
        }

        return strAnswer;
    };

    $scope.avgDataReady = function() {
        return angular.isDefined($scope.bitcoinAvgUSDData['global_averages']['last']);
    };

    $scope.getUSDcurrAvg = function() {
        
        //if(angular.isDefined($scope.bitcoinAvgUSDData['global_averages']['last'])) {
            return $scope.bitcoinAvgUSDData['global_averages']['last'];
        //}
        //return "calculating...";
    };

    var calcPercentage = function(smallerNum, largerNum) {
        return 100 - ((smallerNum / largerNum) * 100);
    };

    // get bitcoin average prices in all currencies
    var getBcAvgPrices = function() {

        $http.get("https://api.bitcoinaverage.com/all")
        .success(function(data) {

            $scope.bitcoinAvgUSDData = data['USD'];
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

    var latestExchangeRates = {};

    $http.get("http://openexchangerates.org/api/latest.json?app_id=7bbeb62c36df464cbd9cfa47a9236803")
    .success(function(data) {

        latestExchangeRates = data['rates'];
    });

    return {
        convertToUSD: function (value, origCurrency) {

            return (parseFloat(value) / parseFloat(latestExchangeRates[origCurrency])).toFixed(2);
        },
        isReady: function() {
            return angular.isDefined(latestExchangeRates);
        }
    }
});