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
            var shouldDisplay = valueAccessor();
            shouldDisplay ? element.css('visibility', 'visible') /* $(element).fadeIn() */ : $(element).fadeOut();
        }
    };


    ko.bindingHandlers.datepicker = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var $el = $(element);

            //initialize datepicker with some optional options
            var options = allBindingsAccessor().datepickerOptions || {};
            $el.datepicker(options);

            //handle the field changing
            //ko.bindingHandlers.validationCore.init(element, valueAccessor, allBindingsAccessor);
            ko.utils.registerEventHandler(element, "change", function () {
                var observable = valueAccessor();
                observable($el.datepicker("getDate"));
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $el.datepicker("destroy");
            });

        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                $el = $(element),
                current = $el.datepicker("getDate");

            if (value - current !== 0) {
                $el.datepicker("setDate", value);
            }
        }
    };
    ko.validation.makeBindingHandlerValidatable('datepicker');

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
})();