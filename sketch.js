let debug_logs = false
let debug_attribute = 'none' // 'none' : 'value' : 'index'
let debug_montecarlo = false

let speed = .1
let max_player = 2
let players = ['human', 'montecarlo']
let player = 0
let game_size = 600

let show_graph = false
let NODE_SIZE = 100
let GRAPH_WIDTH = 3000

let thinking_time = 3

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
    console.log("Start monte carlo")
    t = new Tree(_.cloneDeep(m))
    let start = millis()

    do {
        for(let i = 0; i < 500; i++) {
            t.root.chooseChild()
        }
    }while(millis() - start < thinking_time * 1000)

    let best = t.root.children.reduce(function(prev, curr) {
        return prev.trials < curr.trials ? curr : prev
    })

    console.log('calculated ' + t.root.trials + ' games, next move has ' + best.losses + '/' + best.trials + ' win outcomes ' + 
                '(' + nf((best.losses)/best.trials*100,0,2) + '%)', best.draws/best.trials*100)
    m.playPath(best.move)
}