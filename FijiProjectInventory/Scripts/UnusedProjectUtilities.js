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
//http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
Math.generateUUID = function generateUUID() {
    var d = performance ? performance.now :
            Date.now ? Date.Now() : (new Date()).getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};