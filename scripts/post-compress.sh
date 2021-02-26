#!/bin/bash

ORIGINAL_FOLDER="original"
PENDING_FOLDER="pending"
PROCESSED_FOLDER="processed"
error=0


if [ ! -d "${ORIGINAL_FOLDER}" ] || [ ! -d "${PENDING_FOLDER}" ]; then
  echo "Folder(s) '${ORIGINAL_FOLDER}' and/or '${PENDING_FOLDER}' do(es) not exist."
  exit 1
fi
if [ ! -d "${PROCESSED_FOLDER}" ]; then
  mkdir ${PROCESSED_FOLDER}
fi


for pending_file in $(ls -v ${PENDING_FOLDER}/*); do
  pending_basename=${pending_file##*/}  # https://stackoverflow.com/a/2664746
  common_basename=${pending_basename%.*}
  echo "Processing ${common_basename}..."
  original_file=$(compgen -G "${ORIGINAL_FOLDER}/${common_basename}.*")  # https://stackoverflow.com/a/6364244
  if echo "${original_file}" > /dev/null; then
    exiftool -overwrite_original -TagsFromFile ${original_file} ${pending_file}  # https://photo.stackexchange.com/a/85300
    touch -r ${original_file} ${pending_file}  # https://askubuntu.com/a/861672
    cp -p ${pending_file} "${PROCESSED_FOLDER}/${pending_basename}"
    rm ${pending_file}
    echo "Done."
  else
    echo "Cannot find the original file. Skipping."
    error=1
  fi
done

if [ ${error} -eq 1 ]; then 
  exit 1
fi
