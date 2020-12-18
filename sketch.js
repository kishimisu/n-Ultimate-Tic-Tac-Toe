// Setting
let debug_logs = false

let play_on_click = true
let autoplay = true
let speed = 1
let free_camera = false
let player_count = 2

let show_numbers = false
let draw_shapes = true
let gray_checker = false

// Simulation (brute force)
let simulating = false
let winning_move = false

// Game variables
let atomics = []
let game = new Morpion(2)
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

    // let random_index = last_zone === null ? floor(random(atomics.length)) : getRandomPlayableIndex() 
    let random_index = bruteForce() 
    console.log(random_index)

    if(atomics[random_index].click()) {
        switchPlayers()
    } else {
        console.log("chelou")
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

function gameOver(winner) {
    if (simulating === false) {
        speed = 0
        free_camera = true
        last_zone = ''

        if (winner) document.location = document.location
    } else {
        winning_move = true
        console.log("FALSE WIN")
    }
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

function bruteForce() {
    simulating = true
    let clone_game = _.cloneDeep(game)
    let playables
    
    if (player === 1) {
        playables = (last_zone === null) ? null : clone_game.getPlayablesBruteForce(last_zone)
    } else {
        playables = (last_zone === null) ? null : clone_game.getPlayables(last_zone)
    }
    console.log(playables)
    // If the whole field is playable. Note that a change to playbles will affect atomics.
    if (playables === null) playables = clone_game.getAtomics()

    let time = 0

    let paths = calculateBruteForce(time, clone_game, playables)

    simulating = false

    if (paths.length === 0) { // No good moves, no bad moves
        console.log("RANDOM")
        return (last_zone === null) ? floor(random(atomics.length)) : getRandomPlayableIndex()
    } else {
        paths.sort( (a, b) => {
            return a.points > b.points
        })
        if (paths[0].points === -Infinity) {
            let path = paths[0].move.getPath()
            let n

            do {
                n = (last_zone === null) ? floor(random(atomics.length)) : getRandomPlayableIndex()
            } while (atomics[n].getPath() === path)

            console.log("AVOID")
            return n
        } else {
            let path = paths[0].move.getPath()
            let n = 0

            for (at of atomics) {
                if (at.getPath() === path) break
                n++
            }
            console.log("GOOD ONE")
            return n
        }
    }

    // console.log(playables)
    // console.log(paths)
}

function calculateBruteForce(time, clone_game, playables) {
    let arr = []
    console.log(playables)

    if (time <= 1) {
        console.log("###### START BRUTE FORCE ######")
        // Loop through avaible moves.
        for (let i = 0; i < playables.length; i++) {
            // Save values for player
            let tmp_game = _.cloneDeep(clone_game)
            // let game_grid_save = _.cloneDeep(clone_game.grid)
            let last_zone_save = _.clone(last_zone)

            let before_points = tmp_game.getPoints()
            let atomic = playables[i]
            let path = atomic.getPath()
            let child = tmp_game.getChild(path)
            child.click()

            if (winning_move) {
                winning_move = false
                arr.push({
                    move: atomic,
                    points: Infinity
                })
            } else {
                let points = tmp_game.getPoints()

                // Changing player to analyze opponent's response
                player = (player === 1) ? 2 : 1

                let possible_responses = (last_zone === null) ? null : tmp_game.getPlayablesBruteForce(last_zone)

                if (possible_responses === null) {
                    possible_responses = _.cloneDeep(playables)
                }
                let response_arr = []

                for (let j = 0; j < possible_responses.length; j++) {
                    // Save values for opponent
                    let response_game = _.cloneDeep(tmp_game)
                    let response_last_zone_save = _.clone(last_zone)

                    let response_before_points = response_game.getPoints()
                    let response_atomic = possible_responses[j]
                    let response_path = response_atomic.getPath()
                    let response_child = response_game.getChild(response_path)
                    response_child.click()
        
                    if (winning_move) {
                        winning_move = false
                        response_arr.push({
                            move: response_atomic,
                            points: Infinity
                        })
                    } else {
                        let response_points = response_game.getPoints()
                        if (response_points > response_before_points + 1) {
                            response_arr.push({
                                move: response_atomic,
                                points: response_points
                            })
                        }
                    }

                    // Reset modified values for opponent
                    last_zone = _.clone(response_last_zone_save)
                }

                // Changing player back to normal
                player = (player === 1) ? 2 : 1

                if (response_arr.length > 0) {
                    arr.push({
                        move: atomic,
                        points: -Infinity
                    })
                } else if (points > before_points + 1) {
                    arr.push({
                        move: atomic,
                        points: points
                    })
                }
            }

            // Reset modified values for player
            last_zone = _.clone(last_zone_save)
            // clone_game.grid = _.cloneDeep(game_grid_save)
            // break
        }
        console.log("###### END BRUTE FORCE ######")
        return arr
    }

}