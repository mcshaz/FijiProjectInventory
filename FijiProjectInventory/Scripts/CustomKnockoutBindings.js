; (function () {
    "use strict";
    ko.bindingHandlers.fadeVisible = {
        /*init: function (element, valueAccessor) {
            // Start visible/invisible according to initial value
            var shouldDisplay = valueAccessor();
            element.css('visibility','visible');
        },*/
        update: function (element, valueAccessor) {
            // On update, fade in/out
            var shouldDisplay = ko.unwrap(valueAccessor());
            shouldDisplay ? $(element).animate({ opacity: 0 }) : $(element).css("opacity",1) /* $(element).fadeIn() */;
        }
    };

    function formatCurrency(symbol, value, precision) {
        return (value < 0 ? "-" : "") + symbol + Math.abs(value).toFixed(precision).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    function rawNumber(val) {
        return Number(val.replace(/[^\d\.\-]/g, ""));
    }

    ko.bindingHandlers.currency = {
        symbol: ko.observable("$"),
        init: function (element, valueAccessor, allBindingsAccessor) {
            //only inputs need this, text values don't write back
            if ($(element).is("input") === true) {
                var underlyingObservable = valueAccessor(),
                    interceptor = ko.computed({
                        read: underlyingObservable,
                        write: function (value) {
                            if (value === "") {
                                underlyingObservable(null);
                            } else {
                                underlyingObservable(rawNumber(value));
                            }
                        }
                    });

                ko.bindingHandlers.value.init(element, function () {
                    return interceptor;
                }, allBindingsAccessor);
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var symbol = ko.unwrap(allBindingsAccessor().symbol !== undefined ? allBindingsAccessor().symbol : ko.bindingHandlers.currency.symbol),
                value = ko.unwrap(valueAccessor());

            if ($(element).is("input") === true) {
                //leave the boxes empty by default
                value = value !== null && value !== undefined && value !== "" ? formatCurrency(symbol, parseFloat(value), 2) : "";
                $(element).val(value);
            } else {
                //text based bindings its nice to see a 0 in place of nothing
                value = value || 0;
                $(element).text(formatCurrency(symbol, parseFloat(value), 2));
            }
        }
    };
    ko.validation.makeBindingHandlerValidatable('currency');
    function formatPercentage(value, precision) {
        return (value < 0 ? "-" : "") + Math.abs(value).toFixed(precision) + "%";
    }

    function rawNumber(val) {
        return Number(val.replace(/[^\d\.\-]/g, ""));
    }

    ko.bindingHandlers.percentage = {
        precision: ko.observable(2),
        init: function (element, valueAccessor, allBindingsAccessor) {
            //only inputs need this, text values don't write back
            if ($(element).is("input") === true) {
                var underlyingObservable = valueAccessor(),
                    interceptor = ko.computed({
                        read: underlyingObservable,
                        write: function (value) {
                            if (value === "") {
                                underlyingObservable(null);
                            } else {
                                underlyingObservable(rawNumber(value));
                            }
                        }
                    });

                ko.bindingHandlers.value.init(element, function () {
                    return interceptor;
                }, allBindingsAccessor);
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var precision = ko.unwrap(allBindingsAccessor().precision !== undefined ? allBindingsAccessor().precision : ko.bindingHandlers.percentage.precision),
                value = ko.unwrap(valueAccessor());

            if ($(element).is("input") === true) {
                //leave the boxes empty by default
                value = value !== null && value !== undefined && value !== "" ? formatPercentage(parseFloat(value), precision) : "";
                $(element).val(value);
            } else {
                //text based bindings its nice to see a 0 in place of nothing
                value = value || 0;
                $(element).text(formatPercentage(parseFloat(value), precision));
            }
        }
    };

    ko.bindingHandlers.enableClick = {
        init: function(element, valueAccessor) {
            $(element).click(function(evt) {
                if (!ko.unwrap(valueAccessor())) {
                    evt.preventDefault();
                    evt.stopImmediatePropagation();
                }
            });
            //begin of 'hack' to move our 'disable' event handler to to of the stack
            var events = $._data(element, "events");
            var handlers = events['click'];
            if (handlers.length == 1) {
                return;
            }
            handlers.splice(0, 0, handlers.pop());
            //end of 'hack' to move our 'disable' event handler to to of the stack
        },
        update: function(element, valueAccessor) {
            var value = !ko.unwrap(valueAccessor());
            ko.bindingHandlers.css.update(element, function() {
                return {
                    disabled_anchor: value
                };
            });
        }
    };
    if (Array.prototype.map) {
        ko.utils.arrayMap = function (array, callback) {
            return Array.prototype.map.call(array, callback);
        }
    };
    ko.utils.getWriteableObservables = function(root){
        var p,
            returnArray = [];
        for (var pName in root) {
            if (pName !== undefined) {
                p = root[pName]
                if (ko.isWritableObservable(p)) {
                    returnArray.push(p);
                }
            }
        }
        return returnArray;
    };
    ko.dirtyFlag = function (root) {
        var result = function () { },
        _writeableProperties,
        _getWriteableProperties = function () {
            if (!_writeableProperties) {
                _writeableProperties = ko.utils.getWriteableObservables(root);
                ko.utils.arrayRemoveItem(_writeableProperties, result);
            }
            return _writeableProperties;
        },
         _initialized = ko.observable(false);

        result = ko.pureComputed({
            read: function () {
                // grab all subscriptions just the first time through
                if (!_initialized()) {
                    ko.utils.arrayForEach(_getWriteableProperties(), function (arrEl) {
                        arrEl();
                    });
                    _initialized(true);
                    return false;
                }

                return true;
            },
            write: function (val) {
                _initialized(val);
            }
        });

        return result;
    };
    var shellFn = function () { } , noMap = function(item){return item;};
    //objArgs:
    //mapOrCreateObservable
    //unmapObservable
    //initialUnmappedObjects
    //addToBottomOfGrid [unshift (add to top) if falsey]
    //existsOnServer [filter function]
    ko.Datagrid = function (objArgs) { 
        var self = this, destroyed = [], anyDeletions = ko.observable(false);
        if (!arguments.length) { objArgs = {}; }
        objArgs.mapOrCreateObservable = objArgs.mapOrCreateObservable || noMap;
        self.unmapObservable = objArgs.unmapObservable || noMap;
        self.initialiseItemFn = function (item) {
            var newItem = objArgs.mapOrCreateObservable(item);
            newItem.errors = ko.validation.group(newItem);
            newItem.isDirty = ko.dirtyFlag(newItem);
            newItem.isValid = ko.computed(function () {
                return !newItem.errors().length;
            });
            newItem.notifyUpdate = newItem.notifyUpdate || shellFn;
            return newItem;
        }
        self.addToBottomOfGrid = objArgs.addToBottomOfGrid;
        self.datagridItems = ko.observableArray(ko.utils.arrayMap(objArgs.initialUnmappedObjects || [], self.initialiseItemFn));

        self.allItemsValid = ko.pureComputed(function () {
            var i = 0, arr = self.datagridItems();
            for (; i < arr.length; i++) {
                if (!arr[i].isValid()) { return false; }
            }
            return true;
        });

        self.anyForUpdate = ko.pureComputed(function () {
            if (anyDeletions()) { return true; }
            var i = 0, arr = self.datagridItems();
            for (; i < arr.length; i++) {
                if (arr[i].isDirty()) { return true; }
            }
            return false;
        });

        self.removeItem = function (item) {
            self.datagridItems.remove(item);
            if (objArgs.existsOnServer(item)) {
                var unMapped = self.unmapObservable(item);
                unMapped._destroy = true;
                destroyed.push(unMapped);
                anyDeletions(true);
            }
            if (item.dispose) { item.dispose(); }
        };

        self.getCUDItems = function () {
            var arr = self.datagridItems(), forUpdate =[], forCreate=[], i = 0;
            for (; i < arr.length; i++) {
                if (!arr[i].isValid()) {
                    throw new Error('tried to call getRequiresUpdate but not all datagridItems are valid');
                } if (arr[i].isDirty()) {
                    if (objArgs.existsOnServer(arr[i])) {
                        forUpdate.push(arr[i]);
                    } else {
                        forCreate.push(arr[i]);
                    }
                }
            }
            return {
                forCreate:ko.utils.arrayMap(forCreate,self.unmapObservable),
                forUpdate: ko.utils.arrayMap(forUpdate, self.unmapObservable),
                forDelete: destroyed, //unmapped to release resources at time of marking
                updateIds: function (serverReturnedItems) {
                    var item, serverItem, i = 0, p;
                    for (; i < forCreate.length; i++) {
                        item = forCreate[i];
                        serverItem = serverReturnedItems[i];
                        for (p in serverItem) {
                            if (serverItem.hasOwnProperty(p)) {
                                if (typeof item[p] === 'function') {
                                    item[p](serverItem[p]);
                                } else {
                                    item[p] = serverItem[p];
                                }
                            }
                        }
                        item.notifyUpdate();
                        item.isDirty(false);
                    }
                    for (i = 0; i < forUpdate.length; i++) {
                        forUpdate[i].notifyUpdate();
                        forUpdate[i].isDirty(false);
                    }
                    destroyed = [];
                    anyDeletions(false);
                }
            };
        };
    };

    ko.Datagrid.prototype.addItem = function (item) {
        var newItem = this.initialiseItemFn(item);
        if (item === undefined) { newItem.isDirty(true); }
        if (this.pushNewItems) {
            this.datagridItems.push(newItem);
        } else {
            this.datagridItems.unshift(newItem);
        }
        newItem.errors.showAllMessages();
    };

    ko.Datagrid.prototype.addItems = function (itemsArray) {
        var mapped = ko.utils.arrayMap(itemsArray, this.initialiseItemFn);
        this.datagridItems.push.apply(this.datagridItems, mapped);
    }

    //slightly misnamed - truthy in case !=null or empty guid string
    ko.Datagrid.anyNonZeroFilter = function(propNameArray) {
        return function (item) {
            var i = 0;
            for (; i < propNameArray.length; i++) {
                if (ko.unwrap(item[propNameArray[i]])) {
                    return true;
                }
            }
            return false;
        }
    }

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

    if (typeof Object.create != 'function') {
        // Production steps of ECMA-262, Edition 5, 15.2.3.5
        // Reference: http://es5.github.io/#x15.2.3.5
        Object.create = (function () {
            // To save on memory, use a shared constructor
            function Temp() { }

            // make a safe reference to Object.prototype.hasOwnProperty
            var hasOwn = Object.prototype.hasOwnProperty;

            return function (O) {
                // 1. If Type(O) is not Object or Null throw a TypeError exception.
                if (typeof O != 'object') {
                    throw TypeError('Object prototype may only be an Object or null');
                }

                // 2. Let obj be the result of creating a new object as if by the
                //    expression new Object() where Object is the standard built-in
                //    constructor with that name
                // 3. Set the [[Prototype]] internal property of obj to O.
                Temp.prototype = O;
                var obj = new Temp();
                Temp.prototype = null; // Let's not keep a stray reference to O...

                // 4. If the argument Properties is present and not undefined, add
                //    own properties to obj as if by calling the standard built-in
                //    function Object.defineProperties with arguments obj and
                //    Properties.
                if (arguments.length > 1) {
                    // Object.defineProperties does ToObject on its first argument.
                    var Properties = Object(arguments[1]);
                    for (var prop in Properties) {
                        if (hasOwn.call(Properties, prop)) {
                            obj[prop] = Properties[prop];
                        }
                    }
                }

                // 5. Return obj
                return obj;
            };
        })();
    }
})();