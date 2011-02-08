#! /usr/bin/env python2
# -*- coding: utf-8; -*-


from argparse import ArgumentParser
import codecs
from os import listdir, mkdir
from os.path import basename, dirname, exists, join, splitext
from sys import argv

from PIL import Image
from PIL.ExifTags import TAGS

from mako.template import Template


if __name__ == '__main__':
    ap = ArgumentParser(description='Generate a gallery')
    ap.add_argument('--input-dir', dest='indir', default='.',
        help='Input images directory')
    ap.add_argument('--template', dest='tmpl', default=None,
        help='Template HTML page')
    ap.add_argument('--thumb-size', dest='thsz', default='128',
        help='Thumbnails directory')
    ap.add_argument('--thumbnails', dest='thumbs', default='thumbs',
        help='Thumbnails directory')
    args = ap.parse_args()

    if args.tmpl is None:
        if exists('index.tmpl'):
	    args.tmpl = 'index.tmpl'
	elif exists(join(dirname(argv[0]), 'index.tmpl')):
	    args.tmpl = join(dirname(argv[0]), 'index.tmpl')
	else:
	    exit('No template file found')

    # Create thumbnails directory
    if not exists(args.thumbs):
        mkdir(args.thumbs)

    # List input images
    images = []
    for f in listdir(args.indir):
        if splitext(f)[1] in ['.JPG']:
	    # Fetch EXIF tags
	    img = Image.open(f)
	    img.path = f
	    exif = {}
	    info = img._getexif()
	    for tag, value in info.items():
	        decoded = TAGS.get(tag, tag)
	        exif[decoded] = value
	    # Create a thumbnail
	    tho = join(args.thumbs, basename(f))
	    if not exists(tho):
	      img.thumbnail((int(args.thsz), int(args.thsz)))
	      img.save(tho)
	    # Add the image to the list
	    images.append((f, exif, tho))
	    del img

    # Order the images by date
    def exif_date(img):
        return img[1]['DateTime']
    images.sort(key=exif_date)

    # Generate the webpage
    tmpl = Template(filename=args.tmpl, input_encoding='utf-8', output_encoding='utf-8')
    env = {'images': images}
    data = tmpl.render(**env)
    #fp = codecs.open('index.html', 'w', 'utf-8')
    fp = open('index.html', 'w')
    fp.write(data)
    fp.close()
