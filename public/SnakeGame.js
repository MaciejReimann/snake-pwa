
// GAME LOGIC SINGLETON PRESERVING GAME STATE
const snakeGame = ( () => {
  'use strict'
  let gameInstance;

  // snake navigation constants definition
  const UP = { x: 0, y:-1 };
  const RIGHT = { x: 1, y: 0 };
  const DOWN = { x: 0, y: 1 };
  const LEFT = { x:-1, y: 0 };
  const DIRECTIONS = { UP, RIGHT, DOWN, LEFT };

  const initialState = {
    score: 0,
    width: 0,
    height: 0,
    pixel: 0,
    lastTime: Date.now(),
    tempo: 100,
    directions: [ RIGHT ],
    body: Array(4).fill()
      .map((_, i) => { return { x: 1 + i, y: 1 } }
    ),
    worm: { x: 7, y: 1 },
    isGameOver: false,
    isStarted: false,
    isPaused: false,
  }

  // gameboard setup
  const pixel = width => width > 1024 ? 20 : 40;
  const resizeGameboard = state => width => height => Object.assign(
    {}, state, {
      width: Math.floor(width / pixel(width)) * pixel(width),
      height: Math.floor(height/ pixel(width)) * pixel(width),
      module: mod
    })

  // point operations
  const pointsAreEqual = p1 => p2 => p1.x === p2.x && p1.y === p2.y;
  const getRightBorder = state => state.width / state.module;
  const getDownBorder = state => state.height / state.module;
  const getRandomPoint = state => {
    return {
      x: Math.floor( (Math.random() * getRightBorder(state) )) - 1,
      y: Math.floor( (Math.random() * getDownBorder(state) )) - 1
    }
  }
  const mod = x => y => ((y % x) + x) % x // http://bit.ly/2oF4mQ7

  // array operations
  const getLastItem = array => array.length > 0
    ? array[array.length - 1]
    : null
  const dropFirst = array => array.slice(1, array.length);
  const dropFirstIfLongerThanOne = array => array.length > 1
   ? dropFirst(array) : array

   // game conditionals
  const turnIsValid = direction => state =>
    direction.x + getLastItem(state.directions).x !== 0 ||
    direction.y + getLastItem(state.directions).y !== 0
  const willEatWorm = state => pointsAreEqual( nextHead(state) )(state.worm);
  const willCrash = state => state.body.find( pointsAreEqual( nextHead(state) ) )
  // calls ointsAreEqual( nextHead(state) ) (ELEMENT of the state.body array, which are points) for each ELEMENT
  // if finds any, breaks and returns the value

  // game actions
  const enqueueTurn = direction => state => turnIsValid(direction)(state)
    ? Object.assign(
        {}, state, {
          directions: state.directions.concat(direction)
        }
      )
    : state

  const nextWorm = state => ! willEatWorm(state)
    ? state.worm
    : getRandomPoint(state)

  const nextHead = state => {
    return {
      x: mod(getRightBorder(state))(state.body[0].x + state.directions[0].x),
      y: mod(getDownBorder(state))(state.body[0].y + state.directions[0].y)
    }
  }

  const moveSnake = state => !willCrash(state)
    ? Object.assign(
        {}, state, {
          body: ! willEatWorm(state) ? (
            [nextHead(state)]
            .concat(state.body)
            .slice(0, state.body.length)
          ) : (
            [nextHead(state)]
            .concat(state.body)
          ),
          directions: dropFirstIfLongerThanOne(state.directions),
          worm: nextWorm(state)
        }
      )
    : Object.assign(
      {}, state, {
        isGameOver: true
      }
    )

  const nextScore = state => willEatWorm(state)
    ? state.score + 1
    : state.score

  const makeTimestamp = state => id => Object.assign(
    {}, state, {
      lastTime: Date.now(),
      score: nextScore(state),
      id: id
    }
  )

  const startGame = state => Object.assign(
    {}, state, {
      isStarted: true
    }
  )

  const pauseGame = state => Object.assign(
    {}, state, {
      isPaused: !state.isPaused
    }
  )

  const moveAndTimestamp = state => id => makeTimestamp(moveSnake(state))(id)

  const snakeReducer = (state = initialState, action) => {
    switch(action.type) {
      case 'START_GAME':
        console.log("starting")
        return startGame (resizeGameboard(state)(action.width)(action.height) )
      case 'PAUSE_GAME':
        console.log("game paused")
        return pauseGame(state)
      case 'MOVE_SNAKE':
        return moveAndTimestamp(state)(action.id);
      case 'ENQUEUE_TURN':
        return enqueueTurn(DIRECTIONS[action.direction])(state);
      case 'RESIZE_SCREEN':
        return resizeGameboard(state)(action.width)(action.height)
      default:
        return state;
    }
  }

  return {
    getInstance: () => {
      if(!gameInstance) {
        gameInstance = createStore(snakeReducer);
      }
      return gameInstance;
    }
  }

})()
