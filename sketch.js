let debug_logs = false

let autoplay = false
let speed = 20
let max_player = 2

p5.disableFriendlyErrors = true

let m = new Morpion(2)
let player = 1
let game_over = false

function setup() {
    createCanvas(500, 500)
    textAlign(CENTER, CENTER)
    textSize(200)

    if(!autoplay) {
        noLoop()
    }

    m.draw()

    // let start = millis()
    // while(!game_over) {
    //     m.playRandomValidAtomic(player)
    //     switchPlayers()
    // }
    // let time_elapsed = (millis() - start) / 1000 
    // console.log('match simulation: ' + time_elapsed.toFixed(3) + 's')
    // start = millis()
    // m.draw()
    // time_elapsed = (millis() - start) / 1000 
    // console.log('grid draw: ' + time_elapsed.toFixed(3) + 's')
}

function draw() {
    if(!autoplay || game_over) {
        return
    }

    if(!game_over) {
        for(let i = 0; i < speed; i++) {
            if(m.value !==0 || m.atomics.length === 0) {
                gameOver()
                break
            }

            m.playRandomValidAtomic(player)
            switchPlayers()
        }
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

    if(player > 1) {
        setTimeout(IA_Play, random(0.2,0.8) * 1000)
    }
}

function drawGame() {
    background(255)
    m.draw()
}

function IA_Play() {
    m.playRandomValidAtomic(player)
    drawGame()
    switchPlayers()
}

function mouseClicked() {
    if(autoplay || player === 2 || mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
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
    drawGame()
    switchPlayers()
}