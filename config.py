__version__    = "v0.80"
__protocol__   = 1

#TODO: Move as much of this as possible into the database?
 
config = {'database':         'algonquin.db',
          'protocol':         __protocol__,
          'version':          __version__,
          'debug_logging':    False,
          'site_name':        'Orgone Accumulator',
          'site_url':         'orgone.institute',
          'sysop_handle':     'sysop',
          'sysop_email':      'sysop@sysop.com',
          'enable_email':     True,
          'mail_server':      'localhost',
          'mail_port':        2525,
          'mail_username':    'Dav3xor@gmail.com',
          'mail_password':    'password',
          'mail_use_tls':     True,
          'mail_use_ssl':     False,
          'public_rooms':     ['0 Day Warez', 'Poop', 'Dev/Test'],
          'file_root':        '/home/dave/dev/algonquin/',
          'chunk_size':       50000,
          'root_folder':      1,
          'portrait_folder':  2,
          'misc_folder':      3,
          'portrait_types':   ['png', 'jpg', 'jpeg', 'gif', 'webp'],
          'default_portrait': 'default.png',
          'default_room':     '0 Day Warez'}

