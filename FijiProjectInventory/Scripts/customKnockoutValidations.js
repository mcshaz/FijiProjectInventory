(function () {
    "use strict";
    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }
    // ensure propert(ies) of all items is unique
    //if a comma seperateed list of values is passed, it ensures the combination is unique
    //i.e. validates equivalent sql unique constraint containing multiple fields
    ko.validation.rules['uniqueConstraint'] = {
        validator: function (arr, itemPropertyNames) {
            if (!Array.isArray(arr)) {
                throw new TypeError("[uniqueConstraint] must extend an observableArray");
            }
            if (!Array.isArray(itemPropertyNames)) {
                itemPropertyNames = [itemPropertyNames];
            }

            //console.log('arrayItemsPropertyValueUnique', array, arrayItemPropertyName);

            var vals = [], v, stringJoinHash = '`\r', i = 0,
                mapToValues = function (pName) {
                    return ko.unwrap(arr[i][pName]);
                };

            for (; i < arr.length; i++) {
                v = ko.utils.arrayMap(itemPropertyNames, mapToValues).join(stringJoinHash);
                if (ko.utils.arrayIndexOf(vals, v) != -1) {
                    return false;
                } else {
                    vals.push(v);
                }
            }

            return true;
        },
        message: "The items in '{0}' do not have a unique value."
    };
    ko.validation.registerExtenders();
    /*
    //must be in its own extend call, AFTER at least 1 validation has been added
    ko.extenders.syncModified = function (target) {
        target.isModified.subscribe(function (val) {
            var obj = ko.unwrap(target);
            if (Arrai.isArray(obj))
                ko.utils.arrayForEach(obj, function (t) {
                    if (t.isModified)
                        t.isModified(val);
                    else
                        ko.utils.objectForEach(t, function (_, t2) {
                            t2.isModified && t2.isModified(val);
                        });
                });
            else
                ko.utils.objectForEach(obj, function (_, t) {
                    t.isModified && t.isModified(val);
                });
        });
        return target;
    };
    */
})();