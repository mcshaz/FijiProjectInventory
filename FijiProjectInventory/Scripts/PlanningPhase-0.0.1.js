;(function(){
    "use strict";
    var PlanningPhase = function (data) {
        var self = this;
        ko.utils.extend(self, koMvcGlobals.mappers.mappedObject(data));
    };

    var ViewModel = function () {
        var self = this;
        self.planningPhases = ko.observableArray(ko.utils.arrayMap(koMvcGlobals.initialVals, function(el){
            return new PlanningPhase(el);
        }));
        self.addItem = function () {
            self.planningPhases.unshift(new PlanningPhase());
        };
    };

    ko.applyBindings(new ViewModel());
})();