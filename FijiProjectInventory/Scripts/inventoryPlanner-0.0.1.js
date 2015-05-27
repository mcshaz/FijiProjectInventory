(function () {
    "use strict";
    var D = new Date('2011-06-02T09:34:29+02:00');
    if (!D || +D !== 1307000069000) {
        Date.fromISO = function (s) {
            var day, tz,
            rx = /^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
            p = rx.exec(s) || [];
            if (p[1]) {
                day = p[1].split(/\D/);
                for (var i = 0, L = day.length; i < L; i++) {
                    day[i] = parseInt(day[i], 10) || 0;
                };
                day[1] -= 1;
                day = new Date(Date.UTC.apply(Date, day));
                if (!day.getDate()) return NaN;
                if (p[5]) {
                    tz = (parseInt(p[5], 10) * 60);
                    if (p[6]) tz += parseInt(p[6], 10);
                    if (p[4] == '+') tz *= -1;
                    if (tz) day.setUTCMinutes(day.getUTCMinutes() + tz);
                }
                return day;
            }
            return NaN;
        }
    }
    else {
        Date.fromISO = function (s) {
            return new Date(s);
        }
    }
})();
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
    var mapArray = function (array, callback) {
        if (Array.prototype.map) { return Array.prototype.map.call(array, callback); }
        return ko.utils.arrayMap(array, callback);
    };

    var purchaseObservedProps = [],
        dateFormat = "d M yy";
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
        var self = this, subscriptions = [],
            onChange = function () { //look for the isModifiedProperty and isDifferent
                self.isChanged(true);
                while (subscriptions.length) {
                    subscriptions.pop().dispose();
                }
            }, lookForChange = function () {
                var j = 0;
                for (; j < purchaseObservedProps.length; j++) {
                    subscriptions.push(self[purchaseObservedProps[j]].subscribe(onChange,self));
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

        self.dispose = function () {
            while (subscriptions.length) {
                subscriptions.pop().dispose();
            }
        };
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
            }, itemNameChange = function () {
                var i = 0,
                    purchases = self.purchaseItems(), l = purchases.length, itemName;
                self.itemNameOptions = [];
                for (; i < l; i++) {
                    itemName = purchases[i].ItemName();
                    if ((itemName || itemName===0) && ko.utils.arrayIndexOf(self.itemNameOptions, itemName) === -1) {
                        self.itemNameOptions.push(itemName);
                    }
                }
                self.itemNameOptions.sort();
            }, itemNameSubscriptions=[],
            clearPurchaseItems = function () {
                while (itemNameSubscriptions.length) {
                    itemNameSubscriptions.pop().dispose();
                };
                ko.utils.arrayForEach(self.purchaseItems, function (el) {
                    el.dispose();
                });
                self.purchaseItems.removeAll();
            },
            deleted = ko.observable(false);

        $(window).on('beforeunload', function (e) {
            if (self.anyForUpdate()) {
                var confirmationMessage = 'If you leave before saving, your changes will be lost.';
                (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
            }
        })

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
            if (deleted()) { return true;}
            for (; i < arr.length; i++) {
                if (arr[i].isChanged()) { return true; };
            }
            return false;
        });

        self.categoryOptions = koMvcGlobals.enumerables.categories;
        self.category = ko.observable().extend({ required: true });

        var dates = mapArray(koMvcGlobals.enumerables.dates, function (el) {
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
            return self.category.isValid() && self.anyForUpdate();
        });

        self.okToCreate = ko.computed(function () {
            return !self.errors().length;
        });

        self.itemNameOptions = [];

        var updateList = function () {
            if (!self.okToCreate()) { return; }
            sendAjax({ categoryId: self.category().Key, projectDateId:self.selectedDate().id }, koMvcGlobals.urls.getPurchases)
                .done(function (data, textStatus, jqXHR) {
                    var items = mapArray(data, function (el) {
                        return new PlannedPurchase(self.totalCost, el);
                    });
                    clearPurchaseItems();
                    self.purchaseItems.push.apply(self.purchaseItems, items);
                    ko.utils.arrayForEach(items, function (el) {
                        itemNameSubscriptions.push(el.ItemName.subscribe(itemNameChange));
                    });
                    itemNameChange();
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Update failed with: " + errorThrown);
                });
        };
        self.category.subscribe(updateList,self);
        self.selectedDate.subscribe(updateList,self)

        self.addProjectDate = ko.observable();
        // Operations
        self.addItem = function () {
            var newItem = new PlannedPurchase(self.totalCost);
            self.purchaseItems.unshift(newItem);
            newItem.errors.showAllMessages();
            itemNameSubscriptions.push(newItem.ItemName.subscribe(itemNameChange,self))
        };
        
        self.removeItem = function (item)
        {
            if (item.PurchaseId == 0){
                self.purchaseItems.remove(item);
            }
            else {
                self.purchaseItems.destroy(item);
                deleted(true);
            }
            item.dispose();
        };

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
            var unmapped = [], awaitUpdate=[], awaitDelete = [];

            ko.utils.arrayForEach(self.purchaseItems(), function (el) {
                if (el.isChanged()) {
                    unmapped.push(koMvcGlobals.mappers.unmappedObject(el));
                    awaitUpdate.push(el);
                } else if (el._destroy) {
                    unmapped.push(koMvcGlobals.mappers.unmappedObject(el));
                    awaitDelete.push(el);
                }
            });
            sendAjax({ data: unmapped, categoryId: self.category().Key, projectDateId: self.selectedDate().id })
                .done(function( data, textStatus, jqXHR ) {
                    var i=0,p;
                    console.assert(data.length == awaitUpdate.length,"array returned from server of unexpected length");
                    for (;i < awaitUpdate.length;i++) {
                        awaitUpdate[i].notifySaved();
                        if (!propertiesToUpdate.length) {
                            for(p in data[i]){ 
                                if (data[i].hasOwnProperty(p) && !ko.isObservable(awaitUpdate[i][p])) {propertiesToUpdate.push(p);}
                            };
                        }
                        ko.utils.arrayForEach(propertiesToUpdate, function (propName) {
                            awaitUpdate[i][propName] = data[i][propName];
                        });
                    }
                    for (i = 0; i < awaitDelete.length; i++) {
                        self.purchaseItems.remove(awaitDelete[i]);
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
})();