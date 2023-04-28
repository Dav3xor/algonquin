__version__    = "v0.80"
__protocol__   = 1

#TODO: Move as much of this as possible into the database?
 
config = {'database':         'algonquin.db',
          'protocol':         __protocol__,
          'version':          __version__,
          'debug_logging':    True,
          'site_name':        'Orgone Accumulator',
          'site_url':         'orgone.institute',
          'sysop_handle':     'sysop',
          'sysop_email':      'sysop@sysop.com',
          'public_rooms':     ['0 Day Warez', 'Poop', 'Dev/Test'],
          'file_root':        '/home/dave/dev/algonquin/',
          'chunk_size':       50000,
          'misc_folder':      1,
          'portrait_folder':  2,
          'portrait_types':   ['png', 'jpg', 'jpeg', 'gif', 'webp'],
          'default_portrait': 'default.png',
          'default_room':     '0 Day Warez'}

