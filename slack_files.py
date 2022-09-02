from tables import *
from algonquin import config
from urllib import request
import os, time

files = File.raw_select("files",
                        "name like '%files.slack.com%'",
                        {},
                        "id desc limit 1")

for file in files:
    filename = file.name.split('/')[-1].split('?')[0]
    type, extension = File.file_type(filename)

    #extension = filename.split('.')[-1]
    #print(f"{filename} - {extension}") 

    tmp_file = os.path.join('tmp', f"tmp.{extension}")
    #request.urlretrieve(file.name, tmp_file)

    hash, size = File.hash_file(open(tmp_file,'rb'))

    original_file = File.hash_exists(hash=hash, size=size)
    if original_file:
        print("already exists")
        localfile = original_file.localname
    else:
        print("doesn't exist")
        localfile = str(time.time())+'.'+extension
        os.rename(tmp_file, os.path.join(config['file_root'], 'files', localfile))

    file.name      = filename
    file.localname = localfile
    file.hash      = hash
    file.size      = size
    file.type      = type
    file.save()
    file.commit()

