import Control.Applicative
import Data.List
import System.Directory

import Data.Time
import Filesystem.Path.CurrentOS (decodeString)
import Graphics.Exif as Exif
import Graphics.ImageMagick.MagickWand
import System.Locale (defaultTimeLocale)

data Media = Photo { path :: FilePath
                   , date :: LocalTime
                   }
  deriving Show

main = do
  ls <- listMedia
  print ls

listMedia :: IO [Media]
listMedia = do
  img <- filter isImage <$> (getCurrentDirectory >>= getDirectoryContents)
  mapM parseImage $ take 40 img

isImage = hasExt [".JPG", ".jpg"]
isVideo = hasExt [".AVI", ".MOV"]
hasExt s x = any (`isSuffixOf` x) s

parseImage :: FilePath -> IO Media
parseImage p = do
  print p
  -- Fetch image metadata
  exif <- Exif.fromFile p
  Just date <- Exif.getTag exif "DateTimeOriginal"
  Just orie <- Exif.getTag exif "Orientation"
  let vert = orie `elem` ["Left-bottom", "Right-top"]
  let time = readTime defaultTimeLocale "%Y:%m:%d %T" date
  -- Create large preview
  withMagickWandGenesis $ do
    (_,w) <- magickWand
    img <- readImage w $ decodeString p
    wh <- getImageWidth w
    ht <- getImageHeight w
    let ratio = fromIntegral (if vert then wh else ht) / fromIntegral previewHeight
    magickIterate w $ \p -> do
      resizeImage p (floor $ fromIntegral wh / ratio)
                  (floor $ fromIntegral ht / ratio)
                  lanczosFilter 1.0
      return ()
    writeImages w (decodeString $ "previews/" ++ p) True
    return ()
  --Right img <- readImage p
  return $ Photo p time

previewHeight = 528
