showMedium = (medium, year, month, selMedia) ->
    # Image loading, show spinning state
    preview = d3.select "#preview"
        .style("opacity", 0.3)
    spinner = d3.select "#preview-load-spinner"
        .classed("fa-spin", true)
        .style("display", "inline")
    spinner.style
      "top": "#{(preview[0][0].height - spinner[0][0].clientHeight)/2}px"
      "left": "#{(preview[0][0].width - spinner[0][0].clientWidth)/2}px"

    # Preload the image to be notified
    img = new Image;
    img.src = "preview/#{medium['name']}"

    # Image loaded, restore normal state
    normalState = () ->
        preview.attr("src", img.src)
        spinner.classed("fa-spin", false)
            .style("display", "none")
        preview.style("opacity", 1.0)

    img.onload = normalState

    # Update the preview medium
    d3.select "#prevlink"
        .attr("href", "media/#{medium['name']}")

    # Display medium metadata
    d3.select "#medium-name"
        .text medium["name"]
    d3.select "#medium-date"
        .text medium["date"]

    # Update browser URL
    window.location.hash = "##{year}-#{+month+1}-#{medium['name']}"

    # Update previous/next links
    idx = selMedia.indexOf medium
    d3.select ".previous-medium"
        .classed("medium-nav-disabled", idx<=0)
        .on("click", () -> if idx > 0
            showMedium(selMedia[idx-1], year, month, selMedia))
    d3.select ".next-medium"
        .classed("medium-nav-disabled", idx<0 or idx >= selMedia.length - 1)
        .on("click", () -> if idx >= 0 and idx < selMedia.length - 1
            showMedium(selMedia[idx+1], year, month, selMedia))

exifFormat = d3.time.format "%Y:%m:%d %X"

selectMonth = (month, json) ->
    monthId = month
    media = json['media']
    year = Math.floor month / 12
    month = month % 12

    # List selected media
    selectedMedium = (m) ->
        date = exifFormat.parse m["date"]
        date.getFullYear() == year && date.getMonth() == month
    selMedia = (m for m in media when selectedMedium m)
    console.log "Displaying #{selMedia.length} photos for #{month} #{year}"

    # Sort media by date
    selMedia.sort((a,b) -> a["date"] < b["date"])

    thumbBox = d3.select "#thumbs"
    thumbs = thumbBox.selectAll "img"
        .data selMedia
    thumbs.enter().append "img"
    thumbs.attr("src", (d) -> "#{json['thumbs_dir']}/#{d['name']}")
        .attr("width", (d) -> "#{d['thumb_width']}px")
        .attr("height", (d) -> "#{json['thumbs_height']}px")
        .attr("alt", (d) -> "#{d['name']}")
        .attr("id", (d,i) -> "thumb-#{i}")
        .on("click", (d) -> showMedium(d, year, month, selMedia))
    thumbs.exit().remove()

    # Show the first medium
    if selMedia.length
        showMedium(selMedia[0], year, month, selMedia)
    else
        emptyMedium =
            name: ""
            date: ""
            type: "photo"
        showMedium(emptyMedium, year, month, selMedia)

    # Reset the media selector scroll
    d3.select ".scrollable"
        .style("margin-left", "0px")

    # Mark as displayed month
    d3.select ".selected-date"
        .classed("selected-date", false)
    d3.select "#month-tick-#{monthId}"
        .classed("selected-date", true)

    # Return the list of selected media
    selMedia

window.onload = () ->
    window.oldload()

months = "jfmamjjasond"

makeDateSelector = (dates, hist, minYear, maxYear, json) ->
    monthSelWidth = 20
    height = 60

    # Histogram scale
    hscale = d3.scale.linear()
        .range([0, height-monthSelWidth])
        .domain([0, d3.max(hist, (d) -> d[1])])

    # Create an SVG
    datesDiv = d3.select "#dates"
    datesView = datesDiv.append "div"
        .attr("class", "dates-view")
    svg = datesView.append "svg"
        .attr("class", "date-selector")
        .attr("width", (maxYear-minYear+1)*12*monthSelWidth)
        .attr("height", height)

    # Month groups
    gmonth = svg.selectAll "g"
        .data hist
      .enter().append "g"
        .attr("id", (d) -> "month-tick-#{d[0]}")
        .attr("class", "month-tick")
        .attr("transform", (d, i) ->                 "translate(#{i*monthSelWidth},0)" )
    # Month box
    gmonth.append "rect"
         .attr("class", "month-slice")
         .attr("width", "#{monthSelWidth}px")
         .attr("height", "#{height}")
         .attr("pointer-events", "all")
         .on("click", (d) -> selectMonth(d[0], json))
    g = gmonth.append "g"
        .attr("transform", "translate(0, #{height-monthSelWidth})")
    g.append "rect"
        .attr("class", "month-box")
        .attr("width", "#{monthSelWidth}px")
        .attr("height", "#{monthSelWidth}px")
        .on("click", (d) -> selectMonth(d[0], json))
    # Month names
    g.append "text"
        .attr("class", "month-label")
        .text (d,i) -> months[i%12]
        .attr("dx", "#{monthSelWidth/2}px")
        .attr("dy", "2ex")
        .attr("text-anchor", "middle")
        .on("click", (d) -> selectMonth(d[0], json))

    # Histogram box
    gmonth.append "g"
        .attr("transform", (d) -> "translate(0, #{height-monthSelWidth-hscale(d[1])})")
      .append "rect"
        .attr("class", "month-hist-box")
        .attr("width", "#{monthSelWidth}px")
        .attr("height", (d) -> "#{hscale(d[1])}px")
        .on("click", (d) -> selectMonth(d[0], json))

    # Year separators
    gmonth.append "g"
        .filter (d,i) -> i%12 == 0
        .attr("width", "5em")
        # .attr("height", "20px")
      .append "text"
        .text (d,i) -> "#{minYear+i}"
        .attr("dx", ".5em")
        .attr("dy", "1.8ex")
        .attr("class", "year-label")
        .on("click", (d,i) -> selectMonth(12*(minYear+i), json))

    # Scrollbar
    scrollableWidth = svg.attr "width"
    scrollviewWidth = datesDiv[0][0].offsetWidth
    if scrollviewWidth < scrollableWidth
        viewElem = datesView[0][0]

        bar = datesDiv.append "svg"
            .attr("class", "scrollbar")
            .attr("width", "#{scrollviewWidth}px")
            .attr("height", "6px")
            .style("position", "absolute")
        bar.append "rect"
            .attr("class", "scrollbg")
             .attr("width", "#{scrollviewWidth}px")
             .attr("height", "6px")
        barG = bar.append "g"
        bar = barG.append "rect"
            .attr("class", "scrollrect")
             .attr("width", "#{scrollviewWidth*scrollviewWidth/scrollableWidth}px")
             .attr("height", "6px")
             .attr("rx", "3px")
             .attr("ry", "3px")
             .call(d3.behavior.drag()
               .on("drag", () ->
                   viewElem.scrollLeft = Math.max(0, viewElem.scrollLeft + d3.event.dx)
                 ))
        datesView.on("scroll", () ->
            barG.attr("transform", "translate(#{viewElem.scrollLeft*scrollviewWidth/scrollableWidth},0)")
          )


loadAlbum = (url) ->
    console.log "Loading album from #{url}"
    d3.json(url, (error, json) ->
        if error
            return console.warn(err)

        # Update album title
        d3.select "title"
            .text json['title']
        d3.select "#album-title"
            .text json['title']

        # Convert media dates
        # TODO: convert all media dates in place
        dates = (exifFormat.parse x["date"] for x in json["media"])
        minYear = (d3.min dates).getFullYear()
        maxDate = d3.max dates
        maxYear = maxDate.getFullYear()

        # Build an histogram
        hist = ([i,0] for i in [12*minYear..12*(maxYear+1)-1])
        for date in dates
            do (date) ->
                year = date.getFullYear()
                month = date.getMonth()
                idx = 12*(year - minYear) + month
                hist[idx][1]++

        makeDateSelector(dates, hist, minYear, maxYear, json)

        # Get a month/medium from URL hash
        match = /#(\d{4})-(\d{1,2})(-(.*))?/.exec window.location.hash
        if match
            year = match[1]
            month = +match[2] - 1
            selMedia = selectMonth((+year)*12 + month, json)
            mediumName = match[4]
            if mediumName
                matchMedia = (x for x in json["media"] when x["name"] == mediumName)
                if matchMedia.length
                    showMedium(matchMedia[0], year, month, selMedia)
        # Default to last month
        else
            selectMonth(maxYear*12 + maxDate.getMonth(), json)

    )

# Load a default album
loadAlbum "album.json"
