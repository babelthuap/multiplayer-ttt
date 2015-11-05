'use strict';

$(document).ready(function() {

  // init
  let tttRef = new Firebase('https://nicholastictactoe.firebaseio.com/');
  let playersRef = tttRef.child('players');
  let whoseTurnRef = tttRef.child('whoseTurn');
  let boardStateRef = tttRef.child('boardState');
  let name, numPlayers, playerX, playerO, playerSelf, selfXorO, whoseTurn, boardState, timeout;
  let myCells = [];
  let winningStates = [ [0,1,2], [3,4,5], [6,7,8],
                        [0,3,6], [1,4,7], [2,5,8],
                        [0,4,8], [2,4,6] ];
  $('#name').focus();

  // Firebase listeners
  playersRef.on('value', (snap) => {
    numPlayers = snap.numChildren();

    console.log('players:', snap.val());

    let players = snap.val()
    if (players) {
      let keys = Object.keys(players);
      playerX = players[keys[0]];
      playerO = players[keys[1]];
      if (numPlayers === 1 && playerSelf) {
        selfXorO = 'X';
      }
    } else {
      playerX = '';
      playerO = '';
      $('#pX').closest('center').removeClass('your-turn');
      $('#pO').closest('center').removeClass('your-turn');
    }
    updatePlayers();
  });

  whoseTurnRef.on('value', (snap) => {
    whoseTurn = snap.val();
    if (playerX && playerO) {
      $('#p' + whoseTurn).closest('center').addClass('your-turn');
      $('#p' + (whoseTurn === 'X' ? 'O' : 'X')).closest('center').removeClass('your-turn');
    }
  });

  boardStateRef.on('value', (snap) => {
    boardState = snap.val();
    if (boardState && boardState.slice(0,3) === 'win') {
      alert((boardState.slice(-1) === 'X' ? playerX : playerO) + ' wins!');
      quit();
    } else {
      drawBoard();
    } 
  })

  // misc. event listeners
  $('#join').click(joinGame);
  $('#name').on('keypress', (e) => {
    if (e.charCode === 13 && !$('#join').prop('disabled')) joinGame();
  });
  $('#quit').click(quit);
  $('.cell').click(takeTurn);


  function joinGame() {
    name = $('#name').val();
    if (name) {
      if (numPlayers < 2) {
        let newPlayerRef = playersRef.push(name);
        playerSelf = newPlayerRef.path.o[1];
        playersRef.child(playerSelf).onDisconnect().remove();
        if (numPlayers === 1) {
          selfXorO = 'X';
        } else {
          selfXorO = 'O';
        }
        $('#name, #join').prop('disabled', true);
        $('#quit').prop('disabled', false);
      } else {
        alert('too many players');
        console.log('failed');
      }
    }
  }

  function updatePlayers() {
    $('#pX').text(playerX || '');
    $('#pO').text(playerO || '');
    if (numPlayers >= 2) {
      $('#name, #join').prop('disabled', true);
    }
    if (playerX && playerO) {
      startGame();
    } else {
      $('#board').hide();
    }
  }

  function startGame() {
    myCells = [];
    $('#board').show();
    boardState = ['','','', '','','', '','',''];
    boardStateRef.set(boardState);
    whoseTurnRef.set('X');
    $('#pX').closest('center').addClass('your-turn');
    // auto quit after 30 seconds
    timeout = setTimeout(() => {
      console.log('quitting');
      quit();
    }, 30000);
  }

  function quit() {
    clearTimeout(timeout);
    playersRef.child(playerSelf).remove();
    $('#name, #join').prop('disabled', false);
    $('#quit').prop('disabled', true);
    selfXorO = undefined;
    playerSelf = undefined;
    boardStateRef.set(null);
    $('#pX').closest('center').removeClass('your-turn');
    $('#pO').closest('center').removeClass('your-turn');
  }

  function takeTurn() {
    if (playerSelf) {

      console.log('Player ' + selfXorO + ' trying to make move: ' + whoseTurn);
      if (selfXorO === whoseTurn) {
        if (!$(this).text()) {
          let cellNum = +$(this).attr('id');
          myCells.push( cellNum );
          boardState[cellNum] = whoseTurn;
          $(this).text(whoseTurn);
          boardStateRef.set( boardState );
          if (didIwin()) {
            boardStateRef.set( 'win' + whoseTurn );
          }
          whoseTurnRef.set( whoseTurn === 'X' ? 'O' : 'X' );
        }
      }

    }
  }

  function drawBoard() {
    if (boardState) {
      boardState.forEach((mark, i) => {
        $('#' + i).text(mark);
      })

    }
    console.log('change board state:', boardState);
  }

  Array.prototype.containedIn = function(otherArray) {
      // every element of A is an element of B
      return this.every(function(element) {
        return otherArray.indexOf(element) !== -1;
      });
  }

  function didIwin() {
    return winningStates.some((winstate) => {
      return winstate.containedIn(myCells);
    });
  }

});















