
function qsv(selector) {
  return document.querySelector(selector).value;
}

class Tabs {
  constructor(tab) {
    $('#'+tab).removeClass('d-none'); 
    this.cur_tab = tab;
    setTimeout(function() { $('#new-message').focus() }, 500);
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
    }            
    
    $('#'+this.cur_tab).addClass('d-none'); 
    $('#'+tab).removeClass('d-none'); 

    $('#'+this.cur_tab+"-nav").removeClass("active");
    $('#'+tab+"-nav").addClass("active");

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
class Files {
  constructor() {
    this.files = {};

  }

  empty() {
    this.files = {};
    this.render();
  }

  add_file(file) {
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

  render() {
    $('#files').empty();
    for (var file in this.files) {
      var file  = this.files[file];
      //alert(JSON.stringify(file));
      var owner = people.get_person(file.owner);
      if(owner) {

        var file_icon = icons.unknown;
        if (icons.hasOwnProperty(file.type)) {
          file_icon = icons[file.type];
        }
        var button_id = `files-play-sound-${file.id}`;
        var play_button = "";
        if (file.type in {'video':true, 'audio':true}){
          play_button = `
            <button class="btn btn-info btn-sm" id="${button_id}" 
                    style="width:60px;"
                    onclick="jukebox.play_pause('${button_id}', '/files/${file.localname}');">
              ${icons.play}
            </button>`;
        } else {
          play_button = `<button class="btn btn-dark btn-sm" style="width:60px;" disabled>
                           ${icons.blank}
                         </button>`;
        }

        $('#files').append(`<div class="row mt-1"> 
                               <div class="col-3">
                                 ${play_button}
                                 <a download class="btn btn-light btn-sm" href="/files/${file.localname}">
                                   ${icons.download}
                                 </a>
                                 <button class="btn btn-light btn-sm" onclick="window.open('/files/${file.localname}','_blank');">
                                   ${icons.new_tab}
                                 </button>
                              </div>
                              <div class="col-5">
                                 <button class="btn btn-secondary btn-sm btn-block text-left">
                                   ${file_icon}
                                   ${file.name}
                                 </button>
                               </div>
                               <div class="col-2">
                                 <div class="container-sm">
                                   <h5>${owner.handle}</h5>
                                 </div>
                               </div> 
                               <div class="col-2">
                                 <button class="btn btn-success btn-sm ml-2" 
                                         onclick="start_chat([${owner.id},people.get_this_person().id]);" 
                                         id="start-chat-${owner.id}" type="button">
                                   ${icons.chat_bubble}
                                 </button>
                                 <button class="btn btn-warning btn-sm" onclick="send_delete_file(${file.id});">
                                   ${icons.trash}
                                 </button>
                               </div>

                             </div>`);
      }
    }
  }
}


class People {
  constructor() {
    this.people = {};
    this.this_person = -1;


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

  render() {
    $('#people').empty();
    for (var person in this.people) {
      person = this.get_person(person);
      if(person) {
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
        $('#people').append(`<div class="row mt-1"> 
                               <div class="col-1 ml-2">
                                 <img src="/portraits/${person.portrait}" height="36" />
                               </div>
                               <div class="col-3">
                                 <span class="badge badge-dark btn-sm ml-2">
                                   <h5>${person.handle}</h5>
                                 </span>
                               </div>
                               <div class="col-1">
                                 ${about}
                               </div>
                               <div class="col-6">
                                 <button class="btn btn-warning btn-sm ml-2" 
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
                                 </button>
                               </div>

                             </div>`);
      }
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

  send_portrait() {
    var file = document.getElementById('portrait-upload-file').files[0];
    upload_file(file, 
                'upload-portrait', 
                function(data) {
      // following is done when upload is finished...
      data = JSON.parse(data);
      $('#portrait-image').attr('src', '/portraits/' + data.user.portrait);
      people.set_person(data);
      people.render();
      files.render()
      messages.render(); });
  }



  set_defaults() {
    var person = people.get_this_person();
    $('#portrait-image').attr('src', '/portraits/' + person.portrait);
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
    this.cur_edit_card     = null;
    this.form_fields       = ['title', 'content'];
  }

  new() {
    this.cur_edit_card = null;
    this.set_room_list(messages);
    $('#card-title').empty();
    $('#card-content').empty();
    $('#card-id').val(null);
    $('#do-edit-card').html('Add Card');
    $('#edit-card').modal('show');
    $('#card-private').prop('checked', false);
    $('#card-rooms').prop('disabled', true);
    $('#card-locked').prop('checked', false);
  }

  set_room_list(messages) {
    var card = this.get_card(this.cur_edit_card);
    $('#card-rooms').empty();
    for (var room in messages.rooms) {
      var selected = "";
      room = messages.rooms[room];
      if(room.id == card.room) {
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
      $('#edit-card').modal('show');
    }
  }

  toggle_lock(card_id, state) {
    socket.emit('card-toggle-lock', {card_id: card_id, 
                                     state: state});
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
      console.log(card.room);
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


    

class Messages {
  constructor() {
    this.rooms           = {};
    this.expanded_input  = false;
    this.handling_unread = false;
    this.label           = "messages"
    var cur_room         = cookie.read('cur_room');

    if(cur_room != "") {
      this.cur_room = cur_room;
    } else {
      this.cur_room = "1";
    }

    $("#new-message").keyup(function(event) {
      if (event.keyCode === 13) {
        if (!event.shiftKey) {
          $("#send-message").click();
          messages.input_small();
        } else {
          messages.input_large();
        }
      }
    });

    this.input_small();
    $('#send-message').append(icons.chat_bubble);
    $('#footer-new-file').append(icons.paperclip);

  }

  empty() {
    this.rooms = {};
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
      socket.emit('message', {message:message, room:parseInt(messages.cur_room)});
      $('#new-message').val("");
    }
  }

  change_room(room) {
    this.cur_room = room;
    this.rooms[this.cur_room].unread = 0;
    cookie.write('cur_room', room, '365');
    this.clear_unread();
    this.render();
    this.render_room_list();
  }
 
  add_room(room) {
    if(!this.rooms.hasOwnProperty(room.id)) {
      this.rooms[room.id] = room;
      this.rooms[room.id].messages = [];
      this.rooms[room.id].unread = 0;
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
                                                         onclick="messages.change_room('${room.id}');"> 
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

  render_inline_file(file) {
    if (!file) {
      return `<span class='btn btn-danger'> <b> loading... </b> </span>`;
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

  render() {
    this.side = 0; // left
    this.cur_user = 0;
    if(this.rooms.hasOwnProperty(this.cur_room)) {
        if(this.rooms[this.cur_room].messages.length > 0) {
          this.cur_user = this.rooms[this.cur_room].messages[0].user;
        }
        $('#messages').html('');
        for (let message of this.rooms[this.cur_room].messages) {
          this.render_message(message);
        }
    }
  }

  expand_tildes(text) {
    var inline_files  = text.match(/~file(\d+)~/gm);
    var inline_cards  = text.match(/~card(\d+)~/gm);
    
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
    return text;
  }


  render_message(message) {
    var user          = people.get_person(message.user);
    var portrait      = "default.png";
    var handle        = "loading...";
    var msg           = message.message;
    var prev_msg      = null;
    var switched_side = false;

    msg = this.expand_tildes(msg);

    if(user) {
      portrait = user.portrait;
      handle   = user.handle;
    }

    if (this.cur_user != message.user) {
      this.side += 1;
      this.cur_user = message.user;
      switched_side = true;
    } else if (this.prev_msg != null) {
      $(`#msg-${message.room}-${this.prev_msg}`).removeClass('tri-right btm-right-in');
    }

    var classes = "tri-right btm-left-in default-bubble";
    var float = "";
    if(!(this.side % 2)) {
      float = " text-right";
      classes = "tri-right btm-right-in default-bubble";
    }

    //<b>${handle}</b>
    var user_info = `<div class="col-1" id="user-info-${message.id}">
                      <img src="/portraits/${portrait}" width=40 />
                    </div>`;
    var empty    = `<div class="col-2"></div>`;
    var contents = `<div class="col-9${float}">
                      <span id="msg-${message.room}-${message.id}" 
                            class="${classes}">
                        ${markdown.makeHtml(msg)}
                      </span>
                    </div>`;

    var output = "";
    if(this.side % 2) {
      output = user_info + contents + empty;
      if(!(switched_side)) {
        $(`#user-info-${this.prev_msg}`).remove();
        $(`#msg-${message.room}-${this.prev_msg}`).parent().removeClass('col-9');
        $(`#msg-${message.room}-${this.prev_msg}`).parent().addClass('col-10');
      }
    } else {
      output = empty + contents + user_info;
      if(!(switched_side)) {
        $(`#user-info-${this.prev_msg}`).remove();
        $(`#msg-${message.room}-${this.prev_msg}`).parent().removeClass('col-9');
        $(`#msg-${message.room}-${this.prev_msg}`).parent().addClass('col-10');
      }
    }

    if($(`#message-${message.id}`).length) {
      $(`#message-${message.id}`).html(output);
    } else {
      $('#messages').prepend(`<div class="row mb-1" id="message-${message.id}"> 
                                ${output}
                              </div>`);
    }
    
    this.prev_msg = message.id;


  }
 
  add(message) {
    if (!this.rooms.hasOwnProperty(message.room)) {
      this.add_room({id:message.room, placeholder:true});
    }
    if(message.id > this.rooms[message.room].last_seen) {
      this.rooms[message.room].unread += 1;
      if((document.visibilityState == 'visible') && 
         (message.room == this.cur_room)){
        this.rooms[message.room].last_seen = message.id;
      } 
    }
    this.rooms[message.room].messages.push(message);
    if ((this.rooms[message.room].hasOwnProperty('name')) &&
        (this.rooms[message.room]['name'].startsWith("Chat With"))) {
      return 2;
    } else {
      return 1;
    }
  }
 
  handle_unread() {
    if((this.handling_unread == false) && 
       (this.rooms[this.cur_room].unread > 0)) {
      this.handling_unread = true;
      setTimeout(() => {
        this.handling_unread = false;
        this.clear_unread();
        this.render_room_list();
      }, 2000);
    }
  }

  clear_unread() {
    var last_seen = this.rooms[this.cur_room].messages.slice(-1)[0];

    if(last_seen) {
      socket.emit('have-read', { room: this.cur_room, last: last_seen.id });
    }

    if(!(this.rooms[this.cur_room].hasOwnProperty('unread'))) {
      this.rooms[this.cur_room].unread = 0;
    }
    this.rooms[this.cur_room].unread = 0;
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
  constructor() {
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
    var update_messages = false;
    var update_files = false;
    var update_users = false;
    var update_rooms = false;
    var update_cards = false;

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
        files.add_file(stuff['files'][file])
      }
      update_messages = true;
      update_files    = true;
    }

    if ('rooms' in stuff) {
      for (var room in stuff['rooms']) {
        messages.add_room(stuff['rooms'][room]);
      }
      update_messages = true;
      update_rooms    = true;
    }

    var message_types = 0;
    if ('messages' in stuff) {
      for(var message in stuff['messages']) {
        message_types |= messages.add(stuff['messages'][message])
      }
      update_messages = true;
    }
    
    if ('cards' in stuff) {
      for(var card in stuff['cards']) {
        cards.add(stuff['cards'][card]);
      }
      update_cards = true;
    }

    if(update_messages) {
      if(update_messages & 1) {
        lissajous.inca();
      } else if (update_messages & 2) {
        lissajous.incb();
      }
      $('#favicon').attr('href','/static/favicon2.svg');
      messages.render();
    }

    if(update_files) {
      files.render();
    }

    if(update_users) {
      people.render();
    }

    if((update_rooms)||(update_messages)) {
      messages.render_room_list();
    }

    if(update_cards) {
      console.log("updating cards");
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
    this.agoal += 1;
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

    'locked':         `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                            fill="currentColor" class="bi bi-lock" viewBox="0 0 16 16">
                         <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 
                                  0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 
                                  0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 
                                  1 0 0 1 1-1z"/>
                       </svg>`,

    'unlocked':       `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                            fill="currentColor" class="bi bi-unlock" viewBox="0 0 16 16">
                         <path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 
                                  1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 
                                  2 0 0 0-2-2zM3 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 
                                  1-1V9a1 1 0 0 0-1-1H3z"/>
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

    'play':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                      fill="currentColor" class="bi bi-caret-right" viewBox="0 0 16 16">
                   <path d="M6 12.796V3.204L11.481 8 6 12.796zm.659.753 5.48-4.796a1 
                            1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 
                            3.204v9.592a1 1 0 0 0 1.659.753z"/>
                 </svg>`,
    'pause':   `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 
                           1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 
                           0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
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

    'unknown': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-file" viewBox="0 0 16 16">
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 
                           2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 
                           1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                </svg>`,

    'image':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-file-image" viewBox="0 0 16 16">
                    <path d="M8.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 
                             2-2V2a2 2 0 0 0-2-2zM3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 
                             1v8l-2.083-2.083a.5.5 0 0 0-.76.063L8 11 5.835 
                             9.7a.5.5 0 0 0-.611.076L3 12V2z"/>
                  </svg>`,

    'video':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 
                                     1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 
                                     1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 
                                     1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 
                                     4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 
                                     1 0 0 0-1-1H2z"/>
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
var getter    = new Getter();
var messages  = new Messages();
var cards     = new Cards();
var people    = new People();
var files     = new Files();
var invite    = new Invite();
var settings  = new Settings();
var jukebox   = new Jukebox();


var markdown = new showdown.Converter({'emoji':true, 'simplifiedAutoLink':true, 'openLinksInNewWindow':true});

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
    console.log("resize");
    $(window).trigger('resize');}, 1000);
});

$(window).keyup(function(event) {
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
    socket.emit('logout', {sessionid: sessionid});
    lissajous.setb(5);
}


// general function to handle uploading files to 
// the server.

function upload_file(file, url, success_fn) {
  var sessionid = cookie.read('sessionid');
  var form = new FormData();

  form.append('sessionid', sessionid);
  form.append('room', messages.cur_room);
  form.append('file', file);
  $.ajax({ url: url,
           type: 'POST',
           data: form,
           processData: false,
           contentType: false,
           success: success_fn });
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
    for(file in data.files) {
      file = data.files[file];
      messages.add_file(file.id);
    }
  });
}

function drop_handler(ev) {
 ev.preventDefault();
 ev.stopPropagation();
 ([...ev.dataTransfer.files]).forEach(handle_file_upload);
}

function dragstart_handler(ev) {
  // TODO: allow user to drag things out of the window...
  //alert('hi!');
  ev.dataTransfer.setData("text/plain", ev.target.id);
}


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
  if(data.status == 'ok') {
    files.delete_file(data.file_id);
    files.render();
    messages.render();
  }
});

socket.on('password-set', data => {
  cookie.write('sessionid', data.sessionid, 365);
});
  
socket.on('settings-result', data => {
  $('#settings-result').removeClass('d-none');
  $('#settings-result-status').html(data.status_msg);
});

socket.on('goto_chat', data => {
  messages.add_room(data.room); 
  messages.change_room(data.room.id);
  tabs.show('messages');
});

socket.on('stuff_list', data => {
  getter.handle_stuff(data);
});

