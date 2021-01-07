let debug_logs = false
let debug_attribute = 'none' // 'none' : 'value' : 'index'
let debug_montecarlo = false

 let game_version = 'dynamic'

let player = 0

let game_size = 500
let NODE_SIZE = 150
let GRAPH_WIDTH = window.innerWidth
let MAX_HORIZONTAL_NODE_COUNT
let BACKGROUND_COLOR = 40
let calculating_best_move = false

let speed = 20

p5.disableFriendlyErrors = true

function setup() {
    createCanvas(window.innerWidth, 2000)
    textAlign(CENTER, CENTER)
    textSize(200)
    noLoop()
    MAX_HORIZONTAL_NODE_COUNT = floor(GRAPH_WIDTH / NODE_SIZE)

    initGUI()
    initGame()
    play()
}

function initGame() {
    tree = undefined

    if(game_version === 'slow') {
        game = new Morpion(settings.layers)
    } else if(game_version === 'fast') {
        game = new MainBoard()
    } else if(game_version === 'dynamic') {
        game = new DynamicMorpion(settings.layers)
    } else {
        throw new Error("Unrecognized game version: " + version)
    }

    play()
    drawGame()
}

function drawGame() {
    background(BACKGROUND_COLOR)
    game.draw()
    drawCurrentPlayer()
}

function play() {
    let current = (player === 0 ? settings.player1 : settings.player2)

    if (current === 'human') {
        return
    } else if (current === 'montecarlo') {
        monteCarloPlay()
    } else if(current === 'random') {
        game.randomPlay()
    } else {
        throw new Error('Unrecognized player type: ' + current)
    }

    nextPlayer()
    drawGame()
}

function drawCurrentPlayer() {
    let midX = (width-game_size)/4
    let w = game_size/9

    textSize(20)
    strokeWeight(3)

    fill(220)
    text("Current player", midX, innerHeight * 1/4)

    fill(255)
    rect(midX - w - 20, innerHeight * 1/4 + 40, w, w)
    player === 0 ? fill(255,0,0,128) : fill(128)
    rect(midX - w - 20, innerHeight * 1/4 + 40, w, w)
    line(midX - w - 15, innerHeight * 1/4 + 45, midX-25, innerHeight * 1/4 + 35 + w)
    line(midX - w - 15, innerHeight * 1/4 + 35 + w, midX-25, innerHeight * 1/4 + 45)

    fill('blue')
    fill(255)
    rect(midX + 20, innerHeight * 1/4 + 40, w, w)
    player === 1 ? fill(0,0,255,128) : fill(128)
    rect(midX + 20, innerHeight * 1/4 + 40, w, w)
    noFill()
    ellipse(midX + 20 + w/2, innerHeight * 1/4 + 40 +w/2, w*0.85)
}

function drawGameOver() {
    fill(220)
    rect(40, innerHeight/2 + game_size*1/9, (width-game_size)/2 - 80, game_size*2/9)

    const x = (width-game_size)/4
    const y = innerHeight/2+game_size*2/9

    fill(40)
    textSize(30)

    // if( ){
    // }

    text("Game Over", x, y)
}

function nextPlayer() {
    let current = (player === 0 ? settings.player1 : settings.player2)

    player++
    if(player > 1) {
        player = 0
    }

    drawGame()

    if(game.checkStatus()===0) {
        setTimeout(play, current === 'random' ? (speed < 1 ? speed * 10e3 : 0 ) : 0)
    }
}

function mouseClicked() {
    let current = (player === 0 ? settings.player1 : settings.player2)

    if(settings.show_graph) {
        graphClicked()
        return
    } else if(current !== 'human' || mouseX < width/2-game_size/2 || mouseX > width/2+game_size/2 || 
       mouseY < innerHeight/2-game_size/2 || mouseY > innerHeight/2+game_size/2) {
        return
    }

    let path = []

    for(let i = 0; i < settings.layers; i++) {
        const x = floor(map(mouseX, width/2-game_size/2, width/2+game_size/2, 0, pow(3,i+1)))%3
        const y = floor(map(mouseY, innerHeight/2-game_size/2, innerHeight/2+game_size/2, 0, pow(3,i+1)))%3
        const index = x+y*3

        path.push(index)
    }

    if(game.nextZone !== null && JSON.stringify(path.slice(0,-1)) !== JSON.stringify(game.nextZone)) {
        return
    }

    if(game.getChild(path.slice(0, -1)).valueOf(path.slice(-1)) !== 0) {
        return
    }

    game.clickPlay(path)

    nextPlayer()
}

function graphClicked() {
    let y = 0

    if(mouseY%(NODE_SIZE*2)<NODE_SIZE) {
        y = floor(mouseY/NODE_SIZE/2)
    }
    if(y === 0) {
        return
    }

    if(y < tree.selection.length + 1) {
        tree.selection = tree.selection.slice(0, y-1)
    }

    clickedNode = tree.root.getClickedNode(mouseX, tree.selection.slice(0, y-1))

    if(clickedNode) {
        background(BACKGROUND_COLOR)
        tree.selection.push(clickedNode)
        tree.root.draw(tree.selection)
    }
}

let tree
let node_count
function monteCarloPlay(simulate=false) {
    console.log("Start monte carlo version: " + game_version)
    let gameSim

    node_count = 0

    if(game_version === 'slow') {
        gameSim = _.cloneDeep(game)
    } else if(game_version === 'fast') {
        gameSim = new MainBoard(game)
    } else if(game_version === 'dynamic') {
        gameSim = new DynamicMorpion(game)
    }

    tree = new Tree(gameSim)
    let start = millis()

    do {
        for(let i = 0; i < 500; i++) {
            tree.root.chooseChild()
        }
    }while(millis() - start < (simulate ? 5 : settings.thinking_time) * 1000)

    let best = tree.root.children.reduce(function(prev, curr) {
        return prev.trials < curr.trials ? curr : prev
    })

    console.log('calculated ' + tree.root.trials + ' games, next move has ' + best.losses + '/' + best.trials + ' win outcomes ' + 
                '(' + nf((best.losses)/best.trials*100,0,2) + '%)', best.draws/best.trials*100)

    if(!simulate) {
        if(game_version === 'slow') {
            game = playPath(best.path)
        } else if(game_version === 'fast') {
            game.play(best.path[0], best.path[1])
        } else if(game_version === 'dynamic') {
            game.clickPlay(best.path)
        }
    }

    print('node count', node_count)

    return tree
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