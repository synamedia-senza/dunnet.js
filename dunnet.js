let commandMode = false;
let commands = ["look", "get", "put", "drop", "send", "turn", "rlogin", "type", "anonymous", "binary", "cut cable", "d", "dig", "dir", "exit", "flush", "ftp gamma", "in", "ls", "out", "press switch", "quit", "reset", "robert", "sleep", "toukmond", "u", "uncompress paper.o.Z", "w", "worms", "xxx"];
let subcommands = {
  "look": ["bear", "bins", "bone", "box", "bus", "cpu", "paper", "pc", "shovel", "statuette", "towel", "urinal"],
  "get": ["amethyst", "axe", "bill", "bone", "bracelet", "coins", "cpu", "diamond", "egg", "floppy", "food", "glycerine", "gold", "jar", "key", "lamp", "license", "life", "mona", "nitric", "paper", "platinum", "ruby", "shovel", "silver", "statuette", "towel", "weight"],
  "put": ["amethyst in disposal", "bracelet in chute", "coins in mail", "cpu in computer", "diamond in chute", "egg in mail", "floppy in pc", "glycerine in jar", "gold in urinal", "key in box", "nitric in jar", "platinum in urinal", "ruby in disposal", "silver in mail"],
  "drop": ["amethyst", "bill", "bone", "bracelet", "coins", "diamond", "egg", "floppy", "food", "gold", "jar", "key", "license", "mona", "paper", "platinum", "ruby", "shovel", "silver", "weight"],
  "send": ["bracelet.o", "key.o", "lamp.o", "paper.o", "shovel.o"],
  "turn": ["dial clockwise", "dial counterclockwise"],
  "rlogin": ["endgame", "gamma"],
  "type": ["foo.txt"]
};

function nextCommand(current, step) {
  if (!current) return commands[0];

  let command = first(current);
  let completions = subcommands[command];
  if (current.includes(" ") && completions) {
    let subcommand = rest(current);
    let index = completions.indexOf(subcommand);
    if (index != -1) {
      let newSubcommand = completions[(index + step + completions.length) % completions.length];
      return `${command} ${newSubcommand}`;
    }
  } else {
    let index = commands.indexOf(current);
    if (index != -1) {
      return commands[(index + step + commands.length) % commands.length]
    }
  }
  return current;
}

function selectSubcommand(current) {
  if (!current) return '';
  let command = first(current);
  let subs = subcommands[current];
  if (subs) {
    return `${command} ${subs[0]}`;
  } else {
    return command;
  }    
}

function clearSubcommand(current) {
  if (!current) return '';
  return first(current);
}

function first(string) {
  return string.replace(/ .*/,'');
}

function rest(string) {
  return string.substring(string.indexOf(' ') + 1);
}

document.addEventListener('DOMContentLoaded', function(){
  var main_content = document.getElementById('main-content');
  var terminal = document.getElementById('terminal');
  var input = document.getElementById('input');

  var input_callback = null;
  input.addEventListener('keyup', function(e) {
    if (e.key == "ArrowUp") {
      input.value = commandMode ? nextCommand(input.value, -1) : input.value + "n";
      e.preventDefault();
    } else if (e.key == "ArrowDown") {
      input.value = commandMode ? nextCommand(input.value, 1) : input.value + "s";
      e.preventDefault();
    } else if (e.key == "ArrowRight") {
      input.value = commandMode ? selectSubcommand(input.value) : input.value + "e";
      e.preventDefault();
    } else if (e.key == "ArrowLeft") {
      input.value = commandMode ? clearSubcommand(input.value) : input.value + "w";
      e.preventDefault();
    } else if (e.key == "Escape") {
      commandMode = !commandMode;
      input.value = commandMode ? nextCommand() : "";
      e.preventDefault();
    }
    
    if(e.keyCode != 13) return;
    if(!input_callback) return;
    e.preventDefault();
    var s = input.value;
    input.value = '';
    var cb = input_callback;
    input_callback = null;
    cb(s);
  });

  var game_ended = false;
  function refocus() {
    if(game_ended) return;
    input.focus();
    input.select();
  }
  input.value = '';
  refocus();
  input.addEventListener('blur', function(e) {
    refocus();
    setTimeout(refocus, 1);
  });
  document.addEventListener('mousemove', refocus);

  function send_to_terminal(str) {
    var lines = str.split('\n');
    var first = true;
    lines.forEach(function(line) {
      if(first) first = false;
      else terminal.insertBefore(document.createElement('br'), input);
      terminal.insertBefore(document.createTextNode(line), input);
    });
    main_content.scrollTop = main_content.scrollHeight;
  }

  function game_over() {
    game_ended = true;
    main_content.classList.add('game-over');
    setTimeout(function() {
      document.getElementById('game-over').focus();
    }, 1);
  }

  function readline(callback) {
    input_callback = callback;
  }

  function get_auto_solver(walkthrough, questions){
    walkthrough = atob(walkthrough).split(',');
    var answers = {};
    atob(questions).split('\n').forEach(function(s) {
      var l = s.split('" "');
      if(l.length == 2) answers[l[0].substring(1).replace('\\n', '\n')] = l[1].substring(0, l[1].length-1);
    });

    var cmd_idx = 0;

    var parse_combination = false;
    var combination = '000';

    var find_egg = false;
    var find_egg_path = 'wwwwwnneeeessswwwnneesee';
    var find_egg_path_idx = 0;
    var egg_found = false;

    var answer = null;

    return  {
      exit: game_over,
      print: function(str) {
        if(parse_combination) {
          if(/^\d\d\d$/.test(str)) {
            parse_combination = false;
            combination = str;
          }
        } else if (find_egg) {
          if (str === 'There is a jewel-encrusted egg here.') egg_found = true;
        } else if (str in answers) {
          answer = answers[str];
        }
        send_to_terminal(str);
      },
      readline: function(callback) {
        if(cmd_idx >= walkthrough.length) throw "Auto solver failed!";
        input.value = '';

        var cur_cmd = walkthrough[cmd_idx].replace(/^\s+|\s+$/g, '');
        if(find_egg) {
          if(find_egg_path_idx >= find_egg_path.length) find_egg = false;
          else if (egg_found) cur_cmd = 'get egg';
          else cur_cmd = find_egg_path[find_egg_path_idx];
        } else if(cur_cmd === 'enter combination') {
          cur_cmd = combination; 
        } else if (cur_cmd === 'find egg') {
          find_egg = true;
          ++cmd_idx;
          find_egg_path_idx = 0;
          cur_cmd = find_egg_path[find_egg_path_idx];
        } else if (answer) {
          cur_cmd = 'answer ' + answer;
        } else if (cur_cmd === 'type foo.txt') {
          parse_combination = true;
        }
        
        (function type(idx){
          if(idx >= cur_cmd.length) {
            if(egg_found) egg_found = false;
            else if(answer) answer = null;
            else if(find_egg) ++find_egg_path_idx;
            else ++cmd_idx;
            setTimeout(function() {
              input.value = '';
              callback(cur_cmd); 
            }, 100);
          } else {
            input.value += cur_cmd[idx];
            setTimeout(function() {
              type(idx + 1);
            }, 50);
          }
        })(0);
      }
    };
  }

  function fetch(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.overrideMimeType("text/plain");
    xhr.onload = function() { callback(this.responseText); };
    xhr.send();
  }

  fetch('dunnet.el', function(text) {
    if(location.hash === '#scan_missing') {
      MELI.scan_missing(this.responseText, function(id) {
        return (id.indexOf('dun-') === 0 || id.indexOf('obj-') === 0);
      });
    } else if (location.hash === '#auto_solve') {
      fetch('d2Fsa3Rocm91Z2g=', function(text1) { 
        fetch('cXVlc3Rpb25z', function(text2) {
          MELI.eval(text, get_auto_solver(text1, text2));
        });
      });
    } else {
      MELI.eval(text, {
        exit: game_over,
        print: send_to_terminal,
        readline: readline
      });
    }
  });
});
