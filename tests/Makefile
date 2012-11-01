AVI_SOURCES=$(wildcard *.AVI *.MOV)
OGV_TARGETS=$(patsubst %.MOV, %.ogv, $(patsubst %.AVI, %.ogv, $(AVI_SOURCES)))
SRV=neil@ovo:www/olivier
THUMBS=thumbs/*.JPG thumbs/*.jpg thumbs/*.png
PREVIEW=preview/*.JPG preview/*.jpg preview/*.png
RFLAGS=-vz --size-only --progress

.PHONY: all sync vids

all: sync

sync: vids
	rsync --copy-links $(RFLAGS) *.css *.txt *.html *.JPG *.jpg *.ogv $(SRV)/
	rsync $(RFLAGS) $(THUMBS) $(SRV)/thumbs/
	rsync $(RFLAGS) $(PREVIEW) $(SRV)/preview/

vids: $(OGV_TARGETS)

%.ogv: %.AVI
	ffmpeg2theora $< -o $@ -y 528

%.ogv: %.MOV
	ffmpeg2theora $< -o $@ -y 528
