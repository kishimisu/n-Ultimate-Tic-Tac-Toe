let debug_logs = false
let debug_attribute = 'none' // 'none' : 'value' : 'index'

let speed = .1
let max_player = 2
let players = ['human', 'montecarlo']
let player = 0

p5.disableFriendlyErrors = true

let m = new Morpion(2)

function setup() {
    createCanvas(600, 600)
    textAlign(CENTER, CENTER)
    textSize(200)

    m.draw()
    noLoop()

    play()
}

function play() {
    let current = players[player]

    if (current === 'human') {
        return
    } else if (current === 'montecarlo') {
        monteCarloPlay()
    } else if(current === 'random') {
        m.playRandomValidAtomic()
    } else {
        throw new Error('Unrecognized player type: ' + current)
    }

    nextPlayer()
}

function nextPlayer() {
    player++
    if(player > max_player-1) {
        player = 0
    }

    background(255)
    m.draw()
    redraw()

    if(!m.gameOver) {
        setTimeout(play, players[player] === 'random' ? (speed < 1 ? speed * 10e3 : 0 ) : 0)
    }
}

function mouseClicked() {
    if(players[player] !== 'human' || m.gameOver || mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return
    }

    let x2 = floor(map(mouseX, 0, width, 0, 27))%3
    let y2 = floor(map(mouseY, 0, height, 0, 27))%3
    let x1 = floor(map(mouseX, 0, width, 0, 9))%3
    let y1 = floor(map(mouseY, 0, height, 0, 9))%3
    let x0 = floor(map(mouseX, 0, width, 0, 3))
    let y0 = floor(map(mouseY, 0, height, 0, 3))

    const path = [x0+y0*3,x1+y1*3,x2+y2*3]
    m.playPath(path)

    nextPlayer()
}

let thinking_time = 15

function monteCarloPlay() {
    var t = new Tree(m)
    let start = millis()

    do {
        t.root.chooseChild()
    }while(millis() - start < thinking_time * 1000)

    let best = t.root.children.reduce(function(prev, curr) {
        return prev.trials < curr.trials ? curr : prev
    })

    console.log('calculated ' + t.root.trials + ' games, next move has ' + best.losses + '/' + best.trials + ' win outcomes ' + 
                '(' + nf(100-(best.trials - best.losses)/best.trials*100,0,2) + '%)')
    m.playPath(best.move)
}

// function bruteForce() {
//     const valid_zone = m.getChild(m.nextZone)
//     const valid_atomics = valid_zone.getValidAtomics()

//     for(let elm of valid_atomics) {
//         const atomic = _.cloneDeep(elm)

//         if(atomic.play(player)) {
//             m.playPath(atomic.getPathArray(), player)
//             // console.log('forced win on ' + atomic.getPath())
//             return true
//         }
//     }

//     return false
// }

// function bruteForce_() {

//     // 1 - Get all possible moves for player
//     // 2 - Try opponent's responses for each move
//     // 3 - Maximize the outcome ?

//     const valid_zone = m.getChild(m.nextZone)
//     const valid_atomics = valid_zone.getValidAtomics()
//     let arr = []

//     // Calculate player's points before the simulation of his turn.
//     const pts_before = calculatePointsBruteForce(m.getStats())

//     // console.log("Try brute force")

//     // Loop through the possible moves of the player.
//     for (let elm of valid_atomics) {
//         // Cloning the selected atomic and the game board to not affect the real board.
//         const atomic = _.cloneDeep(elm)
//         let game_save = _.cloneDeep(m)
//         let ok = true // Is the move no too bad (opponent doesn't win ?)

//         game_save.playPath(atomic.getPathArray(), player)
        
//         // This move makes the player win.
//         if (game_over) {
//             game_over = false // Cancel global end of game variable.
//             m.playPath(atomic.getPathArray(), player) // Play the move on the real board.
//             return true // Indicates that a move has been made.
//         }

//         // Calculate player's points after the move has been made.
//         const pts = calculatePointsBruteForce(game_save.getStats())

//         // Switch players before considering the opponent's possible responses.
//         switchPlayers()
//         const opp_valid_zone = game_save.getChild(game_save.nextZone)
//         const opp_valid_atomics = opp_valid_zone.getValidAtomics()

//         // Calculate opponent's points before the simulation of his turn.
//         const opp_pts_before = calculatePointsBruteForce(game_save.getStats())

//         // Loop through possible responses of the opponent.
//         for (let opp_elm of opp_valid_atomics) {
//             // Saving stuff before simulating the move of the opponent.
//             const opp_atomic = _.cloneDeep(opp_elm)
//             let opp_game_save = _.cloneDeep(game_save)

//             // Playing the move on the simulated board.
//             opp_game_save.playPath(opp_atomic.getPathArray(), player)

//             // If the opponent plays a winning move.
//             if (game_over) {
//                 game_over = false // Cancel global end of game variable.
//                 ok = false // Forbidden move.
//                 // console.log("Forbidden move")
//                 break // No need to consider other responses to player's move ==> forbidden move.
//             }

//             opp_pts = calculatePointsBruteForce(opp_game_save.getStats())

//             // If opponent's points are greated than the player's, don't play the move ?
//             if (opp_pts > pts) {
//                 ok = false
//                 break
//             }
//         }

//         // Switch players back to original player.
//         switchPlayers()

//         if (ok === false) { // If move is forbidden.
//             continue // Go to check on another move.
//         }

//         // Keep this move with the delta player's points and opponent's points.
//         arr.push([atomic.getPathArray(), pts - pts_before, opp_pts - opp_pts_before])
//     }

//     if (arr.length === 0) {
//         return false
//     }

//     // Pourquoi ca marche pas le tri ????
//     for (let i = 0; i < arr.length - 1; i++) {
//         if (arr[i][1] < arr[i + 1][1]) {
//             const tmp = arr[i]
//             arr[i] = arr[i + 1]
//             arr[i + 1] = tmp
//             i--
//         }
//     }
//     // console.log(arr)
//     m.playPath(arr[0][0], player)
//     return true
// }

// // Calculaing the points of a given position based on game's stats.
// // This function is way too rudimentary.
// function calculatePointsBruteForce(stats) {
//     return stats[1][player - 1] * 2 + (stats[2] === undefined ? 0 : stats[2][player - 1])
// }