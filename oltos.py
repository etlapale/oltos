#! /usr/bin/env python

from argparse import ArgumentParser
import codecs
from os import listdir, makedirs, mkdir, symlink, system, walk
from os.path import abspath, basename, dirname, exists, isdir, join, splitext
import re
from sys import argv

from PIL import Image
from PIL.ExifTags import TAGS

from mako.template import Template


movie_extensions = 'avi mov mp4 mpeg mpg'.split()
image_extensions = 'jpeg jpg png tif tiff'.split()
media_extensions = movie_extensions + image_extensions


def is_media_path(path):
    _, ext = splitext(path)
    return ext[0] == '.' and ext[1:].lower() in media_extensions


def symlink_media(media_paths, media_dir):
    '''
    Create a symlink for each media in the generated album.
    '''
    for path in media_paths:
        name = basename(path)
        # Check if already present
        new_path = join(media_dir, name)
        if exists(new_path):
            # TODO: Check if same file
            # TODO: Create a new name
            print('Skipping already imported medium {}'.format(name))
            continue
        # Create a link to the medium
        symlink(path, new_path)


def make_movie_thumbnail(path, preview_dir, thumbs_dir):
    # Fetch date
    fp = open(f, 'rb')
    data = fp.read(2048)
    fp.close()
    m = re.search('[0-9]{4}:[0-9]{2}:[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}', data)
    if m is None:
      return None
    exif = {'DateTimeOriginal': m.group(0)}
    del data
    # Create a preview (big thumbnail)
    tho = join('preview', basename(f) + '.png')
    if not exists (tho):
      system('mplayer %s -ao null -vo png -frames 1' % f)
      img = Image.open('00000001.png')
      try:
        ratio = float(img.size[1])/float(args.prsz)
        img.thumbnail((int(img.size[0]/ratio),
          int(img.size[1]/ratio)))
      except IOError:
        print('Skipping broken: %s' % img.path)
        return None
      img.save(tho)
      tho = join('thumbs', basename(f) + '.png')
      try:
        ratio = float(img.size[1])/float(args.thsz)
        img.thumbnail((int(img.size[0]/ratio),
          int(img.size[1]/ratio)))
        #img.thumbnail((int(args.thsz), int(args.thsz)))
      except IOError:
        print('Skipping broken: %s' % img.path)
        return None
      # Add a video visual marker
      play = Image.open('../play.png')
      img.paste(play, ((img.size[0]-play.size[0])/2,
        (img.size[1]-play.size[1])/2),
        play)
      img.save(tho)
    tho = join('thumbs', basename(f) + '.png')
    img = Image.open(tho)
    # Add the image to the list
    width, height = img.size
    # Warn if the formatted video does not exist
    if not exists(base + '.ogv'):
      print('You need to manually create ' + base + '.ogv')
    # Create a thumbnail
    return (base + '.ogv', exif, tho, width, height, 'video')


def make_image_thumbnail(path, preview_dir, thumbs_dir):
    # Fetch EXIF tags
    img = Image.open(path)
    img.path = path
    exif = {}
    info = img._getexif()
    for tag, value in info.items():
        decoded = TAGS.get(tag, tag)
        exif[decoded] = value

    # Create a preview (big thumbnail)
    tho = join(preview_dir, basename(path))
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
        return None
      # Rotate the thumb
      if 'Orientation' in exif:
          if exif['Orientation'] == 6:
              img = img.rotate(-90)
          elif exif['Orientation'] == 8:
              img = img.rotate(90)
      img.save(tho)
    # Create a thumbnail
    tho = join(thumbs_dir, basename(path))
    if args.force_thumbnail or not exists(tho):
      try:
        ratio = float(img.size[1])/float(args.thsz)
        img.thumbnail((int(img.size[0]/ratio),
          int(img.size[1]/ratio)))
        #img.thumbnail((int(args.thsz), int(args.thsz)))
      except IOError:
        print('Skipping broken: %s' % img.path)
        return None
      img.save(tho)
    img = Image.open(tho)
    # Add the image to the list
    width, height = img.size
    del img
    if not 'DateTimeOriginal' in exif:
      print('Skipping undated image', f)
      return None
    else:
      return {'name': basename(path),
              'path': path,
              'exif': exif,
              'thumb': tho,
              'thumb_width': width,
              'thumb_height': height,
              'type': 'photo'}


if __name__ == '__main__':
    ap = ArgumentParser(description='Generate a gallery')
    ap.add_argument('inputs', nargs='+',
        help='Input photos or photo directories')
    ap.add_argument('--force-thumbnail', dest='force_thumbnail', default=False,
        action='store_true',
        help='Force thumbnail generation')
    ap.add_argument('--template', dest='tmpl', default=None,
        help='Template HTML page')
    ap.add_argument('--preview-size', dest='prsz', default='528',
        help='Preview size')
    ap.add_argument('--thumb-size', dest='thsz', default='96',
        help='Thumbnails size')
    ap.add_argument('--thumbnails', dest='thumbs', default='thumbs',
        help='Thumbnails directory')
    ap.add_argument('--preview-dir', dest='preview', default='preview',
        help='Preview directory')
    ap.add_argument('--media-dir', dest='media', default='media',
        help='Media directory')
    ap.add_argument('-o', '--output', dest='output', default='album',
        help='Output directory')
    args = ap.parse_args()

    # Base directory of the program
    prog_base = abspath(dirname(argv[0]))

    # Search for a web page template
    if args.tmpl is None:
        # In order: locally, at the program base
        for path in ['index.tmpl', join(prog_base, 'index.tmpl')]:
            if exists(path):
                args.tmpl = path
                break
        if not exists(args.tmpl):
            exit('No template file found')

    # Create output directories
    for path in [args.media, args.thumbs, args.preview]:
        makedirs(join(args.output, path), exist_ok=True)

    # Symlink the javascript code
    js_output_dir = join(args.output, 'js')
    if not exists(js_output_dir):
        symlink(join(prog_base, 'js'), js_output_dir)

    # Walk input paths
    media_paths = []
    for path in args.inputs:
        if isdir(path):
            for dirpath,dirnames,filenames in walk(path):
                media_paths = media_paths                                   \
                    + [abspath(join(dirpath,x)) for x in filenames]
        else:
            media_paths.append(abspath(path))

    # Filter by path name
    media_paths = [path for path in media_paths if is_media_path(path)]

    # Add new media as symlinks
    media_dir = join(args.output, args.media)
    symlink_media (media_paths, media_dir)

    # Generate thumbs and preview images
    preview_dir = join(args.output, args.preview)
    thumbs_dir = join(args.output, args.thumbs)
    images = []
    for name in listdir(media_dir):
        path = join(media_dir, name)
        _, ext = splitext(name)
        ext = ext.lower()
        if ext[1:] in movie_extensions:
            ans = make_movie_thumbnail(path, preview_dir, thumbs_dir)
        elif ext[1:] in image_extensions:
            ans = make_image_thumbnail(path, preview_dir, thumbs_dir)
        if ans is not None:
            images.append(ans)

    # Order the images by date
    def exif_date(img):
        if not 'DateTimeOriginal' in img['exif']:
          exit ('missing date time for ' + img['path'])
        return img['exif']['DateTimeOriginal']
    images.sort(key=exif_date, reverse=True)

    # Seperate the images by month
    monthes = {}
    last = ''
    idx = []
    for img in images:
        month = exif_date (img)[:7].replace(':', '-')
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
            path = join(args.output, 'index.html')
        else:
            path = join(args.output, month + '.html')
        images = monthes[month]
        # Get the first image
        first = 0
        for i,img in enumerate(images):
          if img['type'] == 'photo':
            first = i
            break
        # Generate the page
        tmpl = Template(filename=args.tmpl, input_encoding='utf-8',
                output_encoding='utf-8')
        env = {'images': images,
               'monthes': idx,
               'first': first,
               'current': month,
               'last': last,
               'media_dir': args.media,
               'preview_dir': args.preview,
               'thumb_dir': args.thumbs
              }
        data = tmpl.render_unicode(**env)
        fp = open(path, 'w')
        fp.write(data)
        fp.close()
