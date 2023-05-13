#!/usr/bin/python3

import json,sys,re
from datetime import datetime
from pathlib import Path, PurePath
from tables import *
from algonquin import config


history_path = ''

if len(sys.argv) == 2:
    history_path = sys.argv[1]

paths = list(Path(history_path).rglob('*.json'))
paths.sort()
types = set()
subtypes = set()

def handle_persons(persons):
    db_persons = {}
    db_bots  = {}
    db_rooms = {}
    db_folders = {}
    
    # TODO: add an interface for this...
    cat_facts = Person(email = "catfacts@email.com",
                     handle = "Cat Facts",
                     portrait = config['default_portrait'])
    cat_facts.save()
    db_bots['B10RT6TU5']=cat_facts
    db_bots['B10QAQ2HH']=cat_facts

    slackbot = Person(email = "slackbot@email.com",
                     handle = "Slackbot",
                     portrait = config['default_portrait'])
    slackbot.save()
    db_bots['USLACKBOT']=slackbot

    seanbot = Person(email = "seanbot@email.com",
                   handle = "Seanbot",
                   portrait = config['default_portrait'])
    seanbot.save()
    db_bots['B6YNZBX6D'] = seanbot
    db_bots['B705QGTRU'] = seanbot

    keyboardmaestro = Person(email = "keyboardmaestro@email.com",
                   handle = "KeyboardMaestrobot",
                   portrait = config['default_portrait'])
    keyboardmaestro.save()
    db_bots['B020041V0JJ'] = keyboardmaestro
   

    for person in persons:
        personname = person['name']
        slack_id = person['id']
        bot_id   = None

        if 'bot_id' in person['profile']:
            bot_id = person['profile']['bot_id']

        #print(person.keys())
        image    = person['profile']['image_512']
        if person['profile']['display_name']:
            personname = person['profile']['display_name']
        #print(personname)
        #for key,value in person.items():
        #    print(key + ": " + str(value))
        person = Person(email   = slack_id+"@email.com",
                    handle  = personname,
                    portrait = config['default_portrait'])
        person.save()

        token      = Session.make_token(person)
        url        = Session.make_token_url(token, config['site_url'])
        session    = Session(sessionid=token,
                             person = person.id)
        session.save()
        session.commit()   
        db_persons[slack_id] = person
        if bot_id:
            db_bots[bot_id] = person

        print(person.handle + ' = ' + url)
    return db_persons, db_bots

def handle_channels(channels):
    rooms   = {}
    folders = {}
    slack_id_rooms = {}

    root_folder = Folder(name=name, 
                         owner=persons[owner].id,
                         parent=None,
                         public=True) # no parent = directory off of root
    root_folder.save()

    for channel in channels:
        name    = channel['name']
        owner   = channel['creator']
        slack_id = channel['id']

        folder = Folder(name=name, 
                        owner=persons[owner].id,
                        parent=root_folder.id,
                        public=True) # no parent = directory off of root
        folder.save()

        room    = Room(owner         = persons[owner].id,
                       root_folder   = folder.id,
                       public        = True,
                       name          = name)
        room.save()
        room.left = False
        room.last_user = None
        for member in channel['members']:
            membership = Membership(person=persons[member].id,
                                    room=room.id)
            membership.save()

        rooms[name] = room
        folders[name] = folder
        slack_id_rooms[slack_id] = room
        print ("room: " + name)
    
    room.commit()
    return rooms, folders, slack_id_rooms



mention_regex = re.compile(r"<@[0-9A-Z]+>")
mention3_regex = re.compile(r"<U[0-9A-Z]+>")
mention2_regex = re.compile(r"<@[0-9A-Z]+\|[a-z0-9.-_]+>")
room_mention_regex = re.compile(r"<\#([0-9A-Z]+\|[a-z0-9\-_]+)>")
room2_mention_regex = re.compile(r"<\#([0-9A-Z]+)>")
url_regex = re.compile(r"<([h|H]ttps?://[^\s]+)>")
phone_regex = re.compile(r"<tel:([0-9\|\-\(\)\+]+)>")
email_regex = re.compile(r"<mailto:[0-9a-zA-Z_.@\-\|]+>")
spotify_regex = re.compile(r"<spotify:([a-z]+):([0-9a-zA-Z]+)>")
spotify2_regex = re.compile(r"<spotify:user:([a-zA-Z0-9]+):playlist:([a-zA-Z0-9]+)>")
other_regex = re.compile(r"<([^\s]+)>")

def convert_msg(message):
    mentions = re.findall(mention_regex, message)
    for mention in mentions:
        uid = mention[2:-1]
        person = persons[uid].id if uid in persons else bots[uid].id
        person = f"~person{person}~"
        message = re.sub(mention,person,message)
    
    mentions = re.findall(mention3_regex, message)
    for mention in mentions:
        uid = "U"+mention[2:-1]
        person = persons[uid].id if uid in persons else bots[uid].id
        person = f"~person{person}~"
        message = re.sub(mention,person,message)
   




    mentions = re.findall(mention2_regex, message)
    for mention in mentions:
        uid = mention[2:].split('|')[0]
        person = persons[uid].id if uid in persons else bots[uid].id
        person = f"~person{person}~"
        #print('-------')
        #print(mention)
        #print(person)
        #print(message)
        message = message.replace(mention, person) #re.sub(mention,person,message)
        #print(message)
        #print('-------')





    room_mentions = re.findall(room_mention_regex, message)
    for mention in room_mentions:
        #print(mention)
        roomid = mention.split('|')[0]
        room = slack_id_rooms[roomid].id
        room = f"~room{room}~"
        message = re.sub(f"<#{mention}>",room,message)

    room_mentions = re.findall(room2_mention_regex, message)
    for mention in room_mentions:
        #print(mention)
        room = slack_id_rooms[mention].id
        room = f"~room{room}~"
        message = re.sub(f"<#{mention}>",room,message)

    urls = re.findall(url_regex, message)
    for url in urls:
        message = message.replace(f"<{url}>", url)

    phones = re.findall(phone_regex, message)
    for phone in phones:
        #print("------")
        #print(phone)
        message = message.replace(f"<tel:{phone}>", f"~tel:{phone}~")

    spotifies = re.findall(spotify_regex, message)
    for spotify in spotifies:
        type = spotify[0]
        id   = spotify[1]
        message = message.replace(f"<spotify:{type}:{id}>", f"~spotify.{type}.{id}~")

    spotifies = re.findall(spotify2_regex, message)
    for spotify in spotifies:
        person   = spotify[0]
        playlist = spotify[1]
        message  = message.replace(f"<spotify:user:{person}:playlist:{playlist}>", f"~spotify.{person}.{playlist}~")



    emails = re.findall(email_regex, message)
    for email in emails:
        #print(email)
        just_email = email.split(':')[1]
        if '|' in just_email:
            just_email = just_email.split('|')[0]
        message = message.replace(email, f"~mailto:{just_email}~")






    others = re.findall(other_regex, message)
    if len(others):
        print(f"unknown <...>: {others}")
        for other in others:
            # convert <> to [] so it doesn't get removed...
            message = message.replace(f"<{other}>", f"[{other}]")
    return message




def handle_files(channel, files, folders):
    filelist = "\n\n"
    for cur_file in files:
        if 'user' in cur_file:
            owner = persons[cur_file['user']].id
            filename  = cur_file['url_private']
            filetype  = File.file_type(filename.split('?')[0].split('/')[-1])
            timestamp = datetime.fromtimestamp(int(cur_file['timestamp']))
            file = File(owner     = owner,
                        folder    = folders[channel].id,
                        room      = rooms[channel].id,
                        name      = filename,
                        public    = True,
                        uploaded  = timestamp)
            file.save()
            filelist += (f" ~file{file.id}~")
    return filelist

def handle_messages(channel, messages):
    for message in messages:
        #print(message)
        bot     = False
        subtype = None
        if 'subtype' in message:
            subtypes.add(message['subtype'])

        types.add(message['type'])
        if 'subtype' in message:
            subtype = message['subtype']
        if subtype not in ('channel_join', 'channel_leave', 'channel_archive'):
            person = None
            if subtype == 'bot_message':
                person = message['bot_id']
                bot  = True
            elif subtype == 'file_comment':
                #print(message)
                person = message['comment']['user']
            else:
                if 'user' not in message:
                    print(' ', end='')
                    #print(message)
                else:
                    person = message['user']
            if person:
                person  = persons[person].id if person in persons else bots[person].id
                text    = convert_msg(message['text'])
                bot     = False
                time    = datetime.fromtimestamp(int(message['ts'].split('.')[0]))
               
                if subtype == 'me_message':
                    text = f"*{text}*"


                msg = Message(person    = person,
                              room    = rooms[channel].id,
                              written = time,
                              bot     = bot,
                              message = text)

                if not rooms[channel].last_user:
                    msg.left                 = False
                    rooms[channel].left      = False
                    rooms[channel].last_user = person
                elif rooms[channel].last_user == person:
                    msg.left = rooms[channel].left
                else:
                    rooms[channel].last_user = person
                    rooms[channel].left      = not rooms[channel].left
                    msg.left                 = rooms[channel].left

                if 'files' in message:
                    msg.message += handle_files(room, message['files'], folders)
                msg.save()
    Message.commit()

top_level = {history_path + 'users.json':            handle_persons,
             history_path + 'integration_logs.json': None,
             history_path + 'channels.json':         None}

# first load persons...
with open(history_path+'users.json','r') as file:
    data = json.loads(file.read())
    persons, bots = handle_persons(data)
print(persons.keys())

#then rooms...
with open(history_path+'channels.json','r') as file:
    data = json.loads(file.read())
    rooms, folders, slack_id_rooms = handle_channels(data)

print(top_level)
for path in paths:
    #print(" ---- path: " + str(path))
    if str(path) not in top_level:
        with open(path,'r') as file:
            data = json.loads(file.read())
            room = path.parts[0].split('/')[0]
            #print(f"room = {room} path = {path} parts = {path.parts}")
            #print("*",end="")
            handle_messages(room, data)
print(slack_id_rooms)
print(types)
print(subtypes)
print(rooms)
    #json.loads(...)
