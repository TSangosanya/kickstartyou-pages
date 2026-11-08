  // A private link from the emails (?c=...) is read here, then taken out of the address before anything else loads.
  // Only the code is taken out: UTM tags stay so analytics can see which email the visit came from.
  (function () {
    var m = /[?&]c=([^&#]*)/.exec(location.search);
    window.KSY_MORE_CODE = m ? decodeURIComponent(m[1]) : '';
    if (m) {
      var rest = location.search.replace(/([?&])c=[^&#]*(&|$)/, '$1').replace(/[?&]$/, '');
      try { history.replaceState(null, '', location.pathname + rest + location.hash); } catch (e) { /* fine */ }
    }
  })();
