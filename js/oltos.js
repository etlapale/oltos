// Image selected for preview
function mypreview(medium) {
  // Make sure the previous video is stopped
  var vid = $("#prevvideo");
  //for (int i = 0; vid && i < vid.length; i++)
  if (vid && vid.length)
    vid[0].pause ();

  // Make sure we are in the correct mode
  //var displayer = $(".displayer")[0];
  if ($(".displayer")[0].mode != medium.type) {
    if (medium.type == "video") {
      // Remove the video object
      if (vid)
	vid.remove();
      //$(".displayer").append("<video autoplay id=\"prevvideo\" src=\"" + media.name + "\" controls>Video not supported.</video>");
      $(".displayer").append("<video autoplay id=\"prevvideo\" controls>Video not supported.</video>");
      $("#preview").remove ();
    }
    else if (medium.type == "photo") {
      $("#prevlink").append("<img id=\"preview\" src=\"\" />");
      $("#prevvideo").remove ();
    }
    $(".displayer")[0].mode = medium.type;
  }

  if (medium.type == "photo") {
    var preview = $("#preview")[0];
    //var thumb = $( "#thumb-" + id )[0];
    preview.src = "preview/" + medium["name"];

    var prevlink = $("#prevlink")[0];
    prevlink.href = "media/" + medium["name"];

    preview.current = id;
  }
  else if (medium.type == "video") {
    $("#prevvideo").attr("src", media.medium);
  }

  var name = $(".info #name")[0];
  name.innerHTML = medium.name;
  var meta = $(".info #metadata")[0];
  meta.innerHTML = medium.datetime;
}

// Scrollable mouse handler
window.onload = function () {
  // Init
  var preview = $("#preview")[0];
  preview.current = 0;
  $(".displayer")[0].mode = 'photo';

  var debug = $("#debug");
  var scroll = $(".scrollable");
  scroll.offx = 0;
  var realwidth = $(".scroll").width();

  $(".scrollable").mousemove(function(e) {
    if (realwidth > scroll.width ())
      return;
    //var x = e.pageX - this.offsetLeft + scroll.offset;
    var x = e.pageX - this.offsetLeft - scroll.offx;

    var pos = x / realwidth * (scroll.width() - realwidth);
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

function previous() {
  var preview = $("#preview")[0];
  if (preview.current > 0)
    mypreview(preview.current - 1);
}

function next() {
  var preview = $("#preview")[0];
  if (preview.current < medias.length - 1)
    mypreview(preview.current + 1);
}

function onkeyup(e) {
  if (e = e ? e : window.event ? event : null) {
    if (e.keyCode == 37)
      previous();
    else if (e.keyCode == 39)
      next();
  }
}

if (document.addEventListener)
  document.addEventListener("keyup", onkeyup, false);
else
  document.onkeyup = onkeyup;
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
