var arrayGetDistinctObservableValues = function (array) {
    array = array || [];
    var arrayVals = mapArray(array, function (el) { return { obs: el, val: el() } }),
        resultVals = [], i = 0, j = array.length,
        predicate = function (el) {
            return (el.val === arrayVals[i].val);
        };
    for (; i < j; i++) {
        if (ko.utils.arrayFirst(resultVals, predicate) === null) {
            resultVals.push(arrayVals[i]);
        }
    }
    return mapArray(resultVals, function (el) { return el.obs; });
};