let debug_logs = false
let debug_attribute = 'none' // 'none' : 'value' : 'index'

let autoplay = true
let simulate = false
let speed = 1
let max_player = 2

p5.disableFriendlyErrors = true

let m = new Morpion(3)
let player = 1
let game_over = false

function setup() {
    createCanvas(600, 600)
    textAlign(CENTER, CENTER)
    textSize(200)

    m.draw()

    if(simulate) {
        simulation()
    }

    frameRate(5)
}

function simulation() {
    do {
        let start = millis()

        while(!game_over) {
            AI()
        }
        
        let time_elapsed = (millis() - start) / 1000 
        // console.log('match simulation: ' + time_elapsed.toFixed(3) + 's')

        start = millis()
        m.draw()

        time_elapsed = (millis() - start) / 1000 
        // console.log('grid draw: ' + time_elapsed.toFixed(3) + 's')

        noLoop()
        m.initialize()
        player = 1
        game_over = false
    } while (true)
}

function draw() {
    if(!autoplay || game_over || simulate) {
        if(!autoplay && !game_over) {
            drawGame()
        }
        return
    }

    for(let i = 0; i < speed; i++) {
        if(m.value !==0 || m.atomics.length === 0) {
            gameOver()
            break
        }

        AI()
    }

    drawGame()
}

function gameOver() {
    game_over = true
    console.log('Game over: ' + ( m.value === 0 ? 'draw' : ('player ' + m.value + ' win') ))
}

function switchPlayers() {
    player++

    if(player > max_player) {
        player = 1
    }
}

function drawGame() {
    background(255)
    m.draw()
}

function ffGame(count) {
    for(let i = 0; i < count; i++) {
        if(m.value !==0 || m.atomics.length === 0) {
            gameOver()
            break
        }

        AI()
    }
}

function AI() {
    if(autoplay) {
        if(player === 2) {
            AI_Play('bruteforce2')
        } else {
            AI_Play('bruteforce')
        }
    } else {
        setTimeout(AI_Play,1000)
    }
}

function AI_Play(mode) {
    if(mode === 'bruteforce') {
        if(!bruteForce()) {
            m.playRandomValidAtomic(player)
        }
    } else if (mode === 'bruteforce2') {
        if(!bruteForce_()) {
            m.playRandomValidAtomic(player)
        }
    } else {
        m.playRandomValidAtomic(player)
    }

    switchPlayers()
}

function mouseClicked() {
    if(autoplay || game_over || player === 2 || mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return
    }

    let x2 = floor(map(mouseX, 0, width, 0, 27))%3
    let y2 = floor(map(mouseY, 0, height, 0, 27))%3
    let x1 = floor(map(mouseX, 0, width, 0, 9))%3
    let y1 = floor(map(mouseY, 0, height, 0, 9))%3
    let x0 = floor(map(mouseX, 0, width, 0, 3))
    let y0 = floor(map(mouseY, 0, height, 0, 3))

    const path = [x0+y0*3,x1+y1*3,x2+y2*3]

    m.playPath(path, player)

    if(game_over) {
        return
    }
    switchPlayers()
    AI()
}

function bruteForce() {
    const valid_zone = m.getChild(m.nextZone)
    const valid_atomics = valid_zone.getValidAtomics()

    for(let elm of valid_atomics) {
        const atomic = _.cloneDeep(elm)

        if(atomic.play(player)) {
            m.playPath(atomic.getPathArray(), player)
            // console.log('forced win on ' + atomic.getPath())
            return true
        }
    }

    return false
}

function bruteForce_() {

    // 1 - Get all possible moves for player
    // 2 - Try opponent's responses for each move
    // 3 - Maximize the outcome ?

    const valid_zone = m.getChild(m.nextZone)
    const valid_atomics = valid_zone.getValidAtomics()
    let arr = []

    // Calculate player's points before the simulation of his turn.
    const pts_before = calculatePointsBruteForce(m.getStats())

    // console.log("Try brute force")

    // Loop through the possible moves of the player.
    for (let elm of valid_atomics) {
        // Cloning the selected atomic and the game board to not affect the real board.
        const atomic = _.cloneDeep(elm)
        let game_save = _.cloneDeep(m)
        let ok = true // Is the move no too bad (opponent doesn't win ?)

        game_save.playPath(atomic.getPathArray(), player)
        
        // This move makes the player win.
        if (game_over) {
            game_over = false // Cancel global end of game variable.
            m.playPath(atomic.getPathArray(), player) // Play the move on the real board.
            return true // Indicates that a move has been made.
        }

        // Calculate player's points after the move has been made.
        const pts = calculatePointsBruteForce(game_save.getStats())

        // Switch players before considering the opponent's possible responses.
        switchPlayers()
        const opp_valid_zone = game_save.getChild(game_save.nextZone)
        const opp_valid_atomics = opp_valid_zone.getValidAtomics()

        // Calculate opponent's points before the simulation of his turn.
        const opp_pts_before = calculatePointsBruteForce(game_save.getStats())

        // Loop through possible responses of the opponent.
        for (let opp_elm of opp_valid_atomics) {
            // Saving stuff before simulating the move of the opponent.
            const opp_atomic = _.cloneDeep(opp_elm)
            let opp_game_save = _.cloneDeep(game_save)

            // Playing the move on the simulated board.
            opp_game_save.playPath(opp_atomic.getPathArray(), player)

            // If the opponent plays a winning move.
            if (game_over) {
                game_over = false // Cancel global end of game variable.
                ok = false // Forbidden move.
                // console.log("Forbidden move")
                break // No need to consider other responses to player's move ==> forbidden move.
            }

            opp_pts = calculatePointsBruteForce(opp_game_save.getStats())

            // If opponent's points are greated than the player's, don't play the move ?
            if (opp_pts > pts) {
                ok = false
                break
            }
        }

        // Switch players back to original player.
        switchPlayers()

        if (ok === false) { // If move is forbidden.
            continue // Go to check on another move.
        }

        // Keep this move with the delta player's points and opponent's points.
        arr.push([atomic.getPathArray(), pts - pts_before, opp_pts - opp_pts_before])
    }

    if (arr.length === 0) {
        return false
    }

    // Pourquoi ca marche pas le tri ????
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i][1] < arr[i + 1][1]) {
            const tmp = arr[i]
            arr[i] = arr[i + 1]
            arr[i + 1] = tmp
            i--
        }
    }
    // console.log(arr)
    m.playPath(arr[0][0], player)
    return true
}

// Calculaing the points of a given position based on game's stats.
// This function is way too rudimentary.
function calculatePointsBruteForce(stats) {
    return stats[1][player - 1] * 2 + (stats[2] === undefined ? 0 : stats[2][player - 1])
}