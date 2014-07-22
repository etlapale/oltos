#! /usr/bin/env python

from argparse import ArgumentParser
import codecs
import json
from os import listdir, makedirs, mkdir, symlink, system, walk
from os.path import abspath, basename, dirname, exists, isdir, join, splitext
import re
from shutil import copyfile
from sys import argv

from PIL import Image
from PIL.ExifTags import TAGS


movie_extensions = 'avi mov mp4 mpeg mpg'.split()
image_extensions = 'jpeg jpg png tif tiff'.split()
media_extensions = movie_extensions + image_extensions


def is_media_path(path):
    _, ext = splitext(path)
    return ext and ext[0] == '.' and ext[1:].lower() in media_extensions


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
    ap.add_argument('-t', '--title', dest='title', default='My album',
        help='Album title')
    args = ap.parse_args()

    # Base directory of the program
    prog_base = abspath(dirname(argv[0]))

    # Create output directories
    for path in [args.media, args.thumbs, args.preview]:
        makedirs(join(args.output, path), exist_ok=True)

    # Symlink stylesheets and scripts
    for dd in ['css', 'js', 'robots.txt']:
        da_output_dir = join(args.output, dd)
        if not exists(da_output_dir):
            symlink(join(prog_base, dd), da_output_dir)

    # Do some hard copies
    copyfile(join(prog_base, 'html', 'index.html'),
             join(args.output, 'index.html'))

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

    # Generate JSON metadata
    album_meta = {
      'title': args.title,
      'preview_dir': args.preview,
      'thumbs_dir': args.thumbs,
      'thumbs_height': args.thsz,
      'media': [{'name': img['name'],
                 'date': img['exif']['DateTimeOriginal'],
                 'thumb_width': img['thumb_width'],
                 'type': img['type']
                } for img in images]
    }
    fp = open(join(args.output, 'album.json'), 'w')
    fp.write(json.dumps(album_meta))
