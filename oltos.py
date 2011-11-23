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
    ap.add_argument('--force-thumbnail', dest='force_thumbnail', default=False,
        action='store_true',
        help='Force thumbnail generation')
    ap.add_argument('--input-dir', dest='indir', default='.',
        help='Input images directory')
    ap.add_argument('--template', dest='tmpl', default=None,
        help='Template HTML page')
    ap.add_argument('--preview-size', dest='prsz', default='528',
        help='Preview size')
    ap.add_argument('--thumb-size', dest='thsz', default='96',
        help='Thumbnails size')
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
            # Create a preview (big thumbnail)
            tho = join('preview', basename(f))
            if args.force_thumbnail or not exists(tho):
              try:
                if 'Orientation' in exif and exif['Orientation'] in [6,8]:
                  ratio = float(img.size[0])/float(args.prsz)
                else:
                  ratio = float(img.size[1])/float(args.prsz)
                img.thumbnail((int(img.size[0]/ratio),
                  int(img.size[1]/ratio)))
                #img.thumbnail((int(args.thsz), int(args.thsz)))
              except IOError:
                print('Skipping broken: %s' % img.path)
                continue
              # Rotate the thumb
              if 'Orientation' in exif:
                  if exif['Orientation'] == 6:
                      img = img.rotate(-90)
                  elif exif['Orientation'] == 8:
                      img = img.rotate(90)
              img.save(tho)
            # Create a thumbnail
            tho = join(args.thumbs, basename(f))
            if args.force_thumbnail or not exists(tho):
              try:
                ratio = float(img.size[1])/float(args.thsz)
                img.thumbnail((int(img.size[0]/ratio),
                  int(img.size[1]/ratio)))
                #img.thumbnail((int(args.thsz), int(args.thsz)))
              except IOError:
                print('Skipping broken: %s' % img.path)
                continue
              img.save(tho)
            img = Image.open(tho)
            # Add the image to the list
            width, height = img.size
            images.append((f, exif, tho, width, height))
            del img

    # Order the images by date
    def exif_date(img):
        return img[1]['DateTime']
    images.sort(key=exif_date, reverse=True)

    # Seperate the images by month
    monthes = {}
    last = None
    idx = []
    for img in images:
        month = img[1]['DateTime'][:7].replace(':', '-')
        # Store monthes indexes
        if not month in idx:
            idx.append(month)
        # Organise the images
        if not month in monthes:
            monthes[month] = [img]
        else:
            monthes[month].append(img)
        # Store the last month
        if month > last:
            last = month
    idx.sort(reverse=True)

    # Generate the webpages
    for month in monthes:
        # Configure the generation
        if month == last:
            path = 'index.html'
        else:
            path = month + '.html'
        images = monthes[month]
        # Gernerate the page
        tmpl = Template(filename=args.tmpl, input_encoding='utf-8',
                output_encoding='utf-8')
        env = {'images': images, 'monthes': idx, 'last': last}
        data = tmpl.render(**env)
        #fp = codecs.open('index.html', 'w', 'utf-8')
        fp = open(path, 'w')
        fp.write(data)
        fp.close()
