import redis
import re
import json
import time
import string
import random
import requests
import pprint

pp = pprint.PrettyPrinter(indent=2)


r = redis.StrictRedis(host='localhost', port=6379, db=0)

common_words = ['the', 'be', 'to', 'of', 'and', 'a', 'in',
                'that', 'have', 'I', 'it', 'for', 'not',
                'on', 'with', 'he', 'as', 'you', 'do', 'at',
                'this', 'but', 'his', 'by', 'from', 'they',
                'we', 'say', 'her', 'she', 'or', 'an', 'will',
                'my', 'one', 'all', 'would', 'there', 'their',
                'what', 'so', 'up', 'out', 'if', 'about',
                'who', 'get', 'which', 'go', 'me', 'when',
                'make', 'can', 'like', 'time', 'no', 'just',
                'him', 'know', 'take', 'person', 'into', 'year',
                'your', 'good', 'some', 'could', 'them', 'see',
                'other', 'than', 'then', 'now', 'look', 'only',
                'come', 'its', 'over', 'think', 'also', 'back',
                'after', 'use', 'two', 'how', 'our', 'work',
                'first', 'well', 'way', 'even', 'new', 'want',
                'because', 'any', 'these', 'give', 'day', 'most',
                'us', 'are' 'aren\'t', 'haven\'t', 'you\'ve',
                'is', 'got']

def inline_image(alt, url):
  return f'![{alt}]({url})'

common_words = set([i.upper() for i in common_words])
#print ("common words = " + str(common_words))
class LoudHailer(object):
  uppercase   = frozenset(string.ascii_uppercase)
  hey_user    = re.compile('^\<\@[A-Z0-9]*\>\: ')

  def num_uppercase(self, loud):
    return sum(1 for c in loud if c in self.uppercase)
  
  def get_loud(self, domain, channel):
    response = r.srandmember('louds')
    r.hset('loudlast', 
           domain+'/'+channel, 
           response)
    return response
   
  def do_commands(self, command, user, domain, channel):
    def do_help(user, domain, channel, args):
      return "```" + \
             "!help                             - This help message.\n" + \
             "!add cmd \"help text\" <command>  - add new command for bot.\n" + \
             "!reward                           - Give a point to the last loud.\n" + \
             "!punish                           - Take a point from last loud.\n" + \
             "!hitme                            - Returns a random loud.\n" + \
             "!saywhat                          - Who said the last loud returned by 2louder.\n" + \
             "!gifit                            - Get a giphy gif from the last loud.\n" + \
             "!muntz                            - Nelson Muntz.\n" + \
             "!gomer                            - Surprise Surprise Surprise.\n" + \
             "!turtle                           - A Turtle.\n" + \
             "!tarot                            - Your Fortune.\n" + \
             "!urkel                            - Urkel.\n" + \
             "```" 
    def do_add(user, domain, channel, args):
      print (args)


    def do_reward(user, domain, channel, args):
      key = r.hget('loudlast', domain+'/'+channel)
      if key:
        points = r.hget('loudpoints', key)
        if not points:
          points = 1
        else:
          points = int(points) + 1
        r.hset('loudpoints', key, points)
    
    def do_punish(user, domain, channel, args):
      key = r.hget('loudlast', domain+'/'+channel)
      if key:
        points = r.hget('loudpoints', key)
        if not points:
          points = -1
        else:
          points = int(points) - 1
        r.hset('loudpoints', key, points)
         
    def do_hitme(user, domain, channel, args):
      return self.get_loud(domain, channel)

    def do_saywhat(user, domain, channel, args):
      print (domain+'/'+channel)
      key = r.hget('loudlast', domain+'/'+channel)
      if key:
        info   = r.hget('loudinfo', key)
        points = r.hget('loudpoints',key)
        if points is None:
          points = 0
        else:
          points = int(points)

        if info:
          print(info)
          info    = json.loads(str(info.decode('utf-8')))
          user    = info[0].upper()
          domain  = info[1].upper()
          channel = info[2].upper()
          return "brother %s said that in %s-%s (scoring %d points)" % (user,    domain,
                                                                        channel, points) 
    def do_urkel(user, domain, channel, args):
      urkels = ['https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Steve_Urkel.jpg/220px-Steve_Urkel.jpg',
      'https://cdn-images-1.medium.com/max/1200/1*t4YuUhBSKILOzxbqMJPBpg.png',
      'https://s.hdnux.com/photos/26/12/04/5808423/3/920x920.jpg',
      'https://www.rollingstone.com/wp-content/uploads/2018/06/rs-steve-urkel-19a21607-6240-4447-b18a-ef6ed63ccca1.jpg',
      'https://www.rd.com/wp-content/uploads/2018/02/01_Jaleel_Lessons-Jaleel-White-Learned-From-Playing-Urkel_5880798d_ABC-TV_WB-TV_Lorimar_Kobal_REX_Shutterstock.jpg',
      'https://vignette.wikia.nocookie.net/universe-of-smash-bros-lawl/images/7/70/Steve-urkel-e1323393883562.jpg/revision/latest?cb=20150628203838',
      'https://vignette.wikia.nocookie.net/disney/images/1/1c/Steven_Urkel.png/revision/latest?cb=20151031145238']
      return inline_image('urkel',random.choice(urkels))

    def do_muntz(user, domain, channel, args):
      muntzes = ['https://vignette.wikia.nocookie.net/simpsons/images/e/e9/Nelson_Ha-Ha.jpg/revision/latest?cb=20121205194057',
      'https://i.ytimg.com/vi/kdOPBP9vuZA/hqdefault.jpg',
      'https://i.ytimg.com/vi/b3aRiWZ9UoE/maxresdefault.jpg',
      'https://media.tenor.com/images/9baef56e6faabc7a6cae3b0d474c6770/tenor.gif',
      'https://i.ytimg.com/vi/XZJvyemxhq0/hqdefault.jpg',
      'https://i.pinimg.com/736x/8a/da/ef/8adaef2fc7827f78269e8d3edbf342c9--the-simpsons-taurus.jpg',
      'https://i.ytimg.com/vi/7SS24_CgwEM/maxresdefault.jpg',
      'https://img.buzzfeed.com/buzzfeed-static/static/2014-11/12/12/campaign_images/webdr10/20-signs-you-might-actually-be-nelson-muntz-from--2-30180-1415814783-15_dblbig.jpg',
      'https://i.ytimg.com/vi/wM6-NSet0Uk/maxresdefault.jpg',
      'https://media1.tenor.com/images/d0d198703d4aad248de4a4795a346e9a/tenor.gif?itemid=8845145',
      'https://cdn.europosters.eu/image/1300/badges/the-simpsons-nelson-muntz-ha-ha-i1852.jpg',
      'http://www.stickerattitude.com/media/catalog/product/cache/1/image/360x/9df78eab33525d08d6e5fb8d27136e95/s/i/simpsons_nelson_muntz_haha.jpg',
      'http://cdn-webimages.wimages.net/051ab5fecb76cb7031151af5e8c065c236e6ce-wm.jpg?v=3',
      'https://static.comicvine.com/uploads/original/2/22757/450697-nelson.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRn_g4QFaDYx5hUNy-MjASToOOY1_i3kJO_lpbW3CRdqCA8h_eyg']

      return inline_image('haha!', random.choice(muntzes))

    def do_gomer(user, domain, channel, args):
      gomers = ['https://i.pinimg.com/originals/71/f8/cc/71f8cceadc80914704321234a216707b.jpg',
                'https://i.imgflip.com/38hdph.jpg',
                'https://memegenerator.net/img/instances/57050650.jpg',
                'https://media.makeameme.org/created/surprise-surprise-uo72hv.jpg',
                'https://media.makeameme.org/created/well-who-would-06cda4c5d1.jpg']
      return inline_image('surprise surprise surprise!', random.choice(gomers))


    def do_tarot(user, domain, channel, args):
      tarots = ['https://www.tarotcardmeanings.net/images/tarotcards/tarot-fool.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-magician.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-highpriestess.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-empress.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-emperor.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-hierophant.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-lovers.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-chariot.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-strength.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-hermit.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-wheeloffortune.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-justice.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-hangedman.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-death.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-temperance.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-devil.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-tower.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-star.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-moon.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-sun.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-judgement.jpg',
      'https://www.tarotcardmeanings.net/images/tarotcards/tarot-world.jpg']

      return inline_image('the stars have aligned...', random.choice(tarots))

    def do_turtle(user, domain, channel, args):
      turtles = ['https://cdn-images-1.medium.com/max/1600/1*U0wtpXQySXfHwLjMs7m0jA.jpeg',
      'https://amp.businessinsider.com/images/59945b35f1a850c22a8b5192-1536-1152.jpg',
      'https://mediadc.brightspotcdn.com/dims4/default/fa4b635/2147483647/strip/true/crop/2290x1322+0+0/resize/2290x1322!/quality/90/?url=https%3A%2F%2Fmediadc.brightspotcdn.com%2F56%2F1a%2F576138eb647ef880be5d668b8231%2F8025081d6789080ece9eef0a2e38ad02.jpg',
      'https://cdni.rt.com/files/2018.07/article/5b4373d8dda4c82d768b459c.jpg',
      'https://mediadc.brightspotcdn.com/dims4/default/106f58c/2147483647/strip/true/crop/1320x880+0+0/resize/1320x880!/quality/90/?url=https%3A%2F%2Fmediadc.brightspotcdn.com%2Fa1%2Fe9%2Fecfaf78f54845d8dc6ea52ad1d00%2Fef02c2cdf1fcaaf62274ddfbcb4db550.jpg',
      'http://www.kyphotoarchive.com/wp-content/uploads/2017/02/780111McConnellfaA.jpg',
      'https://img.huffingtonpost.com/asset/5bb83c2e26000030018387d1.jpeg?ops=scalefit_720_noupscale',
      'https://media.vanityfair.com/photos/5b181fb823f287081510eae2/master/pass/mitch-mcconnell-democrats-recess.jpg',
      'https://images.axios.com/4Rqp1jAfNaeldeyt0XBUWtjZcHE=/1920x1080/smart/2018/10/20/1540068395334.jpg',
      'https://www.advocate.com/sites/advocate.com/files/2018/11/14/mitch-mcconnell750x422.jpg',
      'https://www.thenation.com/wp-content/uploads/2016/12/McConnell_Supreme-Court_2016_ap_img.jpg']
      return inline_image('Fucking.. Kentucky Nazis', random.choice(turtles))


    def do_loud_gif(user, domain, channel, args):
      loud = r.hget('loudlast', domain+'/'+channel)
      if not loud:
        return None
      else:
        words  = set(str(loud).split(" "))
        sample = list(words.difference(common_words))[0:5]
        print ("sample = " + str(sample))

      url ='http://api.giphy.com/v1/gifs/search?'

      if loud:
        payload = {'q': "+".join(sample), 'api_key': 'dc6zaTOxFJmzC'}
      else:
        return "Papa broke the redis!"

      try:
        req = requests.get(url, params=payload)
      except:
        return "Had trouble getting that sweet gif!"

      try:
        json_response = req.json()
        json_response_sample = random.choice(json_response['data'])
        return json_response_sample['images']['downsized_medium']['url']
      except:
        return "Whoa bud, that gif json didn't parse!"

    args     = command.split(' ')
    command  = args[0].strip().lower()
    args     = ' '.join(args[1:])
    print (args)
    print ("-->"+command+"<--")
    commands = { '!help':    do_help,
                 '!reward':  do_reward,
                 '!punish':  do_punish,
                 '!hitme':   do_hitme,
                 '!saywhat': do_saywhat,
                 '!gifit':   do_loud_gif, 
                 '!muntz':   do_muntz,
                 '!gomer':   do_gomer,
                 '!tarot':   do_tarot,
                 '!turtle':   do_turtle,
                 '!urkel':   do_urkel}

    if command in commands:
      return commands[command](user,domain, channel, args)
    else:
      return None

  def add(self, loud, user, domain, channel):
    if re.match(self.hey_user, loud):
      return None
    if self.num_uppercase(loud) <= 4:
      return None
    if loud == loud.upper():
      response = self.get_loud(domain, channel)

      if not r.sismember('louds',loud):
        r.sadd('louds',loud)
        r.hset('loudinfo', 
               loud, 
               json.dumps([user, domain, channel]))

      return response
    else:
      return None



def convert_to_dict(items_list):
  #print(items_list)
  return {i['id'] : i for i in items_list}

def get_dict_item(cur_dict, item, search_list):
  if item not in cur_dict:
    cur_dict = convert_to_dict(search_list)
  if item not in cur_dict:
    return "unknown"
  else:
    return cur_dict[item]
