// build-dependencies: _
// build-dependencies: updatebarrier, eventstream, property, event
// build-dependencies: helpers

// eventTransformer - should return one value or one or many events
Bacon.fromBinder = function(binder, eventTransformer = _.id) {
  var desc = new Bacon.Desc(Bacon, "fromBinder", [binder, eventTransformer]);
  return new EventStream(desc, function(sink) {
    var unbound = false;
    var shouldUnbind = false;
    var unbind = function() {
      if (!unbound) {
        if ((typeof unbinder !== "undefined" && unbinder !== null)) {
          unbinder();
          return unbound = true;
        } else {
          return shouldUnbind = true;
        }
      }
    };
    var unbinder = binder(function(...args) {
      var ref;
      var value = eventTransformer.apply(this, args);
      if (!(isArray(value) && (((ref = _.last(value)) != null) ? ref._isEvent : undefined))) {
        value = [value];
      }
      var reply = Bacon.more;
      for (var i = 0, event; i < value.length; i++) {
        event = value[i];
        reply = sink(event = toEvent(event));
        if (reply === Bacon.noMore || event.isEnd()) {
          // defer if binder calls handler in sync before returning unbinder
          unbind();
          return reply;
        }
      }
      return reply;
    });
    if (shouldUnbind) {
      unbind();
    }
    return unbind;
  });
};
