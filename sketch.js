let debug_logs = false
let debug_attribute = 'none' // 'none' : 'value' : 'index'
let debug_montecarlo = false

let players = ['human', 'montecarlo']
let game_version = 'dynamic'
let level = 3

let max_player = 2
let player = 0

let game_size = 500
let show_graph = false
let NODE_SIZE = 100
let GRAPH_WIDTH = 3000

let speed = 20
let thinking_time = 3

p5.disableFriendlyErrors = true

function setup() {
    createCanvas(3000, 2000)
    textAlign(CENTER, CENTER)
    textSize(200)

    if(game_version === 'slow') {
        game = new Morpion(level)
    } else if(game_version === 'fast') {
        game = new MainBoard()
    } else if(game_version === 'dynamic') {
        game = new DynamicMorpion(level)
    } else {
        throw new Error("Unrecognized game version: " + version)
    }

    game.draw()
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
        throw new Error("Not implemented!")
        game.playRandomValidAtomic()
    } else {
        throw new Error('Unrecognized player type: ' + current)
    }

    nextPlayer()
}

function nextPlayer() {
    background(255)
    game.draw()
    redraw()

    player++
    if(player > max_player-1) {
        player = 0
    }
    if(game.checkStatus()===0) {
        setTimeout(play, players[player] === 'random' ? (speed < 1 ? speed * 10e3 : 0 ) : 0)
    }
}

function mouseClicked() {
    if(show_graph) {
        graphClicked()
        return
    } else if(players[player] !== 'human' || mouseX < 0 || mouseX > game_size || mouseY < 0 || mouseY > game_size) {
        return
    }

    let x2 = floor(map(mouseX, 0, game_size, 0, 27))%3
    let y2 = floor(map(mouseY, 0, game_size, 0, 27))%3
    let x1 = floor(map(mouseX, 0, game_size, 0, 9))%3
    let y1 = floor(map(mouseY, 0, game_size, 0, 9))%3
    let x0 = floor(map(mouseX, 0, game_size, 0, 3))
    let y0 = floor(map(mouseY, 0, game_size, 0, 3))

    const path = [x0+y0*3,x1+y1*3,x2+y2*3]

    if(game_version === 'slow') {
        game.playPath(path)
    } else if(game_version === 'fast') {
        game.play(x0+y0*3,x1+y1*3)
    } else if(game_version === 'dynamic') {
        game.clickPlay(path)
    }

    background(255)
    game.draw()

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
    console.log("Start monte carlo version: " + game_version)
    let gameSim

    if(game_version === 'slow') {
        gameSim = _.cloneDeep(game)
    } else if(game_version === 'fast') {
        gameSim = new MainBoard(game)
    } else if(game_version === 'dynamic') {
        gameSim = new DynamicMorpion(game)
    }

    let tree = new Tree(gameSim)
    let start = millis()

    do {
        for(let i = 0; i < 500; i++) {
            tree.root.chooseChild()
        }
    }while(millis() - start < thinking_time * 1000)

    let best = tree.root.children.reduce(function(prev, curr) {
        return prev.trials < curr.trials ? curr : prev
    })

    console.log('calculated ' + tree.root.trials + ' games, next move has ' + best.losses + '/' + best.trials + ' win outcomes ' + 
                '(' + nf((best.losses)/best.trials*100,0,2) + '%)', best.draws/best.trials*100)

    if(game_version === 'slow') {
        game = playPath(best.path)
    } else if(game_version === 'fast') {
        game.play(best.path[0], best.path[1])
    } else if(game_version === 'dynamic') {
        game.clickPlay(best.path)
    }

    game.draw()
}

function benchmark() {
    print("Morpion initialization")
    let start = millis()
    let slow = new Morpion(2)
    print(nf((millis() - start) / 1000, 0, 4) + 's')

    print("SimpleMorpion initialization")
    start = millis()
    let fast = new MainBoard()
    print(nf((millis() - start) / 1000, 0, 4) + 's')

    print("DynamicMorpion initialization")
    start = millis()
    let dynamic = new DynamicMorpion(2)
    print(nf((millis() - start) / 1000, 0, 4) + 's')


    print('Executing 100,000 cloneDeep on a Morpion object')
    start = millis()

    for(let i = 0; i < 100000; i++) {
        let slow_copy = _.cloneDeep(slow)
    }

    print(nf((millis() - start) / 1000, 0, 4) + 's')

    print('Executing 100,000 cloneDeep on a SimpleMorpion object')
    start = millis()

    for(let i = 0; i < 100000; i++) {
        let fast_copy = _.cloneDeep(fast)
    }

    print(nf((millis() - start) / 1000, 0, 4) + 's')

    print('Executing 100,000 copy by hand on a SimpleMorpion object')
    start = millis()

    for(let i = 0; i < 100000; i++) {
        let fast_copy = new MainBoard(fast)
    }

    print(nf((millis() - start) / 1000, 0, 4) + 's')

    print('Executing 100,000 copy by hand on a DynamicMorpion object')
    start = millis()

    for(let i = 0; i < 100000; i++) {
        let fast_copy = new MainBoard(dynamic)
    }

    print(nf((millis() - start) / 1000, 0, 4) + 's')
}