loadAlbum = (url) ->
    console.log "Loading album from #{url}"
    d3.json(url, (error, json) ->
        if error
            return console.warn(err)
        console.log json

        # Update album title
        d3.select "#album-title"
            .text(json['title'])

        # Create by-date filters
        years = [x["date"] for x in json["media"]]
        console.log years
    )

# Load a default album
loadAlbum "album.json"
