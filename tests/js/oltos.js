// Image selected for preview
function mypreview(id) {
  var preview = $(".preview")[0];
  //var thumb = $( "#thumb-" + id )[0];
  preview.src = medias[id].preview;
  preview.current = id;

  var name = $(".info #name")[0];
  name.innerHTML = medias[id].name;
  var meta = $(".info #metadata")[0];
  meta.innerHTML = medias[id].datetime;
}

// Scrollable mouse handler
window.onload = function () {
  var debug = $("#debug");
  var scroll = $(".scrollable");
  scroll.offx = 0;
  var realwidth = $(".scroll").width();

  $(".scrollable").mousemove(function(e) {
    if (realwidth > scroll.width ())
      return;
    //var x = e.pageX - this.offsetLeft + scroll.offset;
    var x = e.pageX - this.offsetLeft - scroll.offx;

    var pos = x / realwidth * scroll.width();
    if (pos + realwidth > scroll.width())
      pos = scroll.width() - realwidth;
    if (pos < 0)
      pos = 0;

    scroll.offx = pos;
    //debug.html("" + pos + "%  (" + x + "/" + scroll.width() + ")");

    //scroll.css("margin-left", offset + " px");
    //scroll.css("margin-left", "-" + pos + "px");
    scroll.css("margin-left", "-" + pos + "px");
  });
};
//
	/*
	var scrollbar = $( ".scrollbar" ).slider({
	    slide : function( event, ui ) {
	      if ( scrollable.width() > scrollpane.width() ) {
		scrollable.css( "margin-left", Math.round(
		    ui.value / 100 * ( scrollpane.width() - scrollable.width() )
		    ) + "px" );
	      } else {
		scrollable.css( "margin-left", 0 );
	      }
	    }
	  });
	  */
	
	/*
	var handleHelper = scrollbar.find( ".ui-slider-handle" )
	  .mousedown(function() {
	      scrollbar.width( handleHelper.width() );
	      })
	.mouseup(function() {
	    scrollbar.width( "100%" );
	    })
	.append( "<span class='ui-icon ui-icon-grip-dotted-vertical'></span>" )
	.wrap( "<div class='ui-handle-helper-parent'></div>" ).parent();
	*/

