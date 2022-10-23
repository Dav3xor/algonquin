
function qsv(selector) {
  return document.querySelector(selector).value;
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

    if(tab == 'people') {
      build_table(people);
    } else if(tab == 'search') {
      build_table(search);
    } else if(tab == 'files') {
      console.log('xxx');
      build_table(files);
    }

    $('#'+this.cur_tab).addClass('d-none'); 
    $('#'+tab).removeClass('d-none'); 

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
  create_user() {
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

    socket.emit('invite-new-user', message);
    $('#add-user').prop('disabled', true);
  }
  allow_submission() {
    $('#invite-result').addClass('d-none'); 
    $('#add-user').prop('disabled', false);
  }
}



async function upload_file(file, url, success_fn) {
  var sessionid = cookie.read('sessionid');
  var file_number = parseInt(cookie.read('file_number'));
  cookie.write('file_number', file_number + 1, 365);
  for(let start = 0; start < file.size; start += files.chunk_size) {
    set_status(`${ file.name }: ${ parseInt((start/file.size)*100) }%`, 2000)
    const chunk = file.slice(start, start+files.chunk_size);
    var form        = new FormData();
    var room        = rooms.get_cur_room()
    if(room) {
      form.append('room', room.id);
    }
    form.append('sessionid', sessionid);
    form.append('chunk', start/files.chunk_size);
    form.append('file_number', file_number);
    form.append('file', chunk);
    if (start + files.chunk_size >= file.size) {
      form.append('end', true);
      form.append('filename',file.name);
    }
    await fetch(url, { method: 'post', 
                       body: form }).then(res => res.text());
  }
}


class Files {
  constructor(chunk_size) {
    this.files = {};
    this.chunk_size = chunk_size;
    
    this.table_name = "#files-list";
    this.table = null;
    this.table_def = {'rowId':   'rowid',
                      'columns': [ { 'data': 'play', 'width': '150px'},
                                   { 'data': 'filename'},
                                   { 'data': 'buttons', 'width': '75px'} ]};
  }

  empty() {
    this.files = {};
    this.render();
  }

  add_update_file(file) {
    this.files[file.id] = file;
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

  update_table_row(file) {
    var rowid    = `file-id-${file.id}`;
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
                  style="width:60px;"
                  onclick="jukebox.play_pause('${button_id}', '/files/${file.localname}'); ${deleted}">
            ${icons.play}
          </button>`;
      } else {
        play_button = `<button class="btn btn-dark btn-sm" style="width:60px;" disabled>
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
      var filename = `<button class="btn btn-secondary btn-sm btn-block text-left" disabled>
                        ${file_icon}
                        ${file.name}
                      </button>`;
      var buttons = `<button class="btn btn-success btn-sm ml-2" 
                               onclick="start_chat([${owner.id},people.get_this_person().id]);" 
                               id="start-chat-${owner.id}" type="button" ${deleted}>
                         ${icons.chat_bubble}
                     </button>
                     <button class="btn btn-warning btn-sm" onclick="send_delete_file(${file.id});" ${deleted}>
                       ${icons.trash}
                     </button>`;
      var rowdata = {'rowid':    rowid,
                     'play':     play,
                     'filename': filename, 
                     'buttons':  buttons}
      add_table_row(this.table, rowid, rowdata);
    }
  }

  render() {
    if(this.table != null) {
      console.log("files render");
      for (var file in this.files) {
        file = this.files[file];
        if(file) {
          this.update_table_row(file);
        }
      }
      this.table.columns.adjust().draw();
    }
  }
}


function build_table(obj) {
  console.log('build table');
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
                       "columns": [ { "data": 'portrait', 'orderable': false, 'width': '30px'}, 
                                    { "data": 'online', 'orderData': [4,2], 'width': '25px'}, 
                                    { "data": 'name'}, 
                                    { "data": 'buttons', "orderable": false, 'width': '150px'},
                                    { "data": 'online_order', 'visible': false} ]};
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
      getter.add('users', id);
      return null;
    } else {
      return this.people[id];
    }
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

  update_table_row(person) {
    var rowid    = `person-id-${person.id}`;
    var online   = `<button class="btn btn-dark btn-sm" ${person.online ? "":"disabled"}>
                      ${icons.person}
                    </button>`
    var name     = `<h4>${person.handle}</h4>`;
    var portrait = `<img src="/portraits/${person.portrait}" height="36" />`;
    
    var about = "";
    if(person.hasOwnProperty('about')) {
      about = `<a tabindex="0" role="button" 
                  class="btn btn-sm btn-danger ml-2 pb-0" 
                  title="About ${person.handle}"
                  data-placement="bottom"
                  data-bs-toggle="popover"
                  data-bs-trigger="hover"
                  data-bs-animation="true"
                  data-content="${person.about}">
                  <h5>About...</h5>
                </a>`;
    }

    var buttons = `<button class="btn btn-warning btn-sm ml-2" 
                           type="button" id="new-file-${person.id}">
                     ${icons.paperclip}
                   </button>
                   <button class="btn btn-success btn-sm ml-2" 
                           onclick="start_chat([${person.id},people.get_this_person().id]);" 
                           id="start-chat-${person.id}" type="button">
                     ${icons.chat_bubble}
                   </button>
                   <button class="btn btn-success btn-danger btn-sm ml-2" 
                           onclick="send_bell_user(${person.id});" 
                           id="start-chat-${person.id}" type="button">
                     ${icons.bell}
                   </button>`;
    var rowdata = {'rowid':    rowid,
                   'portrait': portrait,
                   'online':   online, 
                   'online_order': person.online ? 1:0,
                   'name':     name, 
                   'buttons':  buttons}
    add_table_row(this.table, rowid, rowdata);
  }

  render() {
    if(this.table != null) {
      console.log("people render");
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
                       "columns": [ { "data": 'type', 'width': '25px'}, 
                                    { "data": 'row'}, 
                                    { "data": 'rowid'}, 
                                    { "data": 'result'} ]};
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

  render(results) {
    console.log("search results...")
    console.log(results);
    this.table.clear();
    var contents = "";
    for(var result in results) {
      var result = results[result];
      switch (result.ftable) {
        case 'messages':
          var message = messages.get_message(result.row_id);
          var type   = `<button onclick='messages.goto(${result.row_id});' 
                                class='btn btn-success btn-sm' type='button'${message ? '':'disabled'}>
                          ${icons.chat_bubble}
                        </button>`;
          break;
        case 'files':
          var file   = files.get_file(result.row_id);
          var type   = `<button class='btn btn-success btn-sm' type='button'${file ? '':'disabled'}>
                          ${ this.file_icon(file.type) }
                        </button>`;
          break;
        case 'cards':
          var card   = cards.get_card(result.row_id);
          var type   = `<button class='btn btn-success btn-sm' type='button'${card ? '':'disabled'}>
                          ${icons.card}
                        </button>`;
          break;
        case 'users':
          var person = people.get_person(result.row_id);
          var type   = `<button class='btn btn-success btn-sm' type='button'${person ? '':'disabled'}>
                          ${icons.person}
                        </button>`;
          break;
        default :
          var type    = `<button class='btn btn-success btn-sm' type='button' disabled>
                           ?
                         </button>`;
          break;
      }

      var row    = `${result.row}`;
      var rowid  = `${result.row_id}`;
      var result = `${markdown.makeHtml(messages.expand_tildes(result.contents))}`;
      var rowdata = {'type':   type,
                     'row':    row,
                     'rowid':   rowid, 
                     'result': result }
      add_table_row(this.table, rowid, rowdata);
    }
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
    upload_file(file, 
                'upload-portrait', 
                function(data) {
      // following is done when upload is finished...
      data = JSON.parse(data);
      if ('error' in data) {
        var status = `<div class="badge badge-danger" style="font-size:1.3em;">
                        ${icons.person}
                      </div>
                      <span class="ml-3 mr-3">
                        <b>Portrait Upload Error:</b> ${ data.error }
                      </span>`;
        set_status(status, 5000);
      } else {
        $('#portrait-image').attr('src', '/portraits/' + data.user.portrait);
        $('#you-image').attr('src', '/portraits/' + data.user.portrait);
        people.set_person(data);
        getter.handle_stuff(data); 
        messages.render();
      } 
    });
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
      this.render_card(card_id, '#display-card-body');
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

  render_card(card_id, container) {
    var card = this.get_card(card_id);
    if(card) {
      var edit_block = "";
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
      $(container).append(`<div class="card bg-light text-dark mt-4">
                              <h5 class="card-header d-flex justify-content-between 
                                         align-items-center">${card.title}
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
    $('#cards').empty();
    $('#cards').append(`<div class="row mt-1">
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
  }

  empty() {
    this.rooms = {};
    //this.render();
  }
  
  change_room(room) {
    this.cur_room = room;
    this.rooms[this.cur_room].unread = 0;
    cookie.write('cur_room', room, '365');
    messages.clear_unread();
    $('#messages').empty();
    messages.render();
    this.render_room_list();
  }

  get_room(room) {
    return this.rooms[room];
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
        unread += room.unread;
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
}
  
class Messages {
  reset() {
    this.top_side    = 0;
    this.bottom_side = 0;
    this.top_user    = 0;
    this.bottom_user = -1;
    this.top_id      = 0;
    this.bottom_id   = 0;
  }

  constructor() {
    this.reset();
    this.messages         = {};
    this.expanded_input   = false;
    this.handling_unread  = false;
    this.label            = "messages"


    $("#new-message").keyup(function(event) {
      if (event.keyCode === 13) {
        if (!event.shiftKey) {
          $("#send-message").click();
          // TODO: this seems dumb, fix
          messages.input_small();
        } else {
          messages.input_large();
        }
      }
    });

    this.input_small();
    $('#send-message').append(icons.chat_bubble);
    $('#footer-new-file').append(icons.paperclip);
    $('#goto-bottom').html(icons.goto_bottom);

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


  render_inline_card(card) {
    if (!card) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
    } else {
      return `<button class="btn btn-dark btn-sm" 
                      onclick="cards.show(${card.id});">
                ${icons.card}
                ${card.title}
              </button>`;
    }
  }
  render_inline_person(person) {
    if (!person) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
    } else {
      return `<button class="btn btn-dark btn-sm">
                ${icons.person}
                @${person.handle}
              </button>`;
    }
  }
 
  render_inline_room(room) {
    if (!room) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
    } else {
      return `<button class="btn btn-dark btn-sm"
                      onclick="rooms.change_room('${room.id}');">
                ${icons.flower}
                #${room.name}
              </button>`;
    }
  }

  render_inline_phone(phone) {
    var number1 = "5035352342";
    var number2 = "(503) 535-2342";
    return `<button class="btn btn-dark btn-sm">
              ${icons.telephone}
              <a href="tel:${number1}">${number2}</a>
            </button>`;
    
  }

  render_inline_file(file) {
    if (!file) {
      return `<span class='btn btn-danger ml-2 mr-2 disabled'> <b> loading... </b> </span>`;
    } else if (file.deleted == true) {
      return `<span class='btn btn-danger disabled ml-2 mr-2'> <b>${file.name}</b> (deleted) </span>`;
    } else {

      switch(file.type) {
        case 'image': 
          return `<button class="btn btn-light btn-sm p-1 m-1">
                    <img height=200 src="/files/${file.localname}"
                         onclick="window.open('/files/${file.localname}','_blank');"/>
                  </button>`;
          break;
        case 'audio':
          var button_id = `msg-play-${this.cur_room}-${file.id}`;
          return `<span class="badge badge-dark">
                    <button class="btn btn-info btn-sm" 
                            onclick="jukebox.play_pause('${button_id}', '/files/${file.localname}');">
                      ${icons.play}
                    </button>
                    ${file.name}
                  </span>`;
        case 'archive':
          return `<button class="btn btn-light btn-sm" 
                          onclick="window.open('/files/${file.localname}','_blank');">
                    ${icons.archive} ${file.name}
                  </button>`;
          //return `<span class="btn btn-warning">${file.name}</span>`;
          break;

        default:
          return `<button class="btn btn-light btn-sm" 
                          onclick="window.open('/files/${file.localname}','_blank');">
                    ${icons.new_tab} ${file.name}
                  </button>`;
          //return `<span class="btn btn-warning">${file.name}</span>`;
          break;
      }

    }
  }

  expand_tildes(text) {
    // TODO: add handling for ~user1~, etc...
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

  min_id(messages, room) {
    var min = 100000000;
    messages.forEach(message => { if((message.room == room) &&
                                     (message.id < min)) min=message.id });
    return min;
  }
  
  max_id(messages, room) {
    var max = 0;
    messages.forEach(message => { if((message.room == room) && 
                                     (message.id > max)) max=message.id });
    return max;
  }


  render(messages = null) {
    var cur_room = rooms.get_cur_room();
    if(cur_room == null) {
      return;
    }
    if(!messages) {
      // redraw everything
      this.reset();
      messages = cur_room.message_index;
    } else if((cur_room.message_index.length > 0) && 
              (this.max_id(messages, cur_room) < cur_room.message_index[0])) {
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
  }

  render_msg_footer(message, user, float) {
    if(user) {
      var username = this.bottom_side % 2 ? `<b class="text-white">${user.handle}</b> ${message.written}` :
                                     `${message.written} <b class="text-white">${user.handle}</b>`;
    } else {
      var username = "unknown";
    }
    return `<div class="row" id="msg-footer-${message.id}">
                    <div class="col-12${float} small-font-size">
                      <small>
                        ${username}
                      </small>
                    </div>
                  </div>`;
  }

  render_msg_portrait(message, portrait) {
    return `<div class="col-1" id="user-info-${message.id}">
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
    $('#messages').append(`<div id='dragon' class="row"><div class="col-12" style="height:600px;">${icons.dragon}</div></div>`);
    console.log('enter the dragon');
  }

  render_message(message, above) {
    var user          = people.get_person(message.user);
    var portrait      = "default.png";
    var handle        = "loading...";
    var switched_side = false;
    var oldest        = rooms.oldest_msg(message.room);
    var backfill      = false;
    var side          = 0;


    if(user) {
      portrait = user.portrait;
      handle   = user.handle;
    } else {
      console.log("???? "+message.user);
    }

    if ((oldest) && (message.id < oldest)) {
      // backfill
      if (this.top_user != message.user) {
        if(this.top_side > 0) {
          switched_side  = true;
        }
        this.top_side += 1;
        this.top_user  = message.user;
      }
      backfill = true;
      side     = this.top_side;
    } else {
      if (this.bottom_user != message.user) {
        this.bottom_side   += 1;
        switched_side       = true;
      } else if (this.prev_msg != null) {
        $(`#msg-${message.room}-${this.prev_msg}`).removeClass('tri-right btm-right-in');
      }
      side = this.bottom_side;
    }

    var empty    = `<div class="col-sm-1"></div>`;
    var classes   = "default-bubble";
    var float     = "";
    var user_info = "";
    var footer = "";

    if(!(side % 2)) {
      float = " text-right";
      if((!backfill) || ((backfill) && (switched_side))) {
        classes += " tri-right btm-right-in";
        user_info = this.render_msg_portrait(message, portrait);
        footer = this.render_msg_footer(message, user, float); 
      }
    } else {
      if((!backfill) || ((backfill) && (switched_side))) {
        classes += " tri-right btm-left-in";
        user_info = this.render_msg_portrait(message, portrait);
        footer = this.render_msg_footer(message, user, float); 
      }
    }

    var contents = this.render_msg_contents(message, classes, float);

    var output = "";
    if(side % 2) {
      output = user_info + contents + empty;
    } else {
      output = empty + contents + user_info;
    }
    
    if((!(switched_side))&&(!(backfill))&&(this.bottom_user != -1)) {
      $(`#user-info-${this.prev_msg}`).remove();
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
      this.bottom_user = message.user;
    }


  }
 
  add(new_messages) {
    for (var message in new_messages) {
      message = new_messages[message];

      if (message.id in this.messages) {
        // TODO: handle message editing/deletion...
        console.log("duplicate message: " + message.id);
      } else {
        this.messages[message.id] = message;
        rooms.add_message(message);
      }
    }
  }

  get_scrollback() {
    var room = rooms.get_cur_room();
    if((room.at_end == false) &&
       ((room.scrollback_state == Scrollback_States.Ready) ||
       ((room.scrollback_state == Scrollback_States.Loading2))))  {
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
    if((this.handling_unread == false) && 
       (room.unread > 0)) {
      this.handling_unread = true;
      setTimeout(() => {
        this.handling_unread = false;
        this.clear_unread();
        rooms.render_room_list();
      }, 2000);
    }
  }

  clear_unread() {
    var room = rooms.get_cur_room();
    var last_seen = room.message_index.slice(-1)[0];

    if(last_seen) {
      socket.emit('have-read', { room: room.id, last: last_seen });
    }
    room.unread = 0;
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
    this.requested = false;
  }

  add(type, id) {
    this.unknown[type][id] = 1;
    if (!this.requested) {
      setTimeout(() => { this.request(); }, 250);
      this.requested = true;
    }
  }

  handle_stuff(stuff) {
    console.log(stuff);
    var update_messages = false;
    var update_files = false;
    var update_users = false;
    var update_rooms = false;
    var update_cards = false;

    if(stuff.__protocol__ > this.protocol) {
      console.log('----------- new version');
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

    if ('users' in stuff) {
      for(var user in stuff['users']) {
        people.set_person(stuff['users'][user])
      }
      update_messages = true;
      update_files = true;
      update_users = true;
    }

    if ('files' in stuff) {
      for(var file in stuff['files']) {
        files.add_update_file(stuff['files'][file])
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
        messages.render(stuff.messages);
        messages.add(stuff.messages);
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

    if(update_users) {
      people.render();
    }

    if((update_rooms)||(update_messages)) {
      rooms.render_room_list();
    }

    if(update_cards) {
      cards.render();
    }
  }

  reset() {
    this.unknown = {'users': {},
                    'files': {},
                    'messages': {},
                    'cards': {},
                    'rooms': {} }
  }

  request() {
    socket.emit('get-stuff', this.unknown);
    this.reset();
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

var icons = {
    'arrow_up': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                      fill="currentColor" class="bi bi-arrow-bar-up" viewBox="0 0 16 16">
                   <path fill-rule="evenodd" 
                         d="M8 10a.5.5 0 0 0 .5-.5V3.707l2.146 2.147a.5.5 0 0 0 
                         .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 
                         .708.708L7.5 3.707V9.5a.5.5 0 0 0 .5.5zm-7 2.5a.5.5 0 0 1 
                         .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z"/>
                 </svg>`,

    'arrow_down': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                        fill="currentColor" class="bi bi-arrow-bar-down" viewBox="0 0 16 16">
                     <path fill-rule="evenodd" 
                           d="M1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 
                           1-.5-.5zM8 6a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 
                           0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 
                           .708-.708L7.5 12.293V6.5A.5.5 0 0 1 8 6z"/>
                   </svg>`,
    'audio':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-file-music" viewBox="0 0 16 16">
                  <path d="M10.304 3.13a1 1 0 0 1 1.196.98v1.8l-2.5.5v5.09c0 
                           .495-.301.883-.662 1.123C7.974 12.866 7.499 13 7 
                           13c-.5 0-.974-.134-1.338-.377-.36-.24-.662-.628-.662-1.123s.301-.883.662-1.123C6.026 
                           10.134 6.501 10 7 10c.356 0 .7.068 1 .196V4.41a1 1 0 0 1 .804-.98l1.5-.3z"/>
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 
                           2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 
                           1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                </svg>`,

    'archive':        `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                            fill="currentColor" class="bi bi-file-zip" viewBox="0 0 16 16">
                         <path d="M6.5 7.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v.938l.4 1.599a1 1 0 0 
                                  1-.416 1.074l-.93.62a1 1 0 0 1-1.109 0l-.93-.62a1 1 0 0 
                                  1-.415-1.074l.4-1.599V7.5zm2 0h-1v.938a1 1 0 0 1-.03.243l-.4 
                                  1.598.93.62.93-.62-.4-1.598a1 1 0 0 1-.03-.243V7.5z"/>
                         <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 
                                  1-2-2V2zm5.5-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 
                                  1-1V2a1 1 0 0 0-1-1H9v1H8v1h1v1H8v1h1v1H7.5V5h-1V4h1V3h-1V2h1V1z"/>
                       </svg>`,

    'binoculars':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                            fill="currentColor" class="bi bi-binoculars" viewBox="0 0 16 16">
                         <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h1A1.5 1.5 0 0 1 7 
                                  2.5V5h2V2.5A1.5 1.5 0 0 1 10.5 1h1A1.5 1.5 0 0 1 13 
                                  2.5v2.382a.5.5 0 0 0 .276.447l.895.447A1.5 1.5 0 0 1 15 
                                  7.118V14.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 
                                  14.5v-3a.5.5 0 0 1 .146-.354l.854-.853V9.5a.5.5 0 0 
                                  0-.5-.5h-3a.5.5 0 0 0-.5.5v.793l.854.853A.5.5 0 0 1 7 
                                  11.5v3A1.5 1.5 0 0 1 5.5 16h-3A1.5 1.5 0 0 1 1 
                                  14.5V7.118a1.5 1.5 0 0 1 .83-1.342l.894-.447A.5.5 0 0 0 3 
                                  4.882V2.5zM4.5 2a.5.5 0 0 0-.5.5V3h2v-.5a.5.5 0 0 
                                  0-.5-.5h-1zM6 4H4v.882a1.5 1.5 0 0 1-.83 1.342l-.894.447A.5.5 0 0 0 2 
                                  7.118V13h4v-1.293l-.854-.853A.5.5 0 0 1 5 10.5v-1A1.5 1.5 0 0 1 6.5 
                                  8h3A1.5 1.5 0 0 1 11 9.5v1a.5.5 0 0 1-.146.354l-.854.853V13h4V7.118a.5.5 0 0 
                                  0-.276-.447l-.895-.447A1.5 1.5 0 0 1 12 4.882V4h-2v1.5a.5.5 0 0 
                                  1-.5.5h-3a.5.5 0 0 1-.5-.5V4zm4-1h2v-.5a.5.5 0 0 
                                  0-.5-.5h-1a.5.5 0 0 0-.5.5V3zm4 11h-4v.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 
                                  .5-.5V14zm-8 0H2v.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V14z"/>
                       </svg>`,

    'bell': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                    fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
                 <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 
                          4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 
                          1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 
                          8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 
                          12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 
                          6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 
                          0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>`,

    'bug':         `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                         fill="currentColor" class="bi bi-bug" viewBox="0 0 16 16">
                      <path d="M4.355.522a.5.5 0 0 1 .623.333l.291.956A4.979 4.979 0 0 1 8 1c1.007 0 
                               1.946.298 2.731.811l.29-.956a.5.5 0 1 1 .957.29l-.41 1.352A4.985 4.985 
                               0 0 1 13 6h.5a.5.5 0 0 0 .5-.5V5a.5.5 0 0 1 1 0v.5A1.5 1.5 0 0 1 13.5 
                               7H13v1h1.5a.5.5 0 0 1 0 1H13v1h.5a1.5 1.5 0 0 1 1.5 1.5v.5a.5.5 0 1 1-1 
                               0v-.5a.5.5 0 0 0-.5-.5H13a5 5 0 0 1-10 0h-.5a.5.5 0 0 0-.5.5v.5a.5.5 
                               0 1 1-1 0v-.5A1.5 1.5 0 0 1 2.5 10H3V9H1.5a.5.5 0 0 1 0-1H3V7h-.5A1.5 
                               1.5 0 0 1 1 5.5V5a.5.5 0 0 1 1 0v.5a.5.5 0 0 0 .5.5H3c0-1.364.547-2.601 
                               1.432-3.503l-.41-1.352a.5.5 0 0 1 .333-.623zM4 7v4a4 4 0 0 0 3.5 
                               3.97V7H4zm4.5 0v7.97A4 4 0 0 0 12 11V7H8.5zM12 6a3.989 3.989 0 0 
                               0-1.334-2.982A3.983 3.983 0 0 0 8 2a3.983 3.983 0 0 0-2.667 1.018A3.989 
                               3.989 0 0 0 4 6h8z"/>
                    </svg>`,

    'chat_bubble': `<svg width="1.92em" height="1.92em" viewBox="0 0 16 16" class="bi bi-chat-text" 
                         fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" 
                            d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 
                               2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 
                               8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 
                               4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 
                               21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 
                               0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 
                               11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 
                               7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
                      <path fill-rule="evenodd" 
                            d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM4 
                               8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8zm0 
                               2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
                    </svg>`,

    'chat_bubble_small': `<svg width="1.00em" height="1.00em" viewBox="0 0 16 16" class="bi bi-chat-text" 
                               fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" 
                                  d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 
                                     2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 
                                     8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 
                                     4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 
                                     21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 
                                     0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 
                                     11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 
                                     7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
                            <path fill-rule="evenodd" 
                                  d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM4 
                                     8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8zm0 
                                     2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
                          </svg>`,
    
    'blank': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                   fill="currentColor" class="bi bi-arrow-bar-up" viewBox="0 0 16 16">
              </svg>`,

    'card': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                  fill="currentColor" class="bi bi-postcard" viewBox="0 0 16 16">
               <path fill-rule="evenodd" d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 
                     2 0 0 0 2-2V4a2 2 0 0 0-2-2H2ZM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 
                     1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm7.5.5a.5.5 0 0 0-1 
                     0v7a.5.5 0 0 0 1 0v-7ZM2 5.5a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 
                     1H2.5a.5.5 0 0 1-.5-.5Zm0 2a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 
                     1H2.5a.5.5 0 0 1-.5-.5Zm0 2a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 
                     1H2.5a.5.5 0 0 1-.5-.5ZM10.5 5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 
                     .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3ZM13 8h-2V6h2v2Z"/>
             </svg>`,

    'download':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                          fill="currentColor" class="bi bi-cloud-download" viewBox="0 0 16 16">
                       <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 
                                4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 
                                12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 
                                7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 
                                10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 
                                1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 
                                7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 
                                11 0 9.366 0 7.318c0-1.763 1.266-3.223 
                                2.942-3.593.143-.863.698-1.723 1.464-2.383z"/>
                       <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 
                                14.293V5.5a.5.5 0 0 0-1 0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z"/>
                     </svg>`,
    'dragon':`      <svg xmlns:dc="http://purl.org/dc/elements/1.1/"
                         xmlns:cc="http://creativecommons.org/ns#"
                         xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                         xmlns:svg="http://www.w3.org/2000/svg"
                         xmlns="http://www.w3.org/2000/svg"
                         xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
                         xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                         width="420px" height="594px" viewBox="0 0 210 297"
                         version="1.1" id="svg11429"
                         inkscape:version="0.92.3 (2405546, 2018-03-11)" 
                         sodipodi:docname="dragon.svg">
                      <defs
                         id="defs11423" />
                      <sodipodi:namedview
                         id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0"
                         inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.98994949"
                         inkscape:cx="404.57449" inkscape:cy="512.12526" inkscape:document-units="mm"
                         inkscape:current-layer="layer1" showgrid="false" inkscape:window-width="1990"
                         inkscape:window-height="1285" inkscape:window-x="389" inkscape:window-y="355"
                         inkscape:window-maximized="0" />
                      <metadata
                         id="metadata11426">
                        <rdf:RDF>
                          <cc:Work
                             rdf:about="">
                            <dc:format>image/svg+xml</dc:format>
                            <dc:type
                               rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
                            <dc:title></dc:title>
                          </cc:Work>
                        </rdf:RDF>
                      </metadata>
                      <g
                         inkscape:label="Layer 1"
                         inkscape:groupmode="layer"
                         id="layer1">
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 19.807745,163.60137 c -7.653012,-35.22756 15.817206,-42.08479 12.710656,-48.32724 -3.070968,-6.17095 -14.967644,1.03432 -16.691136,-6.86988 -1.651133,-7.57233 10.071065,-7.27048 7.315055,-10.972261 -1.314005,-1.764928 -5.589086,-0.600595 -6.229764,0.852925 -0.452183,1.025884 -3.228483,0.427775 -2.470859,-1.783578 1.142302,-3.334151 7.989646,-2.70691 10.76096,-0.529478 7.086205,5.567662 -7.030321,7.834872 -4.995541,11.299482 2.485134,4.23143 8.58434,-4.74325 14.690201,0.9024 12.934743,11.9598 -11.751138,32.25847 9.310751,52.02317 -4.821813,6.64762 -13.511962,7.23154 -24.400323,3.40446 z"
                           id="path12039"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="csssssssscc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 85.826969,165.6801 c 0,0 5.504379,5.49109 14.717241,3.38156 -1.856601,-21.6785 26.48431,-38.53266 30.8875,-3.48076 6.32787,5.37438 12.94028,2.59007 12.94028,2.59007 -3.8843,-47.84594 -57.911122,-41.0765 -58.545021,-2.49087 z"
                           id="path12041"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccccc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 172.22635,166.69963 c -9.04566,-25.85237 -14.37265,-28.04156 -20.36446,-42.33046 -6.60115,-15.74201 -2.92643,-29.471334 8.0241,-31.668655 24.75647,-4.967594 21.99074,26.129245 42.83592,19.356805 4.66015,-1.51405 3.0359,3.70222 4.46257,5.36414 1.95311,2.27518 1.84557,6.23936 -0.78195,7.64977 -7.31781,3.92806 -10.51028,-1.02376 -15.30338,-5.24294 -7.29177,-6.41864 -18.80579,0.92581 -17.89526,10.41292 1.18781,12.37619 10.92739,25.6532 14.25638,37.32192 0,0 -6.47604,3.56471 -15.23392,-0.8635 z"
                           id="path12043"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssssssscc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 159.00871,99.222525 c 0,0 -0.95447,1.782845 -2.69036,0.703256 0,0 -2.44751,-13.961058 -16.25187,-16.627552 -1.89019,-0.365116 -2.67427,-2.571055 -0.74419,-4.349974 2.005,-1.847988 5.4338,-1.968006 5.63168,-0.867601 0.86328,4.800747 13.19735,7.831393 14.05474,21.141871 z"
                           id="path12045"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccsssc" />
                        <path
                           style="fill:#611616;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 142.95857,78.513221 c -1.00621,-1.084066 -5.24336,2.426638 -3.59514,3.394552 1.64823,0.967915 4.60134,-2.310486 3.59514,-3.394552 z"
                           id="path12047"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="csc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 169.29788,75.427679 c 2.89189,1.0347 2.23297,5.076879 2.23297,5.076879 -0.20518,2.698519 -5.76161,-2.262947 -4.52666,15.156336 0,0 -1.05643,1.067036 -2.28936,0.04928 0,0 -2.77164,-20.317254 4.58305,-20.282497 z"
                           id="path12049"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccccc" />
                        <path
                           style="fill:#eeeeee;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 173.03867,98.349649 c -0.63594,0.488347 1.24538,8.928831 11.60384,7.494411 5.50895,-0.76286 0.41674,-16.725205 -11.60384,-7.494411 z"
                           id="path12051"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="sss" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 173.03867,98.349649 c 5.42828,-4.386072 9.55699,-2.265864 9.55699,-2.265864 0,0 -1.7295,5.559915 -8.02512,6.551755 -1.79046,-1.88509 -1.53187,-4.285891 -1.53187,-4.285891 z"
                           id="path12053"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccc" />
                        <path
                           style="fill:#020000;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 180.84318,99.422714 c 0.9766,4.434366 -3.02561,5.534916 -3.02561,5.534916 0,0 -2.77803,-1.28969 -3.24703,-2.32209 3.30808,-0.25736 6.27264,-3.212826 6.27264,-3.212826 z"
                           id="path12055"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccc" />
                        <path
                           style="fill:#f1f1f1;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 162.07364,108.31164 c 0.81142,8.86849 20.28385,4.38259 10.28366,-5.29337 0,0 -7.63177,1.64964 -10.28366,5.29337 z"
                           id="path12057"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 162.07364,108.31164 c 0,0 3.98016,-4.09038 10.28366,-5.29337 -2.17319,-4.098344 -15.68578,-2.94265 -10.28366,5.29337 z"
                           id="path12059"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 168.26694,104.40942 c 0,0 -4.64047,1.66593 -6.1933,3.90222 1.14879,3.78532 11.20113,1.2955 6.1933,-3.90222 z"
                           id="path12061"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:#611616;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 203.56342,114.82965 c 1.26083,0.13893 0.66987,2.74599 1.72193,3.59712 1.70181,1.37679 0.9262,3.99126 -0.70616,4.45455 -8.39569,2.38283 -6.28941,-8.63281 -1.01577,-8.05167 z"
                           id="path12063"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ssss" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 35.282507,187.37586 c 2.20029,2.74327 2.375329,11.6906 2.375329,11.6906 -0.118383,-15.28452 7.6201,0.13435 7.6201,0.13435 5.158587,-1.77018 8.105635,-6.26945 7.349788,-7.31902 -0.810602,-1.12558 -2.652699,-0.66417 -3.819151,1.07413 -3.930145,5.85687 6.21046,4.84859 9.447683,1.54918"
                           id="path12065-7"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 59.337898,197.64094 -1.390846,-5.51758 c 0,0 8.493698,-3.52125 7.280761,0.0915"
                           id="path12067-1"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 64.94545,196.10544 c 8.872352,-0.63154 9.236374,-4.78069 7.848925,-5.51168 -1.221248,-0.64343 -4.380095,0.79434 -3.621659,3.85075 0.499237,2.01186 6.365494,1.38949 6.365494,1.38949"
                           id="path12069-7"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 42.795087,186.1404 c -4.097746,0.91182 2.482849,13.06041 2.482849,13.06041"
                           id="path12071-1"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 35.282508,187.37586 c 2.20029,2.74327 2.375329,11.6906 2.375329,11.6906 -0.118383,-15.28452 7.6201,0.13435 7.6201,0.13435 5.158587,-1.77018 8.105635,-6.26945 7.349788,-7.31902 -0.810602,-1.12558 -2.652699,-0.66417 -3.819151,1.07413 -3.930145,5.85687 6.21046,4.84859 9.447683,1.54918"
                           id="path12065"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 59.337899,197.64094 -1.390846,-5.51758 c 0,0 8.493699,-3.52125 7.280761,0.0915"
                           id="path12067"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 90.302106,198.23167 c 0,0 -0.701056,-5.66271 -3.320751,-12.39863 2.051846,-1.29907 4.030056,-1.126 5.070771,0.33841 1.80204,2.53569 -2.362697,6.83439 -2.362697,6.83439 0,0 3.737009,-3.72594 5.032351,-1.03854 2.508916,5.20514 -3.23636,6.60747 -3.23636,6.60747"
                           id="path12075-8"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccscsc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 64.945451,196.10544 c 8.872352,-0.63154 9.236374,-4.78069 7.848924,-5.51168 -1.221247,-0.64343 -4.380095,0.79434 -3.621659,3.85075 0.499239,2.01186 6.365496,1.38949 6.365496,1.38949"
                           id="path12069"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 100.16199,197.23842 c 2.56051,-0.90635 4.00909,-3.55988 2.67192,-4.69981 -1.60303,-1.36658 -5.572493,3.15141 -4.214762,4.77688 1.294924,1.55029 3.184582,2.80985 10.644692,1.21886"
                           id="path12077-6"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 42.795088,186.1404 c -4.097746,0.91182 2.482849,13.06041 2.482849,13.06041"
                           id="path12071"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 114.83732,187.52935 2.73511,9.44761 c 3.72697,0.69203 8.50228,-3.74159 6.39886,-8.30388 -0.7192,-1.5599 -3.85332,-5.9528 -12.34004,-2.48953"
                           id="path12079-8"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccsc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 90.302107,198.23167 c 0,0 -0.701057,-5.66271 -3.320752,-12.39863 2.051848,-1.29907 4.030056,-1.126 5.070773,0.33841 1.802038,2.53569 -2.362698,6.83439 -2.362698,6.83439 0,0 3.737009,-3.72594 5.03235,-1.03854 2.508918,5.20514 -3.236359,6.60747 -3.236359,6.60747"
                           id="path12075"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccscsc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 126.57379,191.40455 c 0,0 1.39249,4.7615 1.35938,4.44629 -2.66333,-9.57827 5.70234,-4.97564 5.70234,-4.97564"
                           id="path12081-0"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 100.16199,197.23842 c 2.56051,-0.90635 4.00909,-3.55988 2.67192,-4.69981 -1.60303,-1.36658 -5.572492,3.15141 -4.214761,4.77688 1.294924,1.55029 3.184581,2.80985 10.644691,1.21886"
                           id="path12077"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 141.90184,194.5322 c -1.7363,-0.34875 -4.9924,-4.85074 -4.9924,-4.85074 -6.83568,3.69247 -1.00263,8.05123 2.31622,3.64465"
                           id="path12083-7"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 114.83732,187.52935 2.73511,9.44761 c 3.72697,0.69203 8.50228,-3.74159 6.39886,-8.30388 -0.7192,-1.5599 -3.85332,-5.9528 -12.34004,-2.48953"
                           id="path12079"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccsc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 146.23767,192.5258 c -10.67815,0.0807 -1.03861,-4.62871 -1.03861,-4.62871 5.93274,3.68968 10.28601,10.35083 8.30875,12.15086 -2.49664,2.27285 -10.79901,2.22869 -11.53487,-1.8052 -0.34324,-1.88165 1.56544,-3.85075 5.24254,-4.46196 2.59377,-0.43112 5.38707,-0.43881 7.59886,-0.71123 6.24679,-0.76938 0.45555,-9.82091 -1.55378,-0.43166"
                           id="path12085-8"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccssssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 126.57379,191.40455 c 0,0 1.39249,4.7615 1.35938,4.44629 -2.66333,-9.57827 5.70234,-4.97564 5.70234,-4.97564"
                           id="path12081"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 159.28871,189.75261 1.50886,3.64449 c -3.12784,-9.55072 2.20802,-7.498 4.24172,-1.48662"
                           id="path12087-6"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 141.90184,194.5322 c -1.7363,-0.34875 -4.9924,-4.85074 -4.9924,-4.85074 -6.83568,3.69247 -1.00263,8.05123 2.31622,3.64465"
                           id="path12083"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 172.73247,186.47076 c -0.39178,-3.93181 -6.84612,0.76166 -6.84612,0.76166 0.81237,1.89185 10.21311,3.04081 9.44366,6.16779 -0.45305,1.84114 -4.76123,0.18147 -5.91153,0.55725"
                           id="path12089-6"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 146.23767,192.5258 c -10.67815,0.0807 -1.03861,-4.62871 -1.03861,-4.62871 5.93274,3.68968 10.28601,10.35083 8.30875,12.15086 -2.49664,2.27285 -10.79901,2.22869 -11.53487,-1.8052 -0.34324,-1.88165 1.56544,-3.85075 5.24254,-4.46196 2.59377,-0.43112 5.38707,-0.43881 7.59886,-0.71123 6.24679,-0.76938 0.45555,-9.82091 -1.55378,-0.43166"
                           id="path12085"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccssssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 159.28871,189.75261 1.50886,3.64449 c -3.12784,-9.55072 2.20802,-7.498 4.24172,-1.48662"
                           id="path12087"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 172.73247,186.47076 c -0.39178,-3.93181 -6.84612,0.76166 -6.84612,0.76166 0.81237,1.89185 10.21311,3.04081 9.44366,6.16779 -0.45305,1.84114 -4.76123,0.18147 -5.91153,0.55725"
                           id="path12089"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                      </g>
                    </svg>`,




    'edit': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                  fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
               <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 
                        .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 
                        2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
               <path fill-rule="evenodd" 
                     d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 
                        0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 
                        0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>`,

    'edit_small': `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                        fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                     <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 
                              .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 
                              2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                     <path fill-rule="evenodd" 
                           d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 
                              0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 
                              0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>`,

    'flower': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                    fill="currentColor" class="bi bi-flower1" viewBox="0 0 16 16">
                 <path d="M6.174 1.184a2 2 0 0 1 3.652 0A2 2 0 0 1 12.99 3.01a2 2 0 0 1 1.826 3.164 2 2 0 0 1 0 
                          3.652 2 2 0 0 1-1.826 3.164 2 2 0 0 1-3.164 1.826 2 2 0 0 1-3.652 0A2 2 0 0 1 3.01 
                          12.99a2 2 0 0 1-1.826-3.164 2 2 0 0 1 0-3.652A2 2 0 0 1 3.01 3.01a2 2 0 0 1 3.164-1.826zM8 
                          1a1 1 0 0 0-.998 1.03l.01.091c.012.077.029.176.054.296.049.241.122.542.213.887.182.688.428 1.513.676 
                          2.314L8 5.762l.045-.144c.248-.8.494-1.626.676-2.314.091-.345.164-.646.213-.887a4.997 
                          4.997 0 0 0 .064-.386L9 2a1 1 0 0 0-1-1zM2 9l.03-.002.091-.01a4.99 4.99 0 0 0 
                          .296-.054c.241-.049.542-.122.887-.213a60.59 60.59 0 0 0 2.314-.676L5.762 
                          8l-.144-.045a60.59 60.59 0 0 0-2.314-.676 16.705 16.705 0 0 0-.887-.213 4.99 4.99 0 0 
                          0-.386-.064L2 7a1 1 0 1 0 0 2zm7 5-.002-.03a5.005 5.005 0 0 0-.064-.386 16.398 16.398 0 0 
                          0-.213-.888 60.582 60.582 0 0 0-.676-2.314L8 10.238l-.045.144c-.248.8-.494 1.626-.676 
                          2.314-.091.345-.164.646-.213.887a4.996 4.996 0 0 0-.064.386L7 14a1 1 0 1 0 2 
                          0zm-5.696-2.134.025-.017a5.001 5.001 0 0 0 .303-.248c.184-.164.408-.377.661-.629A60.614 
                          60.614 0 0 0 5.96 9.23l.103-.111-.147.033a60.88 60.88 0 0 0-2.343.572c-.344.093-.64.18-.874.258a5.063 
                          5.063 0 0 0-.367.138l-.027.014a1 1 0 1 0 1 1.732zM4.5 14.062a1 1 0 0 0 
                          1.366-.366l.014-.027c.01-.02.021-.048.036-.084a5.09 5.09 0 0 0 .102-.283c.078-.233.165-.53.258-.874a60.6 
                          60.6 0 0 0 .572-2.343l.033-.147-.11.102a60.848 60.848 0 0 0-1.743 1.667 17.07 17.07 0 0 0-.629.66 5.06 
                          5.06 0 0 0-.248.304l-.017.025a1 1 0 0 0 .366 1.366zm9.196-8.196a1 1 0 0 0-1-1.732l-.025.017a4.951 
                          4.951 0 0 0-.303.248 16.69 16.69 0 0 0-.661.629A60.72 60.72 0 0 0 10.04 6.77l-.102.111.147-.033a60.6 
                          60.6 0 0 0 2.342-.572c.345-.093.642-.18.875-.258a4.993 4.993 0 0 0 .367-.138.53.53 0 0 0 .027-.014zM11.5 
                          1.938a1 1 0 0 0-1.366.366l-.014.027c-.01.02-.021.048-.036.084a5.09 5.09 0 0 
                          0-.102.283c-.078.233-.165.53-.258.875a60.62 60.62 0 0 0-.572 2.342l-.033.147.11-.102a60.848 60.848 0 0 0 
                          1.743-1.667c.252-.253.465-.477.629-.66a5.001 5.001 0 0 0 .248-.304l.017-.025a1 1 0 0 0-.366-1.366zM14 9a1 
                          1 0 0 0 0-2l-.03.002a4.996 4.996 0 0 0-.386.064c-.242.049-.543.122-.888.213-.688.182-1.513.428-2.314.676L10.238 
                          8l.144.045c.8.248 1.626.494 2.314.676.345.091.646.164.887.213a4.996 4.996 0 0 0 .386.064L14 9zM1.938 4.5a1 
                          1 0 0 0 .393 1.38l.084.035c.072.03.166.064.283.103.233.078.53.165.874.258a60.88 60.88 0 0 0 
                          2.343.572l.147.033-.103-.111a60.584 60.584 0 0 0-1.666-1.742 16.705 16.705 0 0 0-.66-.629 4.996 4.996 0 0 
                          0-.304-.248l-.025-.017a1 1 0 0 0-1.366.366zm2.196-1.196.017.025a4.996 4.996 0 0 0 
                          .248.303c.164.184.377.408.629.661A60.597 60.597 0 0 0 6.77 5.96l.111.102-.033-.147a60.602 60.602 0 0 
                          0-.572-2.342c-.093-.345-.18-.642-.258-.875a5.006 5.006 0 0 0-.138-.367l-.014-.027a1 1 0 1 0-1.732 1zm9.928 
                          8.196a1 1 0 0 0-.366-1.366l-.027-.014a5 5 0 0 0-.367-.138c-.233-.078-.53-.165-.875-.258a60.619 60.619 0 0 
                          0-2.342-.572l-.147-.033.102.111a60.73 60.73 0 0 0 1.667 1.742c.253.252.477.465.66.629a4.946 4.946 0 0 0 
                          .304.248l.025.017a1 1 0 0 0 1.366-.366zm-3.928 2.196a1 1 0 0 0 1.732-1l-.017-.025a5.065 5.065 0 0 
                          0-.248-.303 16.705 16.705 0 0 0-.629-.661A60.462 60.462 0 0 0 9.23 10.04l-.111-.102.033.147a60.6 60.6 0 0 0 
                          .572 2.342c.093.345.18.642.258.875a4.985 4.985 0 0 0 .138.367.575.575 0 0 0 .014.027zM8 9.5a1.5 1.5 0 1 0 
                          0-3 1.5 1.5 0 0 0 0 3z"/>
               </svg>`,

    'goto_bottom':  `<svg xmlns="http://www.w3.org/2000/svg" width="1.96em" height="1.96em" 
                          fill="currentColor" class="bi bi-arrow-down-square" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" 
                          d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 
                             1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 
                             1-2-2V2zm8.5 2.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 
                             0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
                     </svg>`,

    'image':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-file-image" viewBox="0 0 16 16">
                    <path d="M8.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 
                             2-2V2a2 2 0 0 0-2-2zM3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 
                             1v8l-2.083-2.083a.5.5 0 0 0-.76.063L8 11 5.835 
                             9.7a.5.5 0 0 0-.611.076L3 12V2z"/>
                  </svg>`,

    'locked':         `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                            fill="currentColor" class="bi bi-lock" viewBox="0 0 16 16">
                         <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 
                                  0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 
                                  0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 
                                  1 0 0 1 1-1z"/>
                       </svg>`,


    'message':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                         fill="currentColor" class="bi bi-journal-arrow-up" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" 
                            d="M8 11a.5.5 0 0 0 .5-.5V6.707l1.146 1.147a.5.5 0 0 0 
                               .708-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 1 0 
                               .708.708L7.5 6.707V10.5a.5.5 0 0 0 .5.5z"/>
                      <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 
                               1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 
                               1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                      <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 
                               0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 
                               1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 
                               0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
                    </svg>`,

    'new_tab_small':   `<svg xmlns="http://www.w3.org/2000/svg" width="1.0em" height="1.0em" 
                             fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 
                                           4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 
                                           1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 
                                           1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 
                                           .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 
                                           1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 
                                           1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                        </svg>`,

    'new_tab':   `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                         fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 
                                       4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 
                                       1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 
                                       1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 
                                       .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                      <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 
                                       1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 
                                       1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                    </svg>`,

    'outlet':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-outlet" viewBox="0 0 16 16">
                    <path d="M3.34 2.994c.275-.338.68-.494 1.074-.494h7.172c.393 0 .798.156 1.074.494.578.708 
                             1.84 2.534 1.84 5.006 0 2.472-1.262 4.297-1.84 5.006-.276.338-.68.494-1.074.494H4.414c-.394 
                             0-.799-.156-1.074-.494C2.762 12.297 1.5 10.472 1.5 8c0-2.472 1.262-4.297 
                             1.84-5.006zm1.074.506a.376.376 0 0 0-.299.126C3.599 4.259 2.5 5.863 2.5 8c0 2.137 
                             1.099 3.74 1.615 4.374.06.073.163.126.3.126h7.17c.137 0 .24-.053.3-.126.516-.633 
                             1.615-2.237 1.615-4.374 0-2.137-1.099-3.74-1.615-4.374a.376.376 0 0 0-.3-.126h-7.17z"/>
                    <path d="M6 5.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v1.5a.5.5 
                             0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM7 10v1h2v-1a1 1 0 0 0-2 0z"/>
                  </svg>`,

    'paperclip': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                           fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
                        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 
                                 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 
                                 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
                      </svg>`,

    'pdf':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-file-pdf" viewBox="0 0 16 16">
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 
                           0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 
                           1 0 0 1 1-1z"/>
                  <path d="M4.603 12.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 
                           0 0 1 1.482-.645 19.701 19.701 0 0 0 1.062-2.227 7.269 7.269 0 0 
                           1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 
                           0 0 1 .477.365c.088.164.12.356.127.538.007.187-.012.395-.047.614-.084.51-.27 1.134-.52 
                           1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 
                           1.334.05c.364.065.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 
                           0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.716 5.716 0 0 
                           1-.911-.95 11.642 11.642 0 0 0-1.997.406 11.311 11.311 0 0 1-1.021 
                           1.51c-.29.35-.608.655-.926.787a.793.793 0 0 
                           1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.27.27 
                           0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.647 
                           12.647 0 0 1 1.01-.193 11.666 11.666 0 0 1-.51-.858 20.741 20.741 0 0 1-.5 
                           1.05zm2.446.45c.15.162.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 
                           0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.881 
                           3.881 0 0 0-.612-.053zM8.078 5.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 
                           0 0 0-.032-.198.517.517 0 0 
                           0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
                </svg>`,

    'person':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 
                             0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 
                             4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 
                             10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 
                             1.418-.832 1.664h10z"/>
                  </svg>`,

    'play':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                      fill="currentColor" class="bi bi-caret-right" viewBox="0 0 16 16">
                   <path d="M6 12.796V3.204L11.481 8 6 12.796zm.659.753 5.48-4.796a1 
                            1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 
                            3.204v9.592a1 1 0 0 0 1.659.753z"/>
                 </svg>`,
    'plug':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-plug" viewBox="0 0 16 16">
                  <path d="M6 0a.5.5 0 0 1 .5.5V3h3V.5a.5.5 0 0 1 1 0V3h1a.5.5 0 0 1 .5.5v3A3.5 
                           3.5 0 0 1 8.5 10c-.002.434-.01.845-.04 1.22-.041.514-.126 1.003-.317 
                           1.424a2.083 2.083 0 0 1-.97 1.028C6.725 13.9 6.169 14 5.5 14c-.998 
                           0-1.61.33-1.974.718A1.922 1.922 0 0 0 3 16H2c0-.616.232-1.367.797-1.968C3.374 
                           13.42 4.261 13 5.5 13c.581 0 
                           .962-.088 1.218-.219.241-.123.4-.3.514-.55.121-.266.193-.621.23-1.09.027-.34.035-.718.037-1.141A3.5 
                           3.5 0 0 1 4 6.5v-3a.5.5 0 0 1 .5-.5h1V.5A.5.5 0 0 1 6 0zM5 4v2.5A2.5 2.5 
                           0 0 0 7.5 9h1A2.5 2.5 0 0 0 11 6.5V4H5z"/>
                </svg>`,
    'pause':   `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 
                           1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 
                           0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                 </svg>`,

    'telephone': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-telephone-outbound" viewBox="0 0 16 16">
                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 
                             1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 
                             6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 
                             0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 
                             1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 
                             1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 
                             1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 
                             2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 
                             .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 
                             1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 
                             0 0 1-7.01-4.42 18.634 18.634 0 0 
                             1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511zM11 .5a.5.5 0 0 1 
                             .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-4.146 4.147a.5.5 0 0 
                             1-.708-.708L14.293 1H11.5a.5.5 0 0 1-.5-.5z"/>
                  </svg>`,

     'search':  `<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" 
                      fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                   <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 
                            3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 
                            5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                 </svg>`,

    'trash':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 
                             .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 
                             .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 
                                     2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 
                                     1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 
                                     1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 
                                     1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>`,

    'unlocked':       `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                            fill="currentColor" class="bi bi-unlock" viewBox="0 0 16 16">
                         <path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 
                                  1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 
                                  2 0 0 0-2-2zM3 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 
                                  1-1V9a1 1 0 0 0-1-1H3z"/>
                        </svg>`,
  
    'unknown': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-file" viewBox="0 0 16 16">
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 
                           2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 
                           1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                </svg>`,


    'video':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 
                                     1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 
                                     1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 
                                     1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 
                                     4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 
                                     1 0 0 0-1-1H2z"/>
                  </svg>`
    };


const url_parameters = new URLSearchParams(window.location.search);

var socket = io({rememberTransport: false});

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
  resize_div('#messages', 95, 15);
  resize_div('#files', 95, 0);
  window.setTimeout(function () {
    $(window).trigger('resize');}, 2000);
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
  socket.emit('start-chat', {users:ids});
}

function send_bell_user(userid) {
  socket.emit('send-bell-user', {user:userid});
}

function send_bell_room() {
  socket.emit('send-bell-room', {room:messages.cur_room});
}

function send_message() {
  messages.send(socket);
}

function send_logout() {
    people.empty();
    files.empty();
    rooms.empty();
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




// The following functions are for handling file drag/drop

function dragover_handler(ev) {
 ev.preventDefault();
 ev.stopPropagation();
 ev.dataTransfer.dropEffect = "move";
}


function handle_file_upload(file) {
  upload_file(file, 'upload-file', function(data) {
    data = JSON.parse(data);
    getter.handle_stuff(data);
    // TODO: sort this out (probably remove everything? -- deprecated)
    for(file in data.files) {
      file = data.files[file];
      if(cards.editor_open() == true) {
        cards.add_file(file.id);
      } else { 
        messages.add_file(file.id);
      }
    }
  });
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
  // TODO: allow user to drag things out of the window...
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


  if($('#messages').scrollTop() >= 0) {
    $('#goto-bottom').addClass('d-none');
  } else {
    if( total_height - location < 1000 ) {
      messages.get_scrollback();
    }
    $('#goto-bottom').removeClass('d-none');
  }
});

$('#new-user-ok').click(function() {
  $('#new-user').modal('hide');
  $('#contents').removeClass('d-none');
  var entered_password = $('#new-user-password').val();
  if (entered_password.length > 0) {
    settings.set_new_password(entered_password);
  }
});

$('#footer-new-file').on('click touchstart', function() {
  $(this).val('');
  $('#footer-upload-file').trigger('click');
});

$('#footer-upload-file').on('change', function(evt) {
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

socket.on('bell', data => {
  const audio = new Audio("bell.wav");
  audio.play();
});

socket.on('login-result', data => {
  if(data.authenticated) {
    people.set_this_person(data.userid);
    if(url_parameters.has('token')) {
      // if it's a new user logging in, remove the arguments from the url
      window.history.pushState({}, '', '/');
    }
    $('#navbar').removeClass('d-none');
    $('#footer').removeClass('d-none');
    $('#login').modal('hide');
    if ('sessionid' in data) {
      cookie.write('sessionid', data.sessionid, 365);
    }
    if ('new-user' in data) {
      $('#new-user').modal('show');
      $('#new-user-password').keyup(function () {
        regulate_password('#new-user-password', '#new-user-password2', '#new-user-ok')
      });
      $('#new-user-password2').keyup(function () {
        regulate_password('#new-user-password', '#new-user-password2', '#new-user-ok')
      });

    } else {
      $('#contents').removeClass('d-none');
    }
    if(cookie.read('file_number') == '') {
      cookie.write('file_number', '0', 365);
    }
    getter.handle_stuff(data);
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

socket.on('invite-result', data => {
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

socket.on('delete-file-result', data => {
  console.log(`deleting file -- ${data.file_id}`);
  console.log(data);
  if(data.status == 'ok') {
    for (file in data['stuff-list'].files) {
      file = data['stuff-list'].files[file];
      var filename = file ? file.name:"unknown file?";
      files.delete_file(data.file_id);
      files.update_table_row(file);
    }
    //files.render();
    messages.render();
    set_status(`${filename} deleted`, 3000);
  } else {
    set_status(`${filename} delete failed: ${data.error}`, 3000);
  }


});

socket.on('search-result', data => {
  search.render(data);
});

socket.on('password-set', data => {
  cookie.write('sessionid', data.sessionid, 365);
});

socket.on('disconnect', data => {
  var status = `<div class="badge badge-danger">${icons.outlet} ${icons.plug}</div> Network Disconnect`;
  set_status(status);
  $('#status-indicator').html(status);
  $('#status-indicator').removeClass('d-none');
});

socket.on('settings-result', data => {
  set_status(data.status_msg,5000);
});

socket.on('goto_chat', data => {
  rooms.add_room(data.room); 
  rooms.change_room(data.room.id);
  tabs.show('messages');
});

socket.on('file-uploaded', data => {
  getter.handle_stuff(data);
  for(file in data.files) {
    file = data.files[file];
    if('portrait' in data) {
      $('#portrait-image').attr('src', '/portraits/' + data.user.portrait);
      $('#you-image').attr('src', '/portraits/' + data.user.portrait);
      people.set_person(data.user);
    } else if(cards.editor_open() == true) {
      cards.add_file(file.id);
    } else { 
      messages.add_file(file.id);
    }
  }
});

socket.on('stuff-list', data => {
  getter.handle_stuff(data);
});

