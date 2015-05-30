(function () {
    "use strict";
    //take an existing binding handler and make it cause automatic validations
    var makeBindingHandlerValidatable = function (handlerName, validatedPropName) {
        var init = ko.bindingHandlers[handlerName].init;
        ko.bindingHandlers[handlerName].init = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var unwrapped;
            init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
            if (validatedPropName !== undefined) {
                unwrapped = ko.unwrap(valueAccessor())[validatedPropName];
                valueAccessor = function () { return unwrapped; };
            }
            return ko.bindingHandlers['validationCore'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        };
    };

    makeBindingHandlerValidatable("datepicker");
    makeBindingHandlerValidatable("autocomplete");

    //callback function with args value, index, array

    var dateFormat = "d M yy";
    ko.validation.init({
        insertMessages: false,
        decorateInputElement: true,
        errorsAsTitle: true,
        errorClass: 'text-danger',
        registerExtenders: false,
        messagesOnModified: true,
        parseInputAttributes: false,
        messageTemplate: null
    }, true);
    // Class to represent a row in the  grid
    function PlannedPurchase(computedTotal, data) {
        var self = this;
        ko.utils.extend(self, koMvcGlobals.mappers.mappedObject(data));

        //observables
        self.isRepeatItem = ko.observable(false);

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
    };

    // Overall viewmodel for this screen, along with initial state
    function PurchasesViewModel() {
        var self = this;
        ko.Datagrid.call(self, {
            mapOrCreateObservable: function (el) { return new PlannedPurchase(self.totalCost, el) },
            unmapObservable: koMvcGlobals.mappers.unmappedObject,
            existsOnServer: ko.Datagrid.anyNonZeroFilter(koMvcGlobals.idNames)
            });
        var sortAsc = {},
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
            },itemNameChange = ko.computed (function() {
                var i = 0,
                    purchases = self.datagridItems(), l = purchases.length, itemName;
                self.itemNameOptions = [];
                for (; i < l; i++) {
                    itemName = purchases[i].ItemName();
                    if ((itemName || itemName === 0) && ko.utils.arrayIndexOf(self.itemNameOptions, itemName) === -1) {
                        self.itemNameOptions.push(itemName);
                    }
                }
                //self.itemNameOptions.sort();//!TODO use correct already sorted column
                return true;
            });
        self.itemNameOptions = [];
        $(window).on('beforeunload', function (e) {
            if (self.anyForUpdate()) {
                var confirmationMessage = 'If you leave before saving, your changes will be lost.';
                (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
            }
        });

        // Computed data
        self.totalCost = ko.computed(function () {
            var total = 0, arr = self.datagridItems(), i = 0;
            for (; i < arr.length; i++) {
                total += arr[i].ItemsCost();
            }
            return total;
        });

        self.categoryOptions = koMvcGlobals.enumerables.categories;
        self.category = ko.observable().extend({ required: true });

        var dates = ko.utils.arrayMap(koMvcGlobals.enumerables.dates, function (el) {
            var dt = Date.fromISO(el.Value);
            return { id:el.Key, date:dt, formatted:$.datepicker.formatDate(dateFormat,dt)};
        }),
            now = new Date(),
            startDate;
        dates.sort(function (a,b) { return a.date < b.date?-1:a.date>b.date?1:0});
        startDate = ko.utils.arrayFirst(dates, function (el) {
                return el.date > now;
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
            return self.category.isValid() && self.anyForUpdate() && self.allValid();
        });

        self.okToCreate = ko.computed(function () {
            return !self.errors().length;
        });

        var updateList = function () {
            if (!self.okToCreate()) { return; }
            sendAjax({
                categoryId: self.category().Key,
                projectDateId: self.selectedDate().id
            }, koMvcGlobals.urls.getPurchases)
                .done(function (data, textStatus, jqXHR) {
                    self.datagridItems.removeAll();
                    self.addItems(data);
                    //itemNameChange();
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Update failed with: " + errorThrown);
                });
        };
        self.category.subscribe(updateList,self);
        self.selectedDate.subscribe(updateList,self)

        self.addProjectDate = ko.observable();
        // Operations

        self.sort = function (prop, el, event) {
            var ascSort = function (a, b) {
                var ap = ko.unwrap(a[prop]), bp = ko.unwrap(b[prop]);
                return ap < bp ? -1 : ap > bp ? 1 : 0
            },
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

            self.datagridItems.sort(sortFunc);

            //now sorted, set isRepeatItem
            ko.utils.arrayForEach(self.datagridItems(), function (purchaseItem) {
                var name = purchaseItem.ItemName();
                if (name===lastHeaderName) {
                    purchaseItem.isRepeatItem(true);
                } else {
                    purchaseItem.isRepeatItem(false);
                    lastHeaderName = name;
                }
            });
        };

        self.saveChanges = function(){
            var forCUD = self.getCUDItems();
            sendAjax({
                data: forCUD.forCreate.concat(forCUD.forUpdate).concat(forCUD.forDelete),
                categoryId: self.category().Key,
                projectDateId: self.selectedDate().id
            })
                .done(function( data, textStatus, jqXHR ) {
                    forCUD.updateIds(data);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                alert("Update failed with: " + textStatus + errorThrown);
            });
        };

        
        $("form").validate({
            submitHandler: self.save
        });
    }
    PurchasesViewModel.prototype = Object.create(ko.Datagrid.prototype);
    PurchasesViewModel.prototype.constructor = PurchasesViewModel;

    ko.applyBindings(new PurchasesViewModel());
})();