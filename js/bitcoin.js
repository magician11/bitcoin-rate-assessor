var bitcoinApp = angular.module('bitcoin', ['firebase', 'mm.foundation']);

bitcoinApp.controller("BitcoinCtrl", function($scope, CurrencyConversions, $firebase) {

    $scope.bitcoinExchanges = [];
    $scope.latestAsksFromBcId = [];
    $scope.bitcoinAvgPrices = CurrencyConversions.getBTCAvgPrices();

    // calculate the percentage difference between the current cheapest ask on bitcoin.co.id and a USD buy value
    var calcPercentDifference = function(usdValue) {

        var latestUSDequivFromBcId = CurrencyConversions.convertToUSD($scope.latestAsksFromBcId[0].btcValue, 'IDR');

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

    var ref, sync;

    // get BTC buyers
    ref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/buyers');
    sync = $firebase(ref);
    $scope.bitcoinExchanges = sync.$asArray();

    // get bitcoin average prices in all currencies
    ref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/currencies');
    sync = $firebase(ref);
    var syncObject = sync.$asObject();
    syncObject.$bindTo($scope, "bitcoinAvgPrices");


    // get current sells for bitcoin at bitcoin.co.id
    var bcIdref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/sellers/bitcoincoid/sells');
    var syncSells = $firebase(bcIdref);
    $scope.latestAsksFromBcId = syncSells.$asArray();
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
                    currTotal += +scope.latestAsksFromBcId[i].btcAmnt;
                }

                return currTotal.toFixed(8);
            }
        }
    };
});

bitcoinApp.directive("currencyConvert", function(CurrencyConversions) {
    return {
        restrict: 'A',
        scope: {
            idrval: '@'
        },
        template: '<span class="has-tip" tooltip="${{convertIDRtoUSD(idrval)}} USD" tooltip-animation="false">{{idrval}}</span>',
        link: function(scope) {
            scope.convertIDRtoUSD = function(idrValue) {

                return CurrencyConversions.convertToUSD(idrValue, 'IDR');
            };
        }
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

bitcoinApp.controller("ModalAlertCtrl", function($scope, $modal, $log) {

    $scope.open = function () {

        var modalInstance = $modal.open({
            templateUrl: 'myModalContent.html',
            controller: ModalInstanceCtrl
        });

    };
});

var ModalInstanceCtrl = function ($scope, $modalInstance, $firebase) {

    $scope.alertForm = {};

    $scope.submitAlert = function () {
        // write the new alert to the db
        var ref = new Firebase('https://luminous-fire-4988.firebaseio.com/bitcoin/alerts');
        var sync = $firebase(ref);
        var alertData = {};
        alertData[$scope.alertForm.name] = {email: $scope.alertForm.email, percentDiff: $scope.alertForm.percentDiff};
        sync.$update(alertData);

        $scope.alertForm.success = true; // display success message and hide form
    };

    $modalInstance.opened.then(function() {

        $scope.alertForm.name = '';
        $scope.alertForm.email = '';
        $scope.alertForm.percentDiff = '';
        $scope.alertForm.success = false;
    });

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};
