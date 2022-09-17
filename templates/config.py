__version__    = "v0.80"
__protocol__   = 1

config = {'database':         '{{ database_name }}',
          'protocol':         __protocol__,
          'version':          __version__,
          'site_name':        '{{ site_name }}',
          'site_url':         '{{ site_url }}',
          'sysop_handle':     '{{ sysop_handle }}',
          'sysop_email':      '{{ sysop_email }}',
          'public_rooms':     {{ public_rooms }},
          'file_root':        '{{ file_root }}',
          'chunk_size':       {{ chunk_size }},
          'portrait_types':   ['png', 'jpg', 'jpeg', 'gif', 'webp'],
          'default_portrait': 'default.png',
          'default_room':     '{{ default_room }}'}

