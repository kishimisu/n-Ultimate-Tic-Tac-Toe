// Setting
let debug_logs = false

let play_on_click = false
let autoplay = true
let speed = 1
let free_camera = false
let player_count = 2

let show_numbers = false
let draw_shapes = false
let gray_checker = false

// Game variables
let atomics = []
let game = new Morpion(3)
let player = 1
let last_zone = null

// Camera
let cam_scale = 1
let cam_offset = {x: 0, y: 0}

p5.disableFriendlyErrors = true

function setup() {
    createCanvas(600, 600)
    angleMode(DEGREES)
    textAlign(CENTER, CENTER)
    textSize(200)

    if(!autoplay) {
        noLoop()
        game.draw()
    }

    print(game)

    if(play_on_click) {
        noLoop()
    }
}

function draw() {
    if(!autoplay) {
        return
    }

    for(let i = 0; i < speed; i++) {
        randomMove()
    }

    background(255)
    noFill()
    strokeWeight(4)
    rect(0,0,width-1,height-1)

    push()
    translate(cam_offset.x, cam_offset.y)
    scale(cam_scale)
    game.draw()
    pop()

    if(mouseIsPressed && free_camera) {
        updateCamera()
    }
}

function updateCamera() {
    if(mouseButton === LEFT) {
        cam_scale *= 1.01
    } else {
        cam_scale *= 0.99
    }

    const move_x = width/2 - mouseX
    const move_y = height/2 - mouseY
    cam_offset.x += move_x * 0.1
    cam_offset.y += move_y * 0.1

    cam_offset.x = min(cam_offset.x, 0)
    cam_offset.y = min(cam_offset.y, 0)
}

function randomMove() {    
    if(atomics.length === 0) {
        gameOver()
        return
    }

    let random_index = last_zone === null ? floor(random(atomics.length)) : getRandomPlayableIndex() 

    if(atomics[random_index].click()) {
        switchPlayers()
    } else {
        atomics.splice(random_index, 1)
    }
}

function mouseClicked() {
    if(autoplay) {
        redraw()
        return
    }

    if(game.isClicked(0, 0, width)) {
        background(255)
        game.draw()
        switchPlayers()
    }
}

function switchPlayers() {
    player++

    if(player > player_count) {
        player = 1
    }
}

function gameOver() {
    speed = 0
    free_camera = true
    last_zone = ''
}

function debug(str) {
    if(debug_logs) {
        print(str)
    }
}

function getRandomPlayableIndex() {
    const playables = game.getPlayables(last_zone)

    if(playables === null) {
        last_zone = null
        return floor(random(atomics.length))
    }

    return playables[floor(random(playables.length))]
}