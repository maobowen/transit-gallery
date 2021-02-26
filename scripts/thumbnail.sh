#!/bin/bash

ORIGINAL_FOLDER="original"
THUMBNAIL_FOLDER="thumbnails"

if [ ! -d "${ORIGINAL_FOLDER}" ]; then
  echo "Folder '${ORIGINAL_FOLDER}' does not exist."
  exit 1
fi
if [ ! -d "${THUMBNAIL_FOLDER}" ]; then
  mkdir ${THUMBNAIL_FOLDER}
fi

mogrify -monitor -path ${THUMBNAIL_FOLDER}/ -thumbnail 10% -format jpg original/*

for original_file in $(ls -v ${ORIGINAL_FOLDER}/*); do
  original_basename=${original_file##*/}  # https://stackoverflow.com/a/2664746
  common_basename=${original_basename%.*}
  thumbnail_file=$(compgen -G "${THUMBNAIL_FOLDER}/${common_basename}.*")  # https://stackoverflow.com/a/6364244
  if [ -f "${thumbnail_file}" ]; then
    touch -r ${original_file} ${thumbnail_file}  # https://askubuntu.com/a/861672
  fi
done
