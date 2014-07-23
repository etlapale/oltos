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


    // preview.current = id;
  }
  else if (medium.type == "video") {
    $("#prevvideo").attr("src", media.medium);
  }
}

// Scrollable mouse handler
window.oldload = function () {
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
