; (function () {
    "use strict";

    //take an existing binding handler and make it cause automatic validations
    var makeBindingHandlerValidatable = function (handlerName, validatedPropName) {
        var init = ko.bindingHandlers[handlerName].init;
        ko.bindingHandlers[handlerName].init = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var unwrapped;
            init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
            if (validatedPropName != undefined) {
                unwrapped = ko.unwrap(valueAccessor())[validatedPropName];
                valueAccessor = function () { return unwrapped; };
            }
            return ko.bindingHandlers['validationCore'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        };
    };
    makeBindingHandlerValidatable('jqAuto', 'value');

    //callback function with args value, index, array
    var mapArray = function (array, callback) {
        if (Array.prototype.map) { return Array.prototype.map.call(array, callback); }
        return ko.utils.arrayMap(array, callback);
    };

    var arrayGetDistinctObservableValues = function (array) {
        array = array || [];
        var arrayVals= mapArray(array, function (el) { return { obs:el, val:el()} }),
            resultVals = [], i = 0, j = array.length,
            predicate = function (el) {
                return (el.val === arrayVals[i].val);
        };
        for (; i < j; i++) {
            if (ko.utils.arrayFirst(resultVals, predicate) === null) {
                resultVals.push(arrayVals[i]);
            }
        }
        return mapArray(resultVals, function (el) { return el.obs;});
    };

    var purchaseObservedProps = [],
        dateFormat = "d M yy";
    ko.validation.init({
        insertMessages: false,
        decorateInputElement: true,
        errorsAsTitle: true,
        errorClass: 'has-error',
        registerExtenders: false,
        messagesOnModified: true,
        parseInputAttributes: false,
        messageTemplate: null
    }, true);
    // Class to represent a row in the  grid
    function PlannedPurchase(computedTotal, data) {
        var self = this, subscriptions = [],
            onChange = function () { //look for the isModifiedProperty and isDifferent
                self.isChanged(true);
                while (subscriptions.length) {
                    subscriptions.pop().dispose();
                }
            }, lookForChange = function () {
                var j = 0;
                for (; j < purchaseObservedProps.length; j++) {
                    subscriptions.push(self[purchaseObservedProps[j]].subscribe(onChange));
                }
            };
        ko.utils.extend(self, koMvcGlobals.mappers.mappedObject(data));
        //self.PricePerBox = self.PricePerBox.currency(); //-I suspect I would have to bind this before extending validation
        if (!purchaseObservedProps.length) {
            var p;
            for (p in self) {
                if (self.hasOwnProperty(p) && ko.isWriteableObservable(self[p])) {
                    purchaseObservedProps.push(p);
                }
            }
        }
        //observables
        self.errors = ko.validation.group(self);

        self.IsRepeatItem = ko.observable(false);
        self.isChanged = ko.observable(false);
        lookForChange();

        self.notifySaved = function () {
            self.isChanged(false)
            lookForChange();
        }


        self.ItemsCost = ko.computed(function () {
            return self.PricePerBox() * self.Boxes();
        });

        self.SingleItemCost = ko.computed(function () {
            if (self.ItemsPerBox())
            {
                return self.PricePerBox() / self.ItemsPerBox();
            }
            return 0;
        });

        self.ItemsPurchased = ko.computed(function () {
            return self.ItemsPerBox() * self.Boxes();
        });

        self.ItemTotalPercent = ko.computed(function () {
            var total = computedTotal();
            if (!total) { return "N/A"; }
            total = 100 * self.ItemsCost() / total;
            return Number(total.toPrecision(2)) + "%";
        });

        self.isValid = ko.computed(function () {
            return self.errors().length === 0;
        });
    };


    // Overall viewmodel for this screen, along with initial state
    function PurchasesViewModel() {
        var self = this, sortAsc = {},
            unloadfunc = function(){
                confirmationMessage = 'If you leave before saving, your changes will be lost.';
                (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
            },
            //data must be an object including the name of the arguments on the MVC method
            sendAjax = function (data, url) {
                var options = {
                    data: data,
                    type: 'POST',
                    dataType: 'json'
                };
                options.data.__RequestVerificationToken = $('input[name="__RequestVerificationToken"]')[0].value;
                if (typeof url == 'string') {
                    options.url = url;
                }
                return $.ajax(options);
            };

        // Editable data
        self.purchaseItems = ko.observableArray([]);

        // Computed data
        self.totalCost = ko.computed(function () {
            var total = 0, arr = self.purchaseItems(), i = 0;
            for (; i < arr.length; i++) {
                if (!arr[i]._destroy) {
                    total += arr[i].ItemsCost();
                }
            }
            return total;
        });

        self.allValid = ko.computed(function () {
            var i = 0, arr = self.purchaseItems();
            for (; i < arr.length; i++) {
                if (!(arr[i].isValid() || arr[i]._destroy)) { return false; }
            }
            return true;
        });

        self.anyForUpdate = ko.computed(function () {
            var i = 0, arr = self.purchaseItems();
            for (; i < arr.length; i++) {
                if (arr[i].isChanged() || arr[i]._destroy) { return true; };
            }
            return false;
        });

        self.anyForUpdate.subscribe(function (newVal) {
            if (newVal) {
                $(window).on('beforeunload', unloadfunc);
            } else {
                $(window).off('beforeunload', unloadfunc);
            }
        });

        self.categoryOptions = koMvcGlobals.enumerables.categories;
        self.category = ko.observable().extend({ required: true });

        var dates = mapArray(koMvcGlobals.enumerables.dates, function (el) {
            var dt = new Date(el);
            return { date:dt, formatted:$.datepicker.formatDate(dateFormat,dt)};
        }),
            now = new Date(),
            startDate;
        dates.sort(function (a,b) { return a.date < b.date?-1:a.date>b.date?1:0});
        startDate = ko.utils.arrayFirst(dates, function (el) {
                return el > now;
            }, self);
        dates.reverse();
        if (!startDate) { startDate = dates[0]; }
        self.dates = ko.observableArray(dates);
        self.selectedDate = ko.observable(startDate).extend({required:true});

        self.errors = ko.validation.group(self);
        self.IsValid = ko.computed(function () {
            self.allValid() && (self.errors().length === 0);
        });
        self.errors.showAllMessages();

        self.okToSave = ko.computed(function () {
            return self.category.isValid() && self.anyForUpdate();
        });

        self.okToCreate = ko.computed(function () {
            return !self.errors().length;
        });

        self.itemNameOptions = ko.observableArray([]);

        var updateList = function () {
            if (!self.okToCreate()) { return; }
            sendAjax({ categoryId: self.category().Key, projectDate:self.selectedDate().date.toISOString() }, koMvcGlobals.urls.getPurchases)
                .done(function (data, textStatus, jqXHR) {
                    var items = mapArray(data, function (el) {
                        return new PlannedPurchase(self.totalCost, el);
                    }),
                        itemNames = mapArray(items, function (el) { return el.ItemName;}),
                        distinctItemNames = arrayGetDistinctObservableValues(itemNames);
                    self.purchaseItems.removeAll();
                    self.purchaseItems.push.apply(self.purchaseItems, items);
                    self.itemNameOptions.push.apply(self.itemNameOptions, distinctItemNames);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Update failed with: " + errorThrown);
                });
        };
        self.category.subscribe(updateList);
        self.selectedDate.subscribe(updateList)

        self.addProjectDate = ko.observable();
        // Operations
        self.addItem = function () {
            var newItem = new PlannedPurchase(self.totalCost);
            self.purchaseItems.unshift(newItem);
            newItem.errors.showAllMessages();
            self.itemNameOptions.push(newItem.ItemName);
        };
        self.removeItem = function (item)
        {
            if (item.PurchaseId == 0){
                self.purchaseItems.remove(item);
            }
            else {
                self.purchaseItems.destroy(item);
            }
        };

        self.sort = function (prop, el, event) {
            var ascSort = function (a, b) { return a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0 },
                descSort = function (a, b) { return ascSort(b, a); },
                sortFunc, lastHeaderName='';
                        //if self header was just clicked a second time
            if (typeof sortAsc[prop] == 'undefined') {
                sortFunc = ascSort;
                sortAsc[prop] = true; //first click, remember it
            } else {
                sortAsc[prop] = !sortAsc[prop];
                sortFunc = sortAsc[prop] ? ascSort : descSort;
            }

            self.purchaseItems.sort(sortFunc);

            //now sorted, set isRepeatItem
            ko.utils.arrayForEach(self.purchaseItems(), function (purchaseItem) {
                var name = purchaseItem.ItemName();
                if (name===lastHeaderName) {
                    purchaseItem.IsRepeatItem(true);
                } else {
                    purchaseItem.IsRepeatItem(false);
                    lastHeaderName = name;
                }
            });
        };
        var propertiesToUpdate = [];
        self.saveChanges = function(){
            var unmapped = [], awaitingUpdate=[];

            ko.utils.arrayForEach(self.purchaseItems(), function (el) {
                if (el.isChanged()) {
                    unmapped.push(koMvcGlobals.mappers.unmappedObject(el));
                    awaitingUpdate.push(el);
                }
            });
            sendAjax({data: unmapped, categoryId: self.category().Key})
                .done(function( data, textStatus, jqXHR ) {
                    var i=0,p;
                    console.assert(data.length == awaitingUpdate.length,"array returned from server of unexpected length");
                    for (;i < awaitingUpdate.length;i++) {
                        awaitingUpdate[i].notifySaved();
                        if (!propertiesToUpdate.length) {
                            for(p in data[i]){ 
                                if (data[i].hasOwnProperty(p) && !ko.isObservable(awaitingUpdate[i][p])) {propertiesToUpdate.push(p);}
                            };
                        }
                        ko.utils.arrayForEach(propertiesToUpdate, function (propName) {
                            awaitingUpdate[i][propName] = data[i][propName];
                        });
                    }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                alert("Update failed with: " + errorThrown);
            });
        };

        
        $("form").validate({
            submitHandler: self.save
        });
    }

    ko.applyBindings(new PurchasesViewModel());
    ko.validation.makeBindingHandlerValidatable('datepicker');
    ko.validation.makeBindingHandlerValidatable('jqAuto');
})();