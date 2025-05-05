curl -L -o repo.zip https://github.com/selfhst/icons/archive/refs/heads/main.zip

unzip repo.zip -d temp-icons

mkdir -p selfhst-icons
mv temp-icons/icons-main/* selfhst-icons/

rm -rf temp-icons repo.zip