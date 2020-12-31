let debug_logs = false
let debug_attribute = 'none' // 'none' : 'value' : 'index'
let debug_montecarlo = false

let speed = 1
let max_player = 2
let players = ['bruteforce', 'montecarlo']
let player = 0
let game_size = 600

let show_graph = false
let NODE_SIZE = 100
let GRAPH_WIDTH = 3000

let thinking_time = 10

p5.disableFriendlyErrors = true

let m = new Morpion(2)

function setup() {
    createCanvas(3000, 2000)
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
    } else if (current === 'random') {
        m.playRandomValidAtomic()
    } else if (current === 'bruteforce') {
        if (!bruteForce()) {
            m.playRandomValidAtomic()
        }
    } else if ('montecarlodumb') {
        thinking_time /= 2
        monteCarloPlay()
        thinking_time *= 2
    } else {
        throw new Error('Unrecognized player type: ' + current)
    }

    nextPlayer()
}


var nb_wins = 0
var nb_losses = 0
var nb_draws = 0
var nb_played = 0

function nextPlayer() {
    player++
    if(player > max_player-1) {
        player = 0
    }

    background(255)
    m.draw()
    redraw()

    if(!m.gameOver) {
        setTimeout(play, (players[player] === 'bruteforce' || players[player] === 'random') ? (speed < 1 ? speed * 10e3 : 0 ) : 0)
    } else {
        const val = m.value
        m.initialize()
        t = undefined
        nb_played++

        if (val === DRAW) nb_draws++
        else if (val === 1) nb_losses++
        else nb_wins++

        console.log("### End of game ###")
        console.log("Total played : " + nb_played)
        console.log("Total wined  : " + nb_wins)
        console.log("Total lossed : " + nb_losses)
        console.log("Total drawed : " + nb_draws)

        setTimeout(play, players[player] === 'random' ? (speed < 1 ? speed * 10e3 : 0 ) : 0)
    }
}

function mouseClicked() {
    if(show_graph) {
        graphClicked()
        return
    } else if(players[player] !== 'human' || m.gameOver || mouseX < 0 || mouseX > game_size || mouseY < 0 || mouseY > game_size) {
        return
    }

    let x2 = floor(map(mouseX, 0, game_size, 0, 27))%3
    let y2 = floor(map(mouseY, 0, game_size, 0, 27))%3
    let x1 = floor(map(mouseX, 0, game_size, 0, 9))%3
    let y1 = floor(map(mouseY, 0, game_size, 0, 9))%3
    let x0 = floor(map(mouseX, 0, game_size, 0, 3))
    let y0 = floor(map(mouseY, 0, game_size, 0, 3))

    const path = [x0+y0*3,x1+y1*3,x2+y2*3]
    m.playPath(path)

    nextPlayer()
}

function showGraph() {
    show_graph = true
    t.root.draw([])
}

function graphClicked() {
    let y = 0

    if(mouseY%(NODE_SIZE*2)<NODE_SIZE) {
        y = floor(mouseY/NODE_SIZE/2)
    }
    if(y === 0) {
        return
    }

    if(y < t.selection.length + 1) {
        t.selection = t.selection.slice(0, y-1)
    }

    clickedNode = t.root.getClickedNode(mouseX, t.selection.slice(0, y-1))

    if(clickedNode) {
        t.selection.push(clickedNode)
        t.root.draw(t.selection)
    }
}

function monteCarloPlay() {
    if (players[0] === "human")
        console.log("Start monte carlo")
    if (t === undefined)
        t = new Tree(_.cloneDeep(m))
    else {
        if (t.optimize(_.cloneDeep(m)) === false) {
            console.log("PROBLEME")
        }
        // console.log(t.root.trials)
    }
    let start = millis()

    do {
        for(let i = 0; i < 500; i++) {
            t.root.chooseChild()
        }
    }while(millis() - start < thinking_time * 1000)

    let best = t.getMostVisitedNode()

    // console.log(best)

    console.log('calculated ' + t.root.trials + ' games, next move has ' + best.losses + '/' + best.trials + ' win outcomes ' + 
                '(' + nf((best.losses)/best.trials*100,0,2) + '%)')
    m.playPath(best.move)
}

function bruteForce() {
    // const valid_zone = m.getChild(m.nextZone)
    const valid_atomics = m.getPlayableAtomics()

    for(let elm of valid_atomics) {
        const atomic = _.cloneDeep(elm)

        if(atomic.play()) {
            m.playPath(atomic.getPathArray())
            // console.log('forced win on ' + atomic.getPath())
            return true
        }
    }

    return false
}