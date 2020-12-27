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

    // console.log("Try brute force")
    for (let elm of valid_atomics) {
        const atomic = _.cloneDeep(elm)
        let game_save = _.cloneDeep(m)
        let ok = true
        let opp_pts

        game_save.playPath(atomic.getPathArray(), player)

        if (game_over) {
            game_over = false
            m.playPath(atomic.getPathArray(), player)
            return true
        }

        const stats = game_save.getStats()
        let pts
        if (stats[2] === undefined)
            pts = stats[1][player - 1] * 2
        else 
            pts = stats[1][player - 1] * 2 + stats[2][player - 1] * 4

        switchPlayers()
        const opp_valid_zone = game_save.getChild(game_save.nextZone)
        const opp_valid_atomics = opp_valid_zone.getValidAtomics()

        for (let opp_elm of opp_valid_atomics) {
            const opp_atomic = _.cloneDeep(opp_elm)
            let opp_game_save = _.cloneDeep(game_save)

            opp_game_save.playPath(opp_atomic.getPathArray(), player)

            if (game_over) {
                game_over = false
                ok = false // Forbidden move
                // console.log("Forbidden move")
                break
            }

            const opp_stats = opp_game_save.getStats()
            if (opp_stats[2] === undefined)
                opp_pts = opp_stats[1][player - 1] * 2
            else 
                opp_pts = opp_stats[1][player - 1] * 2 + opp_stats[2][player - 1] * 4

            if (opp_pts > pts) {
                ok = false
                break
            }
        }

        switchPlayers()
        if (ok === false) {
            continue
        }

        arr.push([atomic.getPathArray(), pts - opp_pts])
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