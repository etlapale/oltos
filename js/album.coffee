months = "JFMAMJJASOND"

makeDateSelector = (dates, hist, minYear, maxYear) ->
    monthSelWidth = 20
    height = 60

    # Create an SVG
    svg = d3.select "#dates"
      .append "svg"
        .attr("class", "date-selector")
        .attr("width", (maxYear-minYear+1)*12*monthSelWidth)
        .attr("height", height)

    # Month groups
    gmonth = svg.selectAll "g"
        .data hist
      .enter().append "g"
        .attr("class", "month-tick")
        .attr("transform", (d, i) ->                 "translate(#{i*monthSelWidth},0)" )
    # Month box
    gmonth.append "rect"
         .attr("class", "month-slice")
         .attr("width", "#{monthSelWidth}px")
         .attr("height", "#{height}")
    g = gmonth.append "g"
        .attr("transform", "translate(0, #{height-monthSelWidth})")
    g.append "rect"
        .attr("class", "month-box")
        .attr("width", "#{monthSelWidth}px")
        .attr("height", "#{monthSelWidth}px")
    # Month names
    g.append "text"
        .attr("class", "month-label")
        .text (d,i) -> months[i%12]
        .attr("dx", "#{monthSelWidth/2}px")
        .attr("dy", "2ex")
        .attr("text-anchor", "middle")

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
        exifFormat = d3.time.format "%Y:%m:%d %X"
        dates = (exifFormat.parse x["date"] for x in json["media"])
        minYear = (d3.min dates).getFullYear()
        maxYear = (d3.max dates).getFullYear()

        # Build an histogram
        hist = ([i,0] for i in [12*minYear..12*(maxYear+1)-1])
        for date in dates
            do (date) ->
                year = date.getFullYear()
                month = date.getMonth()
                idx = 12*(year - minYear) + month
                hist[idx][1]++
        console.log hist

        makeDateSelector(dates, hist, minYear, maxYear)
    )

# Load a default album
loadAlbum "album.json"
