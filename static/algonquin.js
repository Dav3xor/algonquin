
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
    if(tab == 'messages') {
      $('#messages-deselected-nav').addClass('d-none');
      $('#messages-nav').removeClass('d-none');
      $('#messages-nav').addClass('active');
      $('#new-message').focus();
    }
    if(this.cur_tab == 'messages') {
      $('#messages-deselected-nav').removeClass('d-none');
      $('#messages-nav').addClass('d-none');
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

class People {
  constructor() {
  }

  get_info(people_list) {
    socket.emit('user-info', {'users':people_list});
  }

  render() {
    $('#people').empty();
    for (user in scoreboard) {
      user = scoreboard[user];
      $('#people').append(`<div class="row"> 
                             <div class="col-1">
                               <img src="/static/portraits/user-${user.id}.png" width="40" />
                             </div>
                             <div class="col-3">
                               <span class="badge badge-dark btn-sm">
                                 <h5>${user.handle}</h5>
                               </span>
                             </div>
                             <div class="col-3">
                               <span class="badge badge-dark btn-sm">
                                 <h5>${user.email}</h5>
                               </span>
                             </div> 
                             <div class="col-5">
                               <a tabindex="0" role="button" 
                                       class="btn btn-sm btn-danger ml-2 pb-0" 
                                       title="About ${user.handle}"
                                       data-placement="bottom"
                                       data-bs-toggle="popover"
                                       data-bs-trigger="hover"
                                       data-bs-animation="true"
                                       data-content="${user.about}">
                                 <h5>about...</h5>
                               </a>
                               <button class="btn btn-warning btn-sm ml-2" 
                                       type="button" id="new-file">
                                 ${messages.paperclip}
                               </button>
                               <button class="btn btn-success btn-sm ml-2" 
                                       onclick="send_message();" 
                                       id="send-message" type="button">
                                 ${messages.chat_bubble}
                               </button>
                             </div>

                           </div>`);
    }
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl, { trigger: 'focus' })
  })
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
    var filename = $('#settings-portrait').val();
    var sessionid = cookie.read('sessionid');
    //var user = scoreboard[userid];

    var form = new FormData(document.getElementById("portrait-form"));
    form.append('sessionid', sessionid);

    $.ajax({ url: 'upload-portrait',
             type: 'POST',
             data: form,
             processData: false,
             contentType: false,
             success: function(data) {
               console.log(data);
               data = JSON.parse(data);
               $('#portrait-image').attr('src', '/static/portraits/' + data.user.portrait);
               scoreboard[data.user.id] = data.user;
               messages.render();
             }
    });
  }



  set_defaults() {
    var user = scoreboard[userid];
    
    $('#portrait-image').attr('src', '/static/portraits/' + user.portrait);

    for (var setting in this.settings) {
      setting = this.settings[setting];
      if(setting in user) {
        $("#settings-"+setting).val(user[setting]);
      }
    }
  }

  allow_submission() {
    $('#change-settings').prop('disabled', false);
  }
}




class Messages {
  constructor() {
    this.rooms = {};
    this.expanded_input = false;
    this.arrow_up = ` 
      <svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
           fill="currentColor" class="bi bi-arrow-bar-up" viewBox="0 0 16 16">
        <path fill-rule="evenodd" 
              d="M8 10a.5.5 0 0 0 .5-.5V3.707l2.146 2.147a.5.5 0 0 0 
                 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 
                 .708.708L7.5 3.707V9.5a.5.5 0 0 0 .5.5zm-7 2.5a.5.5 0 0 1 
                 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z"/>
      </svg>`;

    this.arrow_down = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
           fill="currentColor" class="bi bi-arrow-bar-down" viewBox="0 0 16 16">
        <path fill-rule="evenodd" 
              d="M1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 
                 1-.5-.5zM8 6a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 
                 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 
                .708-.708L7.5 12.293V6.5A.5.5 0 0 1 8 6z"/>
       </svg>`;

    this.chat_bubble = `
      <svg width="1.92em" height="1.92em" viewBox="0 0 16 16" class="bi bi-chat-text" 
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
      </svg>`;

    this.paperclip = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
           fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 
                 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 
                 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
      </svg>`;



    var cur_room = cookie.read('cur_room');

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
    $('#send-message').append(this.chat_bubble);
    $('#new-file').append(this.paperclip);
  }

  input_small() {
      $('#new-message').prop('rows', 1);
      $('#message-expand-button').html(this.arrow_up);
      this.expanded_input = false;

  }

  input_large() {
      $('#new-message').prop('rows', 5);
      $('#message-expand-button').html(this.arrow_down);
      this.expanded_input = true;
  }

  resize_input() {
    if(this.expanded_input === false) {
      this.input_large();
    } else {
      this.input_small();
    }

  }

  change_room(room) {
    this.cur_room = room;
    cookie.write('cur_room', room, '365');
    this.render();
    this.render_room_list();
  }
  
  build_rooms(rooms) {
    for (let room of rooms) {
      this.rooms[room.id] = room;
      this.rooms[room.id].messages = [];
    }
  }

  render_room_list() {
    $('#room_list').empty();
    for (var room in this.rooms) {
      room = this.rooms[room];
      if ( room.id != this.cur_room ) {
        $('#room_list').append(`<a class="dropdown-item" href="#" 
                                                         onclick="messages.change_room('${room.id}');">
                                  ${room.name}
                                </a>`);
      } else {
        $('#messages_label').html(this.rooms[this.cur_room].name);
      }

    }
  }

  render() {
    var unknown_users = {};

    if(this['rooms'].hasOwnProperty(this.cur_room)) {
      for(let message of this['rooms'][this.cur_room]['messages']) {
        if (!scoreboard.hasOwnProperty(message.user)) {
          unknown_users[message.user] = 1;
        }
      }
      unknown_users = Object.keys(unknown_users);

      if(unknown_users.length > 0) {
        people.get_info(unknown_users);
      } else {
        for (let message of this['rooms'][this.cur_room]['messages']) {
          this.render_message(message);
        }
      }
    }
  }

  render_message(message) {
    user = scoreboard[message.user];
    $('#messages').prepend(`
      <div class="row"> 
        <div class="col">
          <img class="mb-1" src="/static/portraits/${user.portrait}" width=40 />
          <b>${user.handle}</b>
        </div> 
      <div class="col-10">${markdown.makeHtml(message.message)}</div> 
    </div>`);
  }
    
  add(message) {
    if (!this.rooms.hasOwnProperty(message.room)) {
      this.rooms[message.room] = { messages:[] };
    }
    this.rooms[message.room].messages.push(message);
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

var socket = io({rememberTransport: false});

var canvas = document.getElementById('lissajous');
var ctx = canvas.getContext('2d');
ctx.strokeStyle = 'rgb(50,200,100)';
ctx.lineWidth = 2;
var lissajous = new Lissajous(canvas, 30, 30);
var tabs      = new Tabs('messages');
var messages  = new Messages();
var people    = new People();
var invite    = new Invite();
var settings  = new Settings();

var scoreboard = {};

var userid = -1;

var markdown = new showdown.Converter({'emoji':true, 'simplifiedAutoLink':true, 'openLinksInNewWindow':true});


$('.dropdown-toggle').dropdown();

function resize_message_list(header, footer) {
  var new_height = window.innerHeight - header - footer - 5;
  $('.messages').css('height',new_height.toString()+'px');
}

$( window ).ready(function () { 
  resize_message_list(95,15);
});

$( window ).resize(function () { 
  var navbar_height = $('#navbar').css('height').slice(0,-2);
  var footer_height = $('#footer').css('height').slice(0,-2);
  resize_message_list(navbar_height, footer_height);
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

function send_login_email() {
  var email = qsv('#email');
  var password = qsv('#password');
  socket.emit('login-email', {email: email, password: password});
}

function send_message() {
  var message = $('#new-message').val();
  if (message.trim() != '') {
    socket.emit('message', {message:message, room:parseInt(messages.cur_room)});
    $('#new-message').val("");
  }
}

function send_logout() {
    $('#navbar').addClass('d-none');
    $('#footer').addClass('d-none');
    $('#login').modal('show');
    $('#messages').empty();
    var sessionid = cookie.read('sessionid');
    cookie.delete('sessionid');
    socket.emit('logout', {sessionid: sessionid});
    lissajous.setb(5);
}

socket.on('login-result', data => {
  console.log(data);
  if(data.authenticated) {
    userid = data.userid;
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
    }
    lissajous.setb(4);
    settings.set_defaults();
  } else {
    $('#login').modal('show');
    $('#login-result-status').html(data.result);
    $('#login-result-status').removeClass('d-none');
    cookie.delete('sessionid');
    lissajous.setb(1);
    lissajous.seta(1);
  }
});

socket.on('invite-result', data => {
  $('#invite-result').removeClass('d-none');
  $('#invite-result-status').html(data.status_msg);
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

socket.on('settings-result', data => {
  $('#settings-result').removeClass('d-none');
  $('#settings-result-status').html(data.status_msg);
});

socket.on('messages', data => {
  var should_scroll = false;
  for (let message of data['messages'].reverse()) {
    messages.add(message);
    if (message.room == messages.cur_room) {
      $('#messages').append(messages.render_message(message));
      should_scroll = true;
    }

  }
});

socket.on('memberships', data => {
  messages.build_rooms(data);
  messages.render_room_list();
});
  
socket.on('user_list', data => {
  for (user in data) {
    scoreboard[user] = data[user];
  }
  people.render();
  messages.render();
});

socket.on('user_info', data => {
  scoreboard[data.id] = data;
});

socket.on('user_change', data => {
  scoreboard[data.id] = data;
  messages.render();
});
  
