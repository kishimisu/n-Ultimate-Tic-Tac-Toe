let debug_logs = false
let debug_attribute = 'none' // 'none' : 'value' : 'index'

let autoplay = true
let simulate = false
let speed = 10
let max_player = 2

p5.disableFriendlyErrors = true

let m = new Morpion(3)
let player = 1
let game_over = false

function setup() {
    createCanvas(500, 500)
    textAlign(CENTER, CENTER)
    textSize(200)

    m.draw()

    if(simulate) {
        simulation()
    }
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
        if(player === 1) {
            AI_Play('bruteforce')
        } else {
            AI_Play('random')
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