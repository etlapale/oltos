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

        # Display the histogram
        hplot = histogram()
        d3.select "#dates"
            .datum hist
            .call hplot
    )

# Load a default album
loadAlbum "album.json"
