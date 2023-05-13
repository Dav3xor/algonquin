function qsv(selector) {
  return document.querySelector(selector).value;
}


class Picker {
  constructor() {
    this.items = [];
    this.selection = "";
    this.list_id  = `#select-list`;
    this.done_fn = null;
  }
  
  set_items(new_items, done_fn) {
    this.done_fn = done_fn;
    this.items = new_items;
    this.update_list();
  }

  close() {
    this.items = [];
    $(this.list_id).empty();
    $('#select-box').hide();
  }

  finish(id) {
    this.done_fn(id);
    this.close();
  }

  pick_top() {
    var top = this.items[0];
    this.close();
    return top;
  }

  sort(input) {
    input = input.toLowerCase();
    //console.log(input);
    for(var i in this.items) {
      var candidate = this.items[i].string.toLowerCase()
      var start     = 0;
      var score     = 0.0;
      for (var j in input) {
        var substring = candidate.substring(start);
        var loc       = substring.indexOf(input[j]);
        if(loc != -1) {
          //console.log(loc);
          score += 1.0 / (loc+1);
          start += loc;
        }
      }
      this.items[i].score = score;
    }
    this.items.sort(function(a,b) {
      return ((a.score > b.score) ? -1 : ((a.score < b.score) ? 1: 0));
      });
  }

  show() {
    $('#select-box').show()
  }

  update_list() {
    $('#select-list').empty();
    for (var index in this.items) {
      if(index >5) {
        break;
      }
      var item     = this.items[index];
      if((this.selection = "") || (item.string.indexOf(this.selection) != -1)) {
        var item_id = `select-list-${index}`;
        var active   = ' disabled';

        if (index == 0) {
          active = '';
        }

        $(this.list_id).append(`<button class="btn btn-light btn-sm${active}" id="${item_id}" 
            onclick="picker.finish(${item.id});"
            onmouseover="$('#${item_id}').removeClass('disabled');"
            onmouseout="$('#${item_id}').addClass('disabled');">
          ${item.string} - ${item.score}
        </button>`);
      }
    }
  }
}




    
    





class Tabs {
  constructor(tab) {
    $('#'+tab).removeClass('d-none'); 
    this.cur_tab = tab;
    setTimeout(function() { $('#new-message').focus() }, 500);
  }

  current_tab() {
    return this.cur_tab;
  }

  show(tab) {
    $('#navb').collapse('hide');
    if(tab == 'messages') {
      $('#messages-deselected-nav').addClass('d-none');
      $('#messages-nav').removeClass('d-none');
      $('#messages-nav').addClass('active');
      $('#new-message').focus();
      $('#footer').removeClass('d-none');
      messages.clear_unread();
    } else if(this.cur_tab == 'messages') {
      $('#messages-deselected-nav').removeClass('d-none');
      $('#messages-nav').addClass('d-none');
      $('#footer').addClass('d-none');
      $('#goto-bottom').addClass('d-none');
    }            

    $('#'+this.cur_tab).addClass('d-none'); 
    $('#'+tab).removeClass('d-none'); 

    if(tab == 'people') {
      build_table(people);
    } else if(tab == 'search') {
      build_table(search);
    } else if(tab == 'files') {
      build_table(files);
    } else if(tab == 'rooms') {
      build_table(rooms);
    }

    $('#'+this.cur_tab+"-nav").removeClass("active");
    $('#'+tab+"-nav").addClass("active");
    if(tab == 'messages') {
      if($('#messages').scrollTop() < 0) {
        $('#goto-bottom').removeClass('d-none');
      }
    }
    this.cur_tab = tab;
  }
}


class Invite {
  constructor() { 
  }
  create_person() {
    var email      = $('#invite-email').val();
    var password   = $('#invite-password').val();
    var message    = $('#invite-message').val();
    var handle     = $('#invite-handle').val();
    var send_email = $('#invite-send-email').val();
    var message = {email: email,
                   password: password,
                   message: message,
                   handle: handle,
                   send_email: send_email};

    socket.emit('invite-new-person', message);
    $('#add-person').prop('disabled', true);
  }
  allow_submission() {
    $('#invite-result').addClass('d-none'); 
    $('#add-person').prop('disabled', false);
  }
}



async function upload_file(file, url, room_id=null, folder_id=null) {
  var sessionid = cookie.read('sessionid');
  var file_number = parseInt(cookie.read('file_number'));
  cookie.write('file_number', file_number + 1, 365);
  for(let start = 0; start < file.size; start += files.chunk_size) {
    const chunk     = file.slice(start, start+files.chunk_size);
    var form        = new FormData();

    form.append('sessionid', sessionid);
    form.append('chunk', start/files.chunk_size);
    form.append('file_number', file_number);
    form.append('file', chunk);
    form.append('folder', folder_id);
    form.append('room', room_id);
    if (start + files.chunk_size >= file.size) {
      form.append('end', true);
      form.append('filename',file.name);
      set_status(`${ file.name }: Done!`, 5000)
    } else {
      set_status(`${ file.name }: ${ parseInt((start/file.size)*100) }%`, 5000)
    }
    await fetch(url, { method: 'post', 
                       body: form }).then(res => res.text());
  }
}


class Files {
  constructor(chunk_size) {
    this.files = {};
    this.folders = {};
    this.path = [1];
    this.chunk_size = chunk_size;
    
    this.table_name = "#files-list";
    this.table = null;
    this.table_def = {'rowId':   'rowid',
                      "dom": "tip",
                      'columns': [ { 'data': 'play', 'width': '108px'},
                                   { 'data': 'filename'},
                                   { 'data': 'buttons', 'width': '60px'} ]};
  }

  get_folder(id) {
    // sigh, javascript...
    if(id==undefined) {
      return null;
    }

    if (! this.folders.hasOwnProperty(id)) {
      getter.add('folders', id);
      return null;
    } else {
      return this.folders[id];
    }
  }

  get_cur_folder() {
    return this.path.slice(-1)[0];
  }
  
  get_path_index(index) {
    if (index > this.path.length) {
      console.log("a");
      return null;
    } else if (index < 0) {
      console.log("b");
      return null;
    } else {
      console.log("c");
      return this.get_folder(this.path[index]);
    }
  }

  empty() {
    this.files = {};
    this.render();
  }


  add_update_file(file) {
    this.files[file.id] = file;
    console.log(this.folders);
    console.log(file);
    if(file.id > this.folders[file.folder].last_seen_file) {
      this.folders[file.folder].unread += 1;
      if((document.visibilityState == 'visible') && 
         (file.folder == this.get_cur_folder())){
        this.folders[file.folder].last_seen_file = file.id;
      } 
    }
  }

  add_update_folder(folder) {
    this.folders[folder.id] = folder;
    //if(!(folder.hasOwnProperty('last_seen_file'))) {
    //  this.folders[folder.id].last_seen_file = 0;
    // }
    //if((folder.hasOwnProperty('last_seen_file')) && (folder.last_seen_file > this.folders[folder.id].last_seen)) {
    //  this.folders[folder.id].last_seen_file = room.last_seen;
    //}
  }

  get_latest() {
    socket.emit('get-file-list', {'latest':20});
  }

  delete_file(file) {
    delete this.files[file];
  }

  get_file(id) {
    // sigh, javascript...
    if(id==undefined) {
      return null;
    }

    if (! this.files.hasOwnProperty(id)) {
      getter.add('files', id);
      return null;
    } else {
      return this.files[id];
    }
  }

  add_folder(name, parent_folder=null) {
    if (parent_folder == null) {
      parent_folder = this.path.slice(-1).pop();
      if(parent_folder == null) {
        parent_folder=0;
      }
    }
    socket.emit('add-folder', {'parent_folder': parent_folder,
                               'name': name});
  }
  change_folder(folder_id) {
    if(! this.folders.hasOwnProperty(folder_id)) {
      //console.log(`invalid change_folder -- ${folder_id}`);
    } else {
      this.path.push(folder_id);
      socket.emit('get-folder', {'folder_id': folder_id});
    }
  }

  change_folder_by_level(level) {
    if(level < this.path.length) {
      this.path.splice(level+1, this.path.length - level);
      socket.emit('get-folder', {'folder_id': this.path[level]});
    }
  }

  table_row_name(id, type) {
    return `file-id-${type}-${id}`;
  }

  goto(id, type) {
    tabs.show('files');
    var row       = '#' + this.table_row_name(id, type);

    // this is crazy, but it's on datatables.net's own page, so...
    this.table.row(row).draw().show().draw(false);
  }

  update_table_row_folder(folder) {
    var rowid    = this.table_row_name(folder.id, 'folder');
    var owner    = people.get_person(folder.owner);
    if(folder.unread) {
      var unread = `<button class="btn btn-light style="font-size:1.5em;">${folder.unread}</button>`;
    } else {
      var unread = '';
    }
    if(owner) {
      var filename = `<button onmouseover="$('#${rowid}-button').removeClass('disabled');" 
                              onmouseout="$('#${rowid}-button').addClass('disabled');" 
                              ondblclick="files.change_folder(${folder.id});" 
                              class="btn btn-info btn-sm btn-block text-left disabled"
                              style="word-break: break-all;"
                              id="${rowid}-button">
                        ${icons.folder}
                        ${folder.name}
                      </button>`;
      var rowdata = {'rowid':    rowid,
                     'play':     '',
                     'filename': filename, 
                     'buttons':  unread}
      add_table_row(this.table, rowid, rowdata);
    }
  }


  update_table_row_file(file) {
    var rowid    = this.table_row_name(file.id, 'file');
    //alert(JSON.stringify(file));
    var owner = people.get_person(file.owner);
    if(owner) {

      var file_icon = icons.unknown;
      if (icons.hasOwnProperty(file.type)) {
        file_icon = icons[file.type];
      }
      var button_id = `files-play-sound-${file.id}`;
      var play_button = "";
      var deleted = file.deleted ? 'disabled' : '';

      if ((!file.deleted)&&(file.type in {'video':true, 'audio':true})){
        play_button = `
          <button class="btn btn-info btn-sm" id="${button_id}" 
                  onclick="jukebox.play_pause('${button_id}', '/files/${file.localname}'); ${deleted}">
            ${icons.play}
          </button>`;
      } else {
        play_button = `<button class="btn btn-dark btn-sm" disabled>
                         ${icons.blank}
                       </button>`;
      }
      var play = `${play_button}
                    <a download class="btn btn-light btn-sm ${deleted}" href="/files/${file.localname}" ${deleted}>
                      ${icons.download}
                    </a>
                    <button class="btn btn-light btn-sm" 
                            onclick="window.open('/files/${file.localname}','_blank');" ${deleted}>
                      ${icons.new_tab}
                    </button>`;
      var filename = `<button class="btn btn-secondary btn-sm btn-block text-left disabled"
                              style="word-break: break-all;"
                              onmouseover="$('#${rowid}-button').removeClass('disabled');" 
                              onmouseout="$('#${rowid}-button').addClass('disabled');" 
                              ondblclick="console.log('double click');"
                              id="${rowid}-button" disabled>
                        ${file_icon}
                        ${file.name}
                      </button>`;
      var buttons = `<button class="btn btn-success btn-sm" 
                               onclick="start_chat([${owner.id},people.get_this_person().id]);" 
                               id="start-chat-${owner.id}" type="button" ${deleted}>
                         ${icons.chat_bubble}
                     </button>
                     <button class="btn btn-warning btn-sm mr-0" onclick="send_delete_file(${file.id});" ${deleted}>
                       ${icons.trash}
                     </button>`;
      var rowdata = {'rowid':    rowid,
                     'play':     play,
                     'filename': filename, 
                     'buttons':  buttons}
      add_table_row(this.table, rowid, rowdata);
    }
  }

  render_path() {
    var contents = 'Path:';
    for (var i in this.path) {
      var folder = this.get_path_index(i);
      console.log(folder);
      if (folder) {
        contents += `<button class="btn btn-dark btn-sm"
                             onclick="files.change_folder_by_level(${i});">
                       ${folder.name} 
                     </button>`;
      } else {
        contents += `<button class="btn btn-dark btn-sm" >
                       Loading... 
                     </button>`;
      }

    }
    $('#files-path').html(contents);
  }

  render() {
    this.render_path();
    if(this.table != null) {
      this.table.clear();
      for (var folder in this.folders) {
        folder = this.folders[folder];
        if(folder && folder.parent == this.get_cur_folder()) {
          this.update_table_row_folder(folder);
        }
      }
      for (var file in this.files) {
        file = this.files[file];
        if(file && file.folder == this.get_cur_folder()) {
          this.update_table_row_file(file);
        }
      }
      this.table.columns.adjust().draw();
    }
  }
}


function build_table(obj) {
  if (obj.table == null) {
    obj.table = $(obj.table_name).DataTable(obj.table_def);
    obj.render();
  }
}

function add_table_row(table, rowid, rowdata) {
    var row = table.row('#'+rowid);
    if (row.any()) {
      row.data(rowdata);//.draw();
    } else {
      table.row.add(rowdata).draw( false );
    }
}

class People {
  constructor() {
    this.people = {};
    this.this_person = -1;

    this.table_name = "#people-list";
    this.table = null;
    this.table_def = { "rowId": "rowid",
                       "dom": "tip",
                       "columns": [ { "data": 'online', 'orderData': [2,1], 'width': '80px'}, 
                                    { "data": 'name'}, 
                                    { "data": 'buttons', "orderable": false, 'width': '123px'} ]};
    $('#ring-bell').append(icons.bell);
  }


  empty() {
    this.people = {};
    this.this_person = -1
    this.render();
  }

  get_person(id) {
    // sigh, javascript...
    if(id==undefined) {
      return null;
    }

    if (! this.people.hasOwnProperty(id)) {
      getter.add('persons', id);
      return null;
    } else {
      return this.people[id];
    }
  }

  get_handles() {
    var handles = [];
    for(var person in this.people) {
      person = this.people[person];
      handles.push({ 'string': person.handle,
                     'id':     person.id});
    }
    return handles;
  }

  get_this_person() {
    return this.get_person(this.this_person);
  }

  set_this_person(id) {
    this.this_person = id;
  }

  set_person(person) {
    this.people[person.id] = person;
  }

  this_person_is_admin() {
    if((this.this_person) && (this.this_person==1)) {
      return true;
    } else {
      return false;
    }
  }

  table_row_name(id) {
    return `person-id-${id}`;
  }

  goto(id) {
    tabs.show('people');
    var row       = '#' + this.table_row_name(id);

    // this is crazy, but it's on datatables.net's own page, so...
    this.table.row(row).draw().show().draw(false);
  }

  update_table_row(person) {
    var rowid    = this.table_row_name(person.id);
    var online   = `<button class="btn btn-dark btn-sm mr-2" ${person.online ? "":"disabled"}>
                      ${icons.person}
                    </button>
                    <img src="/portraits/${person.portrait}" height="36px" />`;
    var name     = `<h4>${person.handle}</h4>`;
    
    var about = "";
    if(person.hasOwnProperty('about')) {
      about = `<a tabindex="0" role="button" 
                  class="btn btn-sm btn-danger ml-0 pb-0" 
                  title="About ${person.handle}"
                  data-placement="bottom"
                  data-bs-toggle="popover"
                  data-bs-trigger="hover"
                  data-bs-animation="true"
                  data-content="${person.about}">
                  <h5>About...</h5>
                </a>`;
    }

    var buttons = `<button class="btn btn-warning btn-sm" 
                           type="button" id="new-file-${person.id}">
                     ${icons.paperclip}
                   </button>
                   <button class="btn btn-success btn-sm" 
                           onclick="start_chat([${person.id},people.get_this_person().id]);" 
                           id="start-chat-${person.id}" type="button">
                     ${icons.chat_bubble}
                   </button>
                   <button class="btn btn-success btn-danger btn-sm" 
                           onclick="send_bell_person(${person.id});" 
                           id="start-chat-${person.id}" type="button">
                     ${icons.bell}
                   </button>`;




    var rowdata = {'rowid':    rowid,
                   'online':   online, 
                   'online_order': person.online ? 1:0,
                   'name':     name, 
                   'buttons':  buttons}
    add_table_row(this.table, rowid, rowdata);
  }

  render() {
    if(this.table != null) {
      for (var person in this.people) {
        person = this.get_person(person);
        if(person) {
          this.update_table_row(person);
        }
      }
      this.table.columns.adjust().draw(false);
    }
  }
}

class Search {
  constructor() {
    $('#send-query').html(icons.search);

    $('#search-query').keyup(() =>  {
      if (event.keyCode === 13) {
        $("#send-query").click();
      } else {
        this.handle_query_change();
      }
    });
    this.table_name = "#search-list";
    this.table = null;
    this.table_def = { "rowId": "rowid",
                       "dom": "tip",
                       "columns": [ { "data": 'row'}, 
                                    { "data": 'type'}  ]};
  }

  send_query(query) {
    socket.emit('search-query', {'query': query});
    tabs.show('search');
  }
 
  handle_query_change() {
    var query = $('#search-query').val();
    if(query.length > 0) {
      $('#send-query').prop('disabled', false);
    } else {
      $('#send-query').prop('disabled', true);
    }
  }

  file_icons = { 'audio':   'audio',
                 'image':   'image',
                 'archive': 'archive',
                 'pdf':     'pdf',
                 'video':   'video' }
  file_icon(file_type) {
    if (file_type in this.file_icons) {
      return icons[this.file_icons[file_type]];
    // TODO: add support for file icons (add join to db query, etc...)
    } else {
      return icons.unknown;
    }
  }

  row_name(result) {
      switch (result.ftable) {
        case 'persons':
          switch (result.row) {
            case 'email':
              return "Person's Email Address";
              break;
            case 'handle':
              return "Person's Handle";
              break;
            case 'about':
              return "About Person";
              break;
          }
          break;
        case 'messages':
            return "Message Contents";
            break;
        case 'rooms':
            switch (result.row) {
              case 'topic':
                return "Room Topic";
                break;
              case 'about':
                return "About Room";
                break;
              case 'name':
                return "Room Name";
                break;
            }
            break;
        case 'cards':
            switch (result.row) {
              case 'title':
                return "Card Title";
                break;
              case 'contents':
                return "Card Contents";
                break;
            }
            break;

        case 'files':
            switch (result.row) {
              case 'name':
                return "File Name";
                break;
              case 'comment':
                return "File Comment";
                break;
              case 'type':
                return "File Type";
                break;
            }
            break;
        case 'folders':
            return "Folder Name";
            break;
        case 'card_edits':
            return "Card Change";
            break;
        default:
            console.log(result.ftable);
            return "?";

      }
  }


  update_table_row(result) {
      //console.log(result.ftable);
      switch (result.ftable) {
        case 'messages':
          var message = messages.get_message(result.row_id);
          /*var type   = `<button onclick='messages.goto(${result.row_id});' 
                                class='btn btn-success btn-sm' type='button'${message ? '':'disabled'}>
                          ${icons.chat_bubble}
                        </button>`;
                        */
          if(message == null) {
            var type = `<button class='btn btn-warning btn-sm'>loading...</button>`;
          } else {
            var type = messages.render_inline_message(message, true)
          }
          break;
        case 'files':
          var file   = files.get_file(result.row_id);
          if(file == null) {
            var type = `<button class='btn btn-warning btn-sm'>loading...</button>`;
          } else {
            var ftype  = this.file_icon(file.type);

            if (!(ftype)) {
              ftype = icons.unknown;
            }
            var type   = messages.render_inline_file(file, 100, true);
            /*
            var type   = `<button class='btn btn-success btn-sm' 
                            onclick='files.goto(${result.row_id},"file");'
                            type='button'${file ? '':'disabled'}>
                            ${ this.file_icon(file.type) }
                          </button>`;
                          */
          }
          break;
        case 'folders':

          var folder   = files.get_folder(result.row_id);
          if(folder == null) {
            var type = `<button class='btn btn-warning btn-sm'>loading...</button>`;
          } else {
            var type   = messages.render_inline_folder(folder, true);
          }
          break;
        case 'cards':
          var card   = cards.get_card(result.row_id);
          if(card == null) {
            var type = `<button class='btn btn-warning btn-sm'>loading...</button>`;
          } else {
            var type   = messages.render_inline_card(card, true);
          }
          break;
        case 'persons':
          var person = people.get_person(result.row_id);
          if(person == null) {
            var type = `<button class='btn btn-warning btn-sm'>loading...</button>`;
          } else {
            var type = messages.render_inline_person(person, true);
          }
          break;
        case 'rooms':
          var room = rooms.get_room(result.row_id);
          if(room == null) {
            var type = `<button class='btn btn-warning btn-sm'>loading...</button>`;
          } else {
            var type = messages.render_inline_room(room, true);
          }
          break;
        default :
          console.log(result);
          var type    = `<button class='btn btn-success btn-sm' type='button' disabled>
                           ${result.ftable}?
                         </button>`;
          break;
      }
      var row = this.row_name(result);
      //console.log(row);

      var rowid  = `search-${result.ftable}-${result.row_id}`;
      var rowdata = {'type':   type,
                     'row':    row,
                     'rowid':   rowid }
      add_table_row(this.table, rowid, rowdata);
  
  }



  render(results=null) {
    //console.log("search render");
    if(results) {
      this.cur_results = results;
    }
    if(this.table == null) {
      build_table(search);
    }

    this.table.clear();
    for(var result in this.cur_results) {
      var result = this.cur_results[result];
      this.update_table_row(result);
    }
    getter.request();
  }
}

class Settings {
  constructor() {
    this.settings = ['handle',
                     'email',
                     'old-password',
                     'new-password',
                     'about']
  }

  set_new_password(password) {
    socket.emit('settings', {'new-password': password, 'no-status':true});
  }

  send_settings() {
    var settings = {};
    for (var setting in this.settings) {
      setting = this.settings[setting];
      var value = $('#settings-'+setting).val();
      if (value) {
        settings[setting] = value;
      }
    }
    socket.emit('settings', settings);
  }

  send_portrait(file) {
    upload_file(file, 'upload-portrait');
  }



  set_defaults() {
    var person = people.get_this_person();
    $('#portrait-image').attr('src', '/portraits/' + person.portrait);
    $('#you-image').attr('src', '/portraits/' + person.portrait);
    for (var setting in this.settings) {
      setting = this.settings[setting];
      if(setting in person) {
        $("#settings-"+setting).val(person[setting]);
      }
    }
  }

  allow_submission() {
    $('#change-settings').prop('disabled', false);
  }
}


class Cards {
  constructor() {
    this.cards             = {};
    this.open_editor       = false;
    this.cur_edit_card     = null;
    this.form_fields       = ['title', 'content'];
  }

  new() {
    this.cur_edit_card = null;
    this.open_editor   = true;
    this.set_room_list(messages);
    $('#card-title').empty();
    $('#card-content').empty();
    $('#card-id').val(null);
    $('#do-edit-card').html('Add Card');
    $('#do-edit-card').attr('disabled', true);
    $('#edit-card').modal('show');
    $('#card-private').prop('checked', false);
    $('#card-rooms').prop('disabled', true);
    $('#card-locked').prop('checked', false);
  }

  editor_open() {
    return this.open_editor;
  }

  add_file(file) {
    // TODO: remove duplicate code between here and messages
    this.insert_at_cursor(`~file${file}~`);
  }

  goto(id) {
    var card_id = `card-${id}`;
    tabs.show('cards');
    document.getElementById(card_id).scrollIntoView({behavior:"smooth", block:"center"});
  }

  insert_at_cursor(text) {
    // TODO: remove duplicate code between here and messages
    var target = document.getElementById("card-content");

    if (target.setRangeText) {
        //if setRangeText function is supported by current browser
        target.setRangeText(text)
    } else {
        target.focus()
        document.execCommand('insertText', false /*no UI*/, text);
    }
  }
  set_room_list(messages) {
    var card = this.get_card(this.cur_edit_card);
    $('#card-rooms').empty();
    for (var room in rooms.rooms) {
      var selected = "";
      room = rooms.rooms[room];
      if((card) && (room.id == card.room)) {
        selected = "selected";
      } else if ((!card) && (room.id == messages.cur_room)) {
        selected = "selected";
      }
      $('#card-rooms').append(`<option value="${room.id}" ${selected}>${room.name}</option`);
    }
  }

  edit(card_id) {
    var card = this.get_card(card_id);
    if(card) {
      this.cur_edit_card = card.id;
      this.set_room_list(messages);
      this.open_editor   = true;
      if(card.room) {
        $('#card-private').prop('checked', true);
        $('#card-rooms').prop('disabled', false);
      } else {
        $('#card-private').prop('checked', false);
        $('#card-rooms').prop('disabled', true);
      }

      $('#card-locked').prop('checked', card.locked);
      $('#card-title').val(card.title);
      $('#card-content').val(card.contents);
      $('#do-edit-card').html('Update Card');
      $('#do-edit-card').attr('disabled', true);
      $('#edit-card').modal('show');
    }
  }

  toggle_lock(card_id, state) {
    socket.emit('card-toggle-lock', {card_id: card_id, 
                                     state: state});
  }

  allow_submission() {
    if( ($('#card-title').val().length > 0) && ($('#card-content').val().length > 0)) {
      $('#do-edit-card').prop('disabled', false);
    } else {
      $('#do-edit-card').prop('disabled', true);
    }

  }
  show(card_id) {
    var card = this.get_card(card_id);
    if(card) {
      $('#display-card-body').empty();
      this.render_card(card_id, '#display-card-body', true);
    $('#display-card').modal('show');
    }
  }

  add(card) {
    this.cards[card.id] = card;
    $('#edit-card').modal('hide');
  }

  get_card(id) {
    // sigh, javascript...
    if(id==undefined) {
      return null;
    }

    if (! this.cards.hasOwnProperty(id)) {
      getter.add('cards', id);
      return null;
    } else {
      return this.cards[id];
    }
  }

  hide_editor() {
    $('#edit-card').modal('hide');
    this.open_editor   = false;
  }

  hide_display() {
    $('#display-card').modal('hide');
  }

  send_card() {
    var card = {};

    if(this.cur_edit_card != null) {
      card.id = this.cur_edit_card;
      this.cur_edit_card = null;
    }

    for (var field in this.form_fields) {
      field = this.form_fields[field];
      var value = $('#card-'+field).val();
      if (value) {
        card[field] = value;
      }
      $('#card-'+field).val('');
    }

    if($('#card-private').prop('checked')) {
      card.room = parseInt($('#card-rooms').val());
    }

    if($('#card-locked').prop('checked')) {
      card.locked = true;
    } else {
      card.locked = false;
    }

    this.hide_editor();
    socket.emit('edit-card', card);
  }

  render_card(card_id, container, closeable=false) {
    var card = this.get_card(card_id);
    if(card) {
      var edit_block = "";
      var close_block = "";
      if (closeable) {
        close_block = `<span>
                         <button onclick="cards.hide_display();"> 
                           X
                         </button>
                       </span>`;
      }
      if((card.owner == people.get_this_person().id)||
         (people.this_person_is_admin())) {
        var locked = 'unlocked';
        if(card.locked) {
          locked = 'locked';
        }
        edit_block += `<button class="mr-1" onclick="cards.toggle_lock(${card.id}, '${locked}')">
                         ${icons[locked]}
                       </button>`;

      }
      if((!card.locked)||
         (card.owner == people.get_this_person().id)||
         (people.this_person_is_admin())) {
        edit_block += `<button onclick="cards.edit(${card.id});"> 
                         ${icons.edit_small} 
                       </button>`;
      }
      $(container).append(`<div class="card bg-light text-dark mt-4" id="card-${card.id}">
                              <h5 class="card-header d-flex justify-content-between 
                                         align-items-center">
                                ${close_block}
                                <span>
                                ${card.title}
                                </span>
                                <span>
                                  <button onclick="messages.insert_at_cursor('~card${card.id}~');">
                                    ${icons.chat_bubble_small} 
                                  </button>
                                  ${edit_block}
                                </span>
                              </h5>
                              <div class="card-body">
                                ${markdown.makeHtml(messages.expand_tildes(card.contents))}
                              </div>
                           </div>`);
    }
  }


  render() {
    var counter=0;
    $('#cards-display').empty();
    $('#cards-display').append(`<div class="row mt-1">
                          <div class="col-lg-4" id="cards-col-1"></div>
                          <div class="col-lg-4" id="cards-col-2"></div>
                          <div class="col-lg-4" id="cards-col-3"></div>
                        </div>`);
    for (var card in this.cards) {
      var cur_column = ((counter % 3)+1).toString()
      this.render_card(card,`#cards-col-${cur_column}`);
      counter += 1;
    }
  }

  empty() {
    this.cards = {};
    this.render();
  }
}


    
const Scrollback_States = {
  Ready: 'Ready',
  Loading: 'Loading',
  Loading2: 'Loading2',
  Done: 'Done'
}



class Rooms {
  constructor() {
    this.rooms            = {};
    var cur_room          = cookie.read('cur_room');
    if(cur_room != "") {
      this.cur_room = cur_room;
    } else {
      this.cur_room = "1";
    }
    this.table_name = "#rooms-list";
    this.table = null;
    this.table_def = { "rowId": "rowid",
                       "dom": "tip",
                       "columns": [ { "data": 'name'}, 
                                    { "data": 'buttons', "orderable": false, 'width': '70px'} ]};
  }

  empty() {
    this.rooms = {};
    this.render();
  }
  
  change_room(room) {
    this.cur_room = room;
    this.rooms[this.cur_room].unread = 0;
    cookie.write('cur_room', room, '365');
    messages.handle_unread();
    $('#messages').empty();
    messages.render();
    this.render_room_list(room);
    this.update_table_row(this.get_room(room));
    getter.request();
  }

  get_room(room) {
    // sigh, javascript...
    if(room==undefined) {
      return null;
    }

    if (! this.rooms.hasOwnProperty(room)) {
      getter.add('rooms', room);
      return null;
    } else {
      return this.rooms[room];
    }
  }
  
  get_cur_room() {
    if(!this.rooms.hasOwnProperty(this.cur_room)) {
      return null;
    } else {
      return this.rooms[this.cur_room];
    }
  }

  add_room(room) {
    if(!this.rooms.hasOwnProperty(room.id)) {
      this.rooms[room.id] = room;
      this.rooms[room.id].message_index = [];
      this.rooms[room.id].unread = 0;
      this.rooms[room.id].at_end = false;
      this.rooms[room.id].scrollback_state  = Scrollback_States.Ready;  
      if(!(room.hasOwnProperty('last_seen'))) {
        this.rooms[room.id].last_seen = 0;
      }
    } else {
      if(!(room.hasOwnProperty('placeholder'))) {
        for (var key in room) {
          this.rooms[room.id][key] = room[key];
        }
      }
      if((room.hasOwnProperty('last_seen')) && (room.last_seen > this.rooms[room.id].last_seen)) {
        this.rooms[room.id].last_seen = room.last_seen;
      }
    }
  }
  add_message(message) {
    // add room to rooms list if it's not there.
    if (!this.rooms.hasOwnProperty(message.room)) {
      this.add_room({id:message.room, placeholder:true});
    }

    // handle last seen
    if(message.id > this.rooms[message.room].last_seen) {
      this.rooms[message.room].unread += 1;
      if((document.visibilityState == 'visible') && 
         (message.room == this.cur_room)){
        this.rooms[message.room].last_seen = message.id;
      } 
    }
    this.rooms[message.room].message_index.push(parseInt(message.id));
    // TODO: selection sort?
    this.rooms[message.room].message_index.sort(function(a, b){return -1*(b-a)});
  }

  render_room_list() {
    var unread = 0;
    $('#room_list').empty();
    for (var room in this.rooms) {
      var room = this.rooms[room];
      if ( room.name.startsWith('$%^&-') ) {
        var ids = room.name.split('-').slice(1);
        var expanded_name = "Chat With:";
        var change_name = true;
        for (var id in ids) {
          var id = ids[id].toString();
          var person = people.get_person(id);
          
          if (person) {
            expanded_name += " " + people.people[id].handle;
          } else {
            change_name = false;
            if(people.people[id]){
            } else {
              expanded_name += " (unknown person?)";
            }

          }
        }
        if(change_name == true) {
          room.name = expanded_name;
        }       
      }

      var contents = room.name;
      if(room.unread > 0) {
        unread   += room.unread;
        contents += `<span class="ml-2 badge badge-info">${room.unread}</span>`;
      }

      if ( room.id != this.cur_room ) {
        $('#room_list').append(`<a class="dropdown-item" href="#" 
                                                         onclick="rooms.change_room('${room.id}');"> 
                                  ${contents}
                                </a>`);
      } else {
        $('#messages_label').html(contents);
      }

    }
    var msg_label = "messages";
    if (unread > 0) {
      msg_label += `<span class="ml-2 badge badge-info">${unread}</span>`;
      $('#messages_off_label').html(msg_label);
      $('#favicon').attr('href','/static/favicon2.svg');
    } else {
      $('#messages_off_label').html(msg_label);
      $('#favicon').attr('href','/static/favicon.svg');
    }
    this.label = msg_label;
  }

  oldest_msg(room) {
    if (!(room in this.rooms)) {
      return null;
    } else if(!(this.rooms[room].hasOwnProperty('message_index'))) {
      return null;
    } else if (this.rooms[room].message_index.length == 0) {
      return null;
    } else {
      return this.rooms[room].message_index[0];
    }
  }

  newest_msg(room) {
    if (!(room in this.rooms)) {
      return null;
    }
    else if (this.rooms[room].message_index.length == 0) {
      return null;
    } else {
      return this.rooms[room].message_index[0];
    }
  }
  
  table_row_name(id) {
    return `room-id-${id}`;
  }
  update_table_row(room) {
    var rowid    = this.table_row_name(room.id);
    var name     = `<button class="btn btn-secondary btn-block" id="goto-room-${room.id}"
                            onclick="rooms.change_room('${room.id}'); tabs.show('messages');">${room.name}</button>`;
    var disabled = room.unread ? '' : ' disabled';
    var new_msgs = room.unread ? room.unread : '';
    var about    = "";
    var buttons  = `
      <button class="btn btn-info btn-sm mr-1" 
              style="width:37px; height:37px;"
              id="new-messages-${room.id}"${disabled}>
       ${new_msgs}
      </button>
      <button class="btn btn-warning btn-sm" 
              onclick="files.change_folder('${room.root_folder}'); tabs.show('files');"
              id="goto-folder-${room.id}">
        ${icons.folder}
      </button>`;




    var rowdata = {'rowid':    rowid,
                   'name':     name, 
                   'buttons':  buttons}
    if(this.table == null) {
      build_table(rooms);
    }
    add_table_row(this.table, rowid, rowdata);
  }
  render() {
    if(this.table != null) {
      for (var room in this.rooms) {
        room = this.get_room(room);
        if(room) {
          this.update_table_row(room);
        }
      }
      this.table.columns.adjust().draw(false);
    }
  }
}
  
class Messages {
  reset() {
    this.top_side      = 0;
    this.bottom_side   = 0;
    this.bottom_person = -1;
  }

  constructor() {
    this.reset();
    this.messages         = {};
    this.expanded_input   = false;
    this.handling_unread  = false;
    this.label            = "messages"
    this.picker_state     = null;
    this.picker_start     = 0;
    this.height_adj       = 0;
    $('#footer').on('keydown','#new-message', function(event) {
      if ((event.key == 'Tab')&&(messages.picker_state != null)) {
        picker.finish(picker.pick_top().id);
        messages.set_picker(null, 0);
      }
    });

    $("#new-message").keyup((event) => {
        var cursor_pos   = $('#new-message').prop("selectionStart"); 
        if(messages.picker_state == null) {
          switch(event.key) {
            case '@':
              picker.set_items(people.get_handles(), function(id) {
                var last_pos    = $('#new-message').prop("selectionStart"); 
                var text        = $('#new-message').val();
                var start       = text.substring(0, cursor_pos-1);
                var end         = text.substring(last_pos);
                var replacement = `~person${id}~`;
                text            = `${start}${replacement}${end}`;
                $('#new-message').val(text);
                setTimeout(function() { 
                  $('#new-message').focus(); 
                  $('#new-message')[0].setSelectionRange(cursor_pos+replacement.length, 
                                                         cursor_pos+replacement.length); 
                }, 200);
                messages.picker_state = null;
                messages.picker_start = 0;
              });
              picker.show();
              messages.set_picker('person', cursor_pos);
              //console.log("user picker");
              break;
            case '#':
              messages.set_picker('room', cursor_pos);
              //console.log("room picker");
              break;
            case '%':
              messages.set_picker('file', cursor_pos);
              //console.log("file/folder picker");
              break;
          }
        } else {
          // we are currently in picker mode...

          // kill the picker if the cursor moves behind the @/#/%...
          if(cursor_pos < this.picker_start) {
            picker.close();
            messages.set_picker(null, 0);
          }

          switch(event.key) {
            case 'Escape':
              picker.close();
              messages.set_picker(null, 0);
              break;
            case 'Enter':
              picker.finish(picker.pick_top().id);
              messages.set_picker(null, 0);
              break;
            case 'Backspace':
            case 'Delete':
              if ($('#new-message').val().indexOf('@') == -1) {
                picker.close();
                messages.set_picker(null, 0);
              }
              break;
            default:
              var substring = $('#new-message').val().substring(messages.picker_start,cursor_pos);
              picker.sort(substring);
              picker.update_list();
              break;

          }
        } 


        if (event.keyCode === 13) {
          if (!event.shiftKey) {
            $("#send-message").click();
            // TODO: this seems dumb, fix
            this.input_small();
          } else {
            this.input_large();
          }
        }
      });

    this.input_small();
    $('#send-message').append(icons.chat_bubble);
    $('#footer-new-file').append(icons.paperclip);
    $('#goto-bottom').html(icons.goto_bottom);
    $('#files-upload').append(icons.paperclip);
    $('#folder-add').append(icons.folder);
    
  }

  set_picker(state, start) {
    this.picker_state = state;
    this.picker_start = start;
  }

  empty() {
    this.messages = {};
    this.render();
  }



  input_small() {
      $('#new-message').prop('rows', 1);
      $('#message-expand-button').html(icons.arrow_up);
      $('#message-new-card-button').html(icons.card);
      this.expanded_input = false;

  }

  input_large() {
      $('#new-message').prop('rows', 5);
      $('#message-expand-button').html(icons.arrow_down);
      this.expanded_input = true;
  }

  resize_input() {
    if(this.expanded_input === false) {
      this.input_large();
    } else {
      this.input_small();
    }

  }
  pageup() {
    var cur_location = parseInt($('#messages').scrollTop());
    $('#messages').animate({ scrollTop: cur_location-1000}, 50);
  }
  pagedown() {
    var cur_location = parseInt($('#messages').scrollTop());
    $('#messages').animate({ scrollTop: cur_location+1000}, 50);
  }

  get_message(id) {
    // sigh, javascript...
    if(id==undefined) {
      return null;
    }

    if (! this.messages.hasOwnProperty(id)) {
      getter.add('messages', id);
      return null;
    } else {
      return this.messages[id];
    }
  }

  goto(id) {
    var msg_id = `#message-${id}`;
    tabs.show('messages');
    $('#messages').animate({ scrollTop: ($(msg_id).offset().top -200) }, 200);
  }

  add_file(file) {
    this.insert_at_cursor(`~file${file}~`);
  }

  insert_at_cursor(text) {
    var target = document.getElementById("new-message");

    if (target.setRangeText) {
        //if setRangeText function is supported by current browser
        target.setRangeText(text)
    } else {
        target.focus()
        document.execCommand('insertText', false /*no UI*/, text);
    }
  }

  send(socket) {
    var message = $('#new-message').val();
    if (message.trim() != '') {
      socket.emit('message', {message:message, room:parseInt(rooms.get_cur_room().id)});
      $('#new-message').val("");
    }
  }


  render_inline_card(card, block=false) {
    var btnblock="";
    if(block==true){
      btnblock="btn-block text-left";
    }
    if (!card) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
    } else {
      return `<button class="btn btn-dark btn-sm mx-2 ${btnblock}" 
                      onclick="cards.show(${card.id});">
                ${icons.card}
                ${card.title}
              </button>`;
    }
  }
  render_inline_person(person, block=false) {
    var btnblock="";
    if(block==true){
      btnblock="btn-block text-left";
    }
    if (!person) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
    } else {
      return `<button onclick="people.goto(${person.id});" 
                      class="btn btn-dark btn-sm mx-2 ${btnblock}">
                ${icons.person_small}
                @${person.handle}
              </button>`;
    }
  }
 
  render_inline_room(room, block=false) {
    var btnblock="";
    if(block==true){
      btnblock="btn-block text-left";
    }
    if (!room) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
    } else {
      return `<button class="btn btn-dark btn-sm mx-2 ${btnblock}"
                      onclick="rooms.change_room('${room.id}');">
                ${icons.flower}
                #${room.name}
              </button>`;
    }
  }

  render_inline_folder(folder, block=false) {
    var btnblock="";
    if(block==true){
      btnblock="btn-block text-left";
    }
    if (!folder) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
    } else {
      return `<button class="btn btn-dark btn-sm mx-2 ${btnblock}"
                      onclick="files.change_folder('${folder.id}');">
                ${icons.folder}
                #${folder.name}
              </button>`;
    }
  }

  render_inline_phone(phone, block=false) {
    var btnblock="";
    if(block=true){
      btnblock="btn-block text-left";
    }
    var number1 = "5035352342";
    var number2 = "(503) 535-2342";
    return `<button class="btn btn-dark btn-sm mx-2 ${btnblock}">
              ${icons.telephone}
              <a href="tel:${number1}" style="color:white;">${number2}</a>
            </button>`;
    
  }

  render_inline_message(msg, block=false) {
    var btnblock="";
    if(block==true){
      btnblock="btn-block text-left";
    }
    //console.log(msg);
    var room = rooms.get_room(msg.room);
    var room_name = "";
    //console.log(1);
    if(room != null) {
    //console.log(2);
      room_name = `(${room.name})`;
    } else {
    //console.log(3);
      room_name = "(unknown)";
    }
      
    if (!msg) {
      return `<span class='btn btn-danger ml-2 mr-2 disabled ${btnblock}'> <b> loading... </b> </span>`;
    }
    return `<button class="btn btn-dark btn-sm mx-2 ${btnblock}">
              ${icons.chat_bubble}
              ${room_name} ${msg.message}
            </button>`;
  }


  render_inline_file(file, height=200, block=false) {
    var btnblock="";
    if(block==true){
      btnblock="btn-block text-left";
    }
    if (!file) {
      return `<span class='btn btn-danger ml-2 mr-2 disabled ${btnblock}'> <b> loading... </b> </span>`;
    } else if (file.deleted == true) {
      return `<span class='btn btn-danger disabled mx-2 ${btnblock}'> <b>${file.name}</b> (deleted) </span>`;
    } else {
      var comment = "";
      if (file.comment) {
        comment = `<div>Comment: {$file.comment}`;
      }
      switch(file.type) {
        case 'image': 
          if(block) {
            //console.log(file.localname);
            return `<button onclick="window.open('/files/${file.localname}','_blank');"
                            class="btn btn-dark btn-sm p-1 mx-1 btn-block text-left text-bottom">
                      <span class="mx-2" style="float:left;">
                        <img height=${height} src="/files/${file.localname}" />
                      </span>
                      <span>
                        <div>
                          Filename: ${file.name}
                        </div>
                        ${comment}
                        <div>
                          Size: ${file.size/1024}kb
                        </div>
                        <div>
                          Uploaded: ${file.uploaded}
                        </div>
                      </span>
                    </button>`;

          } else {
            return `<button class="btn btn-light btn-sm p-1 m-1">
                      <img height=${height} src="/files/${file.localname}"
                           onclick="window.open('/files/${file.localname}','_blank');"/>
                    </button>`;
          }
          break;
        case 'audio':
          var button_id = `msg-play-${rooms.get_cur_room()}-${file.id}`;
          return `<span class="badge badge-dark">
                    <button class="btn btn-info btn-sm ${btnblock}" 
                            onclick="jukebox.play_pause('${button_id}', '/files/${file.localname}');">
                      ${icons.play}
                    </button>
                    ${file.name}
                  </span>`;
        case 'archive':
          return `<button class="btn btn-light btn-sm ${btnblock} mx-2" 
                          onclick="window.open('/files/${file.localname}','_blank');">
                    ${icons.archive} ${file.name}
                  </button>`;
          //return `<span class="btn btn-warning">${file.name}</span>`;
          break;

        default:
          return `<button class="btn btn-light btn-sm ${btnblock} mx-2" 
                          onclick="window.open('/files/${file.localname}','_blank');">
                    ${icons.new_tab} ${file.name}
                  </button>`;
          //return `<span class="btn btn-warning">${file.name}</span>`;
          break;
      }

    }
  }

  expand_tildes(text) {
    // TODO: add handling for ~person1~, etc...
    var inline_files    = text.match(/~file(\d+)~/gm);
    var inline_cards    = text.match(/~card(\d+)~/gm);
    var inline_persons  = text.match(/~person(\d+)~/gm);
    var inline_rooms    = text.match(/~room(\d+)~/gm);
    var inline_phones   = text.match(/~tel:([0-9\|\-\(\)\+]+)~/gm);
    
    for (var tag in inline_files) {
      tag = inline_files[tag];
      var file_id = tag.slice(5,-1);
      var file = files.get_file(file_id);
      text = text.replace(tag, this.render_inline_file(file));
    }

    for (var tag in inline_cards) {
      tag = inline_cards[tag];
      var card_id = tag.slice(5,-1);
      var card = cards.get_card(card_id);
      text = text.replace(tag, this.render_inline_card(card));
    }
    for (var tag in inline_persons) {
      tag = inline_persons[tag];
      var person_id = tag.slice(7,-1);
      var person = people.get_person(person_id);
      text = text.replace(tag, this.render_inline_person(person));
    }
    for (var tag in inline_rooms) {
      tag = inline_rooms[tag];
      var room_id = tag.slice(5,-1);
      var room = rooms.get_room(room_id);
      text = text.replace(tag, this.render_inline_room(room));
    }
    for (var tag in inline_phones) {
      tag = inline_phones[tag];
      text = text.replace(tag, this.render_inline_phone(tag));
    }
    return text;
  }



  render(messages = null) {
    var orig_height = $('#messages').prop('scrollHeight');
    var cur_room = rooms.get_cur_room();
    if(cur_room == null) {
      return;
    }
    if(!messages) {
      // redraw everything
      this.reset();
      messages = cur_room.message_index;
    } else if((cur_room.message_index.length > 0) && 
              (max_id(messages, 'rooms', cur_room) < cur_room.message_index[0])) {
      // backfill mode...
    } else {
      // new messages...
      messages.reverse();
    }

    for (let message of messages) {
      if(!message.hasOwnProperty('room')) {
        message = this.messages[message];
      }
      if(message.room == cur_room.id) {
        this.render_message(message);
      }
    }
    var sT         = $('#messages').scrollTop();
    var sH         = $('#messages').height();
    var new_height = $('#messages').prop('scrollHeight');
    //console.log(`height change = ${new_height - orig_height}`);
    this.height_adj = new_height - orig_height;
  }

  render_msg_footer(message, person, float) {
    if(person) {
      var personname = this.bottom_side % 2 ? `<b class="text-white">${person.handle}</b> ${message.written}` :
                                     `${message.written} <b class="text-white">${person.handle}</b>`;
    } else {
      var personname = "unknown";
    }
    return `<div class="row" id="msg-footer-${message.id}">
                    <div class="col-12${float} small-font-size">
                      <small>
                        ${personname}
                      </small>
                    </div>
                  </div>`;
  }

  render_msg_portrait(message, portrait) {
    return `<div class="col-1" id="person-info-${message.id}">
              <img src="/portraits/${portrait}" class="img-fluid portrait" />
            </div>`;
  }
  render_msg_contents(message, classes, float) {
    return `<div class="col-10${float}">
              <span id="msg-${message.room}-${message.id}" 
                    class="${classes}">
                ${markdown.makeHtml(this.expand_tildes(message.message))}
              </span>
            </div>`;
  }


  render_dragon() {
    $('#messages').append(`<div id='dragon' class="row">
                             <div class="col-12" style="height:600px;">
                               ${icons.dragon}
                             </div>
                           </div>`);
    console.log('enter the dragon');
  }

  render_message(message, above) {
    var person        = people.get_person(message.person);
    var portrait      = "default.png";
    var handle        = "loading...";
    var switched_side = false;
    var oldest        = rooms.oldest_msg(message.room);
    var backfill      = false;
    var side          = message.left ? 1:0;

    if(person) {
      portrait = person.portrait;
      handle   = person.handle;
    } else {
      console.log("???? "+message.person);
    }

    if ((oldest) && (message.id < oldest)) {
      // backfill
      if (this.top_side != side) {
        switched_side = true;
        this.top_side = side;
      }
      backfill = true;
    } else {
      if (this.bottom_side != side) {
        this.bottom_side    = side;
        switched_side       = true;
      } else if (this.prev_msg != null) {
        $(`#msg-${message.room}-${this.prev_msg}`).removeClass('tri-right btm-right-in');
      }
      side = this.bottom_side;
    }

    var empty    = `<div class="col-sm-1"></div>`;
    var classes   = "default-bubble";
    var float     = "";
    var person_info = "";
    var footer = "";

    if(!(side % 2)) {
      float = " text-right";
      if((!backfill) || ((backfill) && (switched_side))) {
        classes += " tri-right btm-right-in";
        person_info = this.render_msg_portrait(message, portrait);
        footer = this.render_msg_footer(message, person, float); 
      }
    } else {
      if((!backfill) || ((backfill) && (switched_side))) {
        classes += " tri-right btm-left-in";
        person_info = this.render_msg_portrait(message, portrait);
        footer = this.render_msg_footer(message, person, float); 
      }
    }

    var contents = this.render_msg_contents(message, classes, float);

    var output = "";
    if(side % 2) {
      output = person_info + contents + empty;
    } else {
      output = empty + contents + person_info;
    }
    
    if((!(switched_side))&&(!(backfill))&&(this.bottom_person != -1)) {
      $(`#person-info-${this.prev_msg}`).remove();
      $(`#msg-footer-${this.prev_msg}`).remove();
      $(`#msg-${message.room}-${this.prev_msg}`).parent().removeClass('col-10');
      $(`#msg-${message.room}-${this.prev_msg}`).parent().addClass('col-11');
    }

    if($(`#message-${message.id}`).length) {
      $(`#message-${message.id}`).html(output);
    } else {
      if(backfill) {
        $('#messages').append(`${footer}
                                <div class="row mb-1" id="message-${message.id}"> 
                                  ${output}
                                </div>`);
      } else {
        $('#messages').prepend(`${footer}
                                <div class="row mb-1" id="message-${message.id}"> 
                                  ${output}
                                </div>`);
      }
    }
   
    if(!(backfill)) {
      this.prev_msg    = message.id;
      this.bottom_person = message.person;
    }


  }
 
  add(new_messages, block) {
    for (var message in new_messages) {
      message = new_messages[message];

      if (message.id in this.messages) {
        // TODO: handle message editing/deletion...
        console.log("duplicate message: " + message.id);
      } else {
        this.messages[message.id] = message;
        if(block) {
          rooms.add_message(message);
        }
      }
    }
  }

  get_scrollback() {
    var room = rooms.get_cur_room();
    if((room.at_end == false) &&
       ((room.scrollback_state == Scrollback_States.Ready) ||
       ((room.scrollback_state == Scrollback_States.Loading2))))  {
      console.log(room);
      socket.emit('get-messages', {'room_id':   room.id,
                                   'before_id': room.message_index[0],
                                   'count':     10} );
      room.scrollback_state = Scrollback_States.Loading;
    } else if(room.scrollback_state == Scrollback_States.Loading) {
      room.scrollback_state = Scrollback_States.Loading2;
    }
  }
  scrollback_loaded(at_end, room) {
    room = rooms.get_room(room);
    room.at_end = at_end;
    if( room.scrollback_state == Scrollback_States.Loading2 ) {
      // we've been asked for another one...
      this.get_scrollback();
    } else {
      room.scrollback_state = Scrollback_States.Ready;
    }
  }

  handle_unread() {
    var room = rooms.get_cur_room();
    if(room) {
      if((this.handling_unread == false) && 
         (room.unread > 0)) {
        this.handling_unread = true;
        setTimeout(() => {
          this.handling_unread = false;
          this.clear_unread();
          rooms.render_room_list();
          rooms.update_table_row(room);
        }, 2000);
      }
    }
  }

  clear_unread() {
    var room = rooms.get_cur_room();
    if(room) {
      var last_seen = room.message_index.slice(-1)[0];

      if(last_seen) {
        socket.emit('have-read', { room: room.id, last: last_seen });
      }
      room.unread = 0;
    } else {
      console.log("no room?!?");
    }
  }
      
}
    
var cookie = {
  write : function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
  },
  read : function (name) {
    if (document.cookie.indexOf(name) > -1) {
      return document.cookie.split(name)[1].split("; ")[0].substr(1)
    } else {
      return "";
    }
  },
  delete : function (cname) {
    var d = new Date();
    d.setTime(d.getTime() - 1000);
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=; " + expires;
  }
};



class Getter {
  constructor(protocol) {
    console.log(`getter protocol: ${protocol}`);
    this.protocol = protocol
    this.reset();
    this.requested = {'persons': {},
                      'files': {},
                      'folders': {},
                      'messages': {},
                      'cards': {},
                      'rooms': {} };   
  }

  add(type, id) {
    //console.log(1);
    if(this.requested[type].hasOwnProperty(id) == false) {
      //console.log(2);
      this.unknown[type][id] = 1;
      this.requested[type][id] = 1;
      this.newrequest=true;
    }
  }
  
  reset() {
    this.newrequest = false;
    this.unknown    = {'persons': {},
                       'files': {},
                       'folders': {},
                       'messages': {},
                       'cards': {},
                       'rooms': {} }

  }

  request() {
    //console.log("request");
    //console.log(this.newrequest);
    //console.log(this.requested);

    if(this.newrequest == true) {
      //console.log(this.unknown);
      socket.emit('get-stuff', this.unknown);
      this.reset();
    }
  }

  handle_stuff(stuff) {
    console.log(stuff);
    var update_messages = false;
    var update_files = false;
    var update_persons = false;
    var update_rooms = false;
    var update_cards = false;

    if(stuff.__protocol__ > this.protocol) {
      //console.log('----------- new version');
      var status = `
                      <div class="badge badge-danger" style="font-size:1.3em;">
                        ${icons.bug}
                      </div>
                      <span class="ml-3 mr-3">
                        New Version of Software Available!
                      </span>
                      <button class="btn btn-dark" onclick="window.location.reload();">
                        Reload
                      </button>
                    `;
      set_status(status);
    }

    if ('persons' in stuff) {
      for(var person in stuff['persons']) {
        people.set_person(stuff['persons'][person])
      }
      update_messages = true;
      update_files = true;
      update_persons = true;
    }

    if ('folders' in stuff) {
      for(var folder in stuff['folders']) {
        files.add_update_folder(stuff['folders'][folder])
      }
      update_messages = true;
      update_files    = true;
    }

    if ('rooms' in stuff) {
      for (var room in stuff['rooms']) {
        rooms.add_room(stuff['rooms'][room]);
      }
      update_messages = true;
      update_rooms    = true;
    }

    if ('messages' in stuff) {
      update_messages = true;
    }

    if ('files' in stuff) {
      for(var file in stuff['files']) {
        files.add_update_file(stuff['files'][file])
      }
      update_messages = true;
      update_files    = true;
    }
    
    
    if ('cards' in stuff) {
      for(var card in stuff['cards']) {
        cards.add(stuff['cards'][card]);
      }
      update_cards = true;
    }
    if (('at_end' in stuff)&&('room_id' in stuff)) {
      messages.scrollback_loaded(stuff.at_end, stuff.room_id);
    }
         

    if(update_messages) {
      if(update_messages & 1) {
        lissajous.inca();
      } else if (update_messages & 2) {
        lissajous.incb();
      }
      $('#favicon').attr('href','/static/favicon2.svg');
      if('messages' in stuff) {
        console.log(stuff);
        var block = stuff.hasOwnProperty('block') ? stuff['block'] : false;
        messages.render(stuff.messages);
        messages.add(stuff.messages, block);
        if(('at_end' in stuff) && 
           (stuff.at_end == true) && 
           ($('#dragon').length)) {
          messages.render_dragon();
        }
      } else {
        messages.render();
      }
    }

    if(update_files) {
      files.render();
    }

    if(update_persons) {
      people.render();
    }

    if((update_rooms)||(update_messages)) {
      rooms.render_room_list();
      rooms.render();
    }

    if(update_cards) {
      cards.render();
    }
    if(tabs.current_tab() == 'search') {
      search.render();
    }
  this.request();
  }

};

class Jukebox {
  constructor() {
    this.audio    = null;
    this.cur_id = null;
    this.playing  = false;
  }
  play_pause(id, file) { 
    if ((!this.playing) || (this.cur_id != id)) {
      // play file...
      if(this.audio) {
        this.audio.pause();
      }
      this.playing = true;
      if(this.cur_id != id) {
        $('#'+this.cur_id).html(icons.play);
        this.audio = new Audio(file);
      }
      $('#'+id).html(icons.pause);
      this.audio.play();
      this.cur_id = id;
    } else {
      // pause
      this.audio.pause();
      $('#'+id).html(icons.play);
      this.playing = false;
    }
  }
}

function play_sound(file) {
  const playback = new Audio(file);
  playback.play();
}
class Lissajous {
  constructor(canvas, width, height) {
    this.canvas  = canvas;
    this.height  = height;
    this.width   = width;
    this.counter = 0;
    this.a       = 2;
    this.b       = 3;
    this.agoal   = 2;
    this.bgoal   = 3;
    this.ctx     = canvas.getContext('2d');
    this.draw();
  }
  inca() {
    this.agoal += 1;
  }
  incb() {
    this.bgoal += 1;
  }
  dec() {
    if(this.agoal>1) {
      this.agoal -= 1;
    }
    if(this.bgoal>1) {
      this.bgoal -= 1;
    }
  }
  seta(newval) {
    this.agoal=newval;
  }
  setb(newval) {
    this.bgoal=newval;
  }
  draw() {
    var time = new Date();
    var delta = this.counter;
    this.counter += .012;
    this.ctx.clearRect(0,0,this.width, this.height);
    this.ctx.beginPath();
    this.ctx.moveTo((this.width/2)+(this.width/2.1)*Math.sin(delta), (this.height/2));
    if (this.a != this.agoal) {
      this.a += (this.agoal-this.a)*0.05;
    }
    if (this.b != this.bgoal) {
      this.b += (this.bgoal-this.b)*0.05;
    }
    for(var i=0;i<131;i++) {
      var angle = ((3.14159*2)/131.0)*i;
      var x = (this.width/2) + (this.width/2.1)*Math.sin(this.a*angle+delta);
      var y = (this.height/2) + (this.height/2.1)*Math.sin(this.b*angle);
      this.ctx.lineTo(x,y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    window.requestAnimationFrame(this.draw.bind(this));
  }
}


const url_parameters = new URLSearchParams(window.location.search);

var socket = null;

var canvas = document.getElementById('lissajous');
var ctx = canvas.getContext('2d');
ctx.strokeStyle = 'rgb(50,200,100)';
ctx.lineWidth = 2;
var lissajous = new Lissajous(canvas, 30, 30);
var tabs      = new Tabs('messages');
var getter    = new Getter(__protocol__);
var messages  = new Messages();
var rooms     = new Rooms();
var cards     = new Cards();
var people    = new People();
var files     = new Files(__chunk_size__);
var picker    = new Picker();
var invite    = new Invite();
var settings  = new Settings();
var jukebox   = new Jukebox();
var search    = new Search();

var markdown = new showdown.Converter({'emoji':true, 'strikethrough': true, 'simplifiedAutoLink':true, 'openLinksInNewWindow':true});

function regulate_password(field1, field2, button) {
  if ( ($(field1).val().length > 0) && ($(field1).val() == $(field2).val()) ) {
    $(button).removeAttr('disabled');
  } else {
    $(button).attr('disabled', true);
  }
}

$('.dropdown-toggle').dropdown();

function resize_div(div, header, footer) {
  var new_height = window.innerHeight - header - footer - 5;
  $(div).css('height',new_height.toString()+'px');
}

$( window ).resize(function () { 
  var navbar_height = $('#navbar').css('height').slice(0,-2);
  var footer_height = $('#footer').css('height').slice(0,-2);
  resize_div('#messages', navbar_height, footer_height);
  resize_div('#files', navbar_height, 0);
  messages.handle_unread();
});

$( window ).ready(function () { 
  socket = io({rememberTransport: false});
  setup_handlers(socket);

});

$(window).keyup(function(event) {
  if(event.keyCode === 33) {
    messages.pageup();
  } else if (event.keyCode === 34) {
    messages.pagedown();
  }

  messages.handle_unread();
});

$(window).mousemove(function(event) {
  messages.handle_unread();
});

$("#password").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#do-login").click();
  }
});

function send_delete_file(file) {
  socket.emit('delete-file', {file_id: file});
}



function send_login_email() {
  var email = qsv('#email');
  var password = qsv('#password');
  socket.emit('login-email', {email: email, password: password});
}

function start_chat(ids) {
  socket.emit('start-chat', {persons:ids});
}

function send_bell_person(personid) {
  socket.emit('send-bell-person', {person:personid});
}

function send_bell_room() {
  socket.emit('send-bell-room', {room:rooms.get_cur_room().id});
}

function send_message() {
  messages.send(socket);
}

function send_logout() {
    people.empty();
    files.empty();
    rooms.empty();
    cards.empty();
    messages.empty();
    $('#navbar').addClass('d-none');
    $('#footer').addClass('d-none');
    $('#contents').addClass('d-none');

    $('#invite-result').addClass('d-none'); 
    $('#settings-result').addClass('d-none'); 

    $('#login').modal('show');
    var sessionid = cookie.read('sessionid');
    cookie.delete('sessionid');
    cookie.delete('cur_room');
    cookie.delete('file_number');
    socket.emit('logout', {sessionid: sessionid});
    lissajous.setb(5);
}


function min_id(objects, field, val) {
  var min = 100000000;
  objects.forEach(object => { if((object[field] == val) &&
                                   (object.id < min)) min=object.id });
  return min;
}

function max_id(objects, field, val) {
  var max = 0;
  objects.forEach(object => { if((object[field] == val) && 
                                   (object.id > max)) max=object.id });
  return max;
}


// The following functions are for handling file drag/drop

function dragover_handler(ev) {
 ev.preventDefault();
 ev.stopPropagation();
 ev.dataTransfer.dropEffect = "move";
}


function handle_file_upload(file) {
  var folder_id = 0;
  var room_id   = 0;
  switch(tabs.current_tab()) {
    case 'messages':
      var room  = rooms.get_cur_room();
      room_id   = room ? room.id: 0;
      folder_id = room ? room.root_folder: 0;
      break;
    case 'files':
      folder_id = files.get_cur_folder();
      if(folder_id == null) {
        folder_id = 0;
      }
      break;
    default:
      break;
  }
  upload_file(file, 'upload-file', 
              room_id   = room_id, 
              folder_id = folder_id);
}

function drop_handler(ev) {
 ev.preventDefault();
 ev.stopPropagation();
 if(tabs.current_tab() == 'settings') {
   ([...ev.dataTransfer.files]).forEach(settings.send_portrait);
 } else { 
   ([...ev.dataTransfer.files]).forEach(handle_file_upload);
 }
}

function dragstart_handler(ev) {
  // TODO: allow person to drag things out of the window...
  //alert('hi!');
  ev.dataTransfer.setData("text/plain", ev.target.id);
}


function set_status(status, duration=null) {
  $('#status-indicator').html(status);
  $('#status-indicator').removeClass('d-none');
  if(duration) {
    setTimeout(function() {
      clear_status();
    }, 2000);
  }
}

function clear_status() {
  $('#status-indicator').addClass('d-none');
}

$('#messages').scroll(function() {
  var location     = parseInt($('#messages').height()) - parseInt($('#messages').scrollTop());
  var total_height = $('#messages').prop('scrollHeight');

  if($('#messages').scrollTop() == 1) {
    // chromium made me do it.
    $('#messages').scrollTop(0);
  }

  if(messages.height_adj > 0) {
    var cur_val = $('#messages').scrollTop();
    $('#messages').scrollTop(cur_val+messages.height_adj);
    messages.height_adj = 0;
  }

  if($('#messages').scrollTop() >= 0) {
    $('#goto-bottom').addClass('d-none');
  } else {
    if( total_height - location < 1000 ) {
      messages.get_scrollback();
    }
    $('#goto-bottom').removeClass('d-none');
  }
});

$('#contents').click(function() {
  //console.log("contents click");
  $('#navb').removeClass('show');
});

$('#new-person-ok').click(function() {
  $('#new-person').modal('hide');
  $('#navbar').removeClass('d-none');
  $('#footer').removeClass('d-none');
  $('#contents').removeClass('d-none');
  var entered_password = $('#new-person-password').val();
  if (entered_password.length > 0) {
    settings.set_new_password(entered_password);
  }
});

$('#footer-new-file').on('click touchstart', function() {
  $(this).val('');
  $('#footer-upload-file').trigger('click');
});

$('#files-upload').on('click touchstart', function() {
  $(this).val('');
  $('#files-upload-file').trigger('click');
});

$('#footer-upload-file').on('change', function(evt) {
  ([...evt.target.files]).forEach(handle_file_upload);
});

$('#files-upload-file').on('change', function(evt) {
  ([...evt.target.files]).forEach(handle_file_upload);
});

$('#portrait-new-file').on('click touchstart', function() {
  $(this).val('');
  $('#portrait-upload-file').trigger('click');
});

$('#portrait-upload-file').on('change', function(evt) {
  ([...evt.target.files]).forEach(settings.send_portrait);
});

window.addEventListener('DOMContentLoaded', () => {
  // Get the element by id
  const element = document.getElementById("messages");
  // Add the ondragstart event listener
  element.addEventListener("dragstart", dragstart_handler);
});

function setup_handlers(s) {
  socket.on('connect', function() {
    clear_status()
    var sessionid = cookie.read('sessionid');
    if (sessionid != '') {
      socket.emit('login-session', {sessionid: sessionid});
    } else if(url_parameters.has('token')) {
      socket.emit('login-session', {sessionid: url_parameters.get('token')})
    } else {
      $('#login').modal('show');
    }
    //resize_div('#messages', 95, 15);
    //resize_div('#files', 95, 0);
    
    window.setTimeout(function () {
      $(window).trigger('resize');}, 100);
    });

  s.on('bell', data => {
    const audio = new Audio("bell.wav");
    audio.play();
  });

  s.on('login-result', data => {
    if(data.authenticated) {
      people.set_this_person(data.personid);
      getter.handle_stuff(data);
      if(url_parameters.has('token')) {
        // if it's a new person logging in, remove the arguments from the url
        window.history.pushState({}, '', '/');
      }
      $('#login').modal('hide');

      if ('sessionid' in data) {
        cookie.write('sessionid', data.sessionid, 365);
      }
      if ('new-person' in data) {

        var person = people.get_this_person();
        $('#welcome-message').html(`Welcome ${person.handle}!`);
        $('#new-person').modal('show');
        $('#new-person-password').keyup(function () {
          regulate_password('#new-person-password', '#new-person-password2', '#new-person-ok')
        });
        $('#new-person-password2').keyup(function () {
          regulate_password('#new-person-password', '#new-person-password2', '#new-person-ok')
        });

      } else {
        $('#navbar').removeClass('d-none');
        $('#footer').removeClass('d-none');
        $('#contents').removeClass('d-none');
      }
      if(cookie.read('file_number') == '') {
        cookie.write('file_number', '0', 365);
      }
      lissajous.setb(4);
      settings.set_defaults();
    } else {
      $('#login').modal('show');
      $('#login-result-status').html(data.result);
      $('#login-result-status').removeClass('d-none');
      cookie.delete('sessionid');
      cookie.delete('cur_room');
      lissajous.setb(1);
      lissajous.seta(1);
    }
  });

  s.on('invite-result', data => {
    $('#invite-result').removeClass('d-none');
    $('#invite-result-status').html(data.status_msg);
    getter.handle_stuff(data);
    if(data.status == 1) {
      $('#invite-result-message').removeClass('d-none');
      $('#invite-result-url').removeClass('d-none');
      $('#invite-result-message-text').html(markdown.makeHtml(data.message));
      $('#invite-result-url-text').html(data.url);
    } else {
      $('#invite-result-message').addClass('d-none');
      $('#invite-result-url').addClass('d-none');
    }
  });

  s.on('delete-file-result', data => {
    //console.log(`deleting file -- ${data.file_id}`);
    if(data.status == 'ok') {
      for (file in data['stuff-list'].files) {
        file = data['stuff-list'].files[file];
        var filename = file ? file.name:"unknown file?";
        files.delete_file(data.file_id);
        files.update_table_row_file(file);
      }
      //files.render();
      messages.render();
      set_status(`${filename} deleted`, 3000);
    } else {
      set_status(`${filename} delete failed: ${data.error}`, 3000);
    }


  });

  s.on('search-result', data => {
    search.render(data);
  });

  s.on('password-set', data => {
    cookie.write('sessionid', data.sessionid, 365);
  });

  s.on('disconnect', data => {
    var status = `<div class="badge badge-danger">${icons.outlet} ${icons.plug}</div> Network Disconnect`;
    set_status(status);
    $('#status-indicator').html(status);
    $('#status-indicator').removeClass('d-none');
  });

  s.on('settings-result', data => {
    set_status(data.status_msg,5000);
  });

  s.on('goto_chat', data => {
    rooms.add_room(data.room); 
    rooms.change_room(data.room.id);
    tabs.show('messages');
  });

  s.on('file-uploaded', data => {
    getter.handle_stuff(data);
    for(file in data.files) {
      file = data.files[file];
      if('portrait' in data) {
        $('#portrait-image').attr('src', '/portraits/' + data.person.portrait);
        $('#you-image').attr('src', '/portraits/' + data.person.portrait);
        people.set_person(data.person);
      } else if(cards.editor_open() == true) {
        cards.add_file(file.id);
      } else { 
        messages.add_file(file.id);
      }
    }
  });

  s.on('stuff-list', data => {
    getter.handle_stuff(data);
  });
}
