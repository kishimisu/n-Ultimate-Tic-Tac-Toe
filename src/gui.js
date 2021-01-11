const gui = new dat.GUI({name: "Settings", width: '30'})

let settings = {
    layers: 2,
    thinking_time: 0.5,
    player1: 'human',
    player2: 'montecarlo',
    best_move: on_get_best_move,
    reset_game: on_reset_game,
    show_graph: false,
    grayscale: true
}

function initGUI() {
    layers_ctrl = gui.add(settings, 'layers', 2, 5, 1)
        .onChange(on_layers_change)
        .name("Layers")
    thinking_time_ctrl = gui.add(settings, 'thinking_time', 0.5, 30, 0.5)
        .name("Thinking time (s)")

    player1_ctrl = gui.add(settings, 'player1', ['human', 'random', 'montecarlo'])
        .onChange(on_player1_change)
        .name("Player 1")
    player2_ctrl = gui.add(settings, 'player2', ['human', 'random', 'montecarlo'])
        .onChange(on_player2_change)
        .name("Player 2")

    bestmove_ctrl = gui.add(settings, 'best_move')
        .name('Show best move (5s)')
    bestmove_ctrl.domElement.parentElement.getElementsByClassName('property-name')[0].style.width='100%'

    reset_game_ctrl = gui.add(settings, 'reset_game')
        .name("Reset Game")

    show_graph_ctrl = gui.add(settings, 'show_graph')
        .onChange(on_show_graph_change)
        .name("Tree Explorer")

    grayscale_ctrl = gui.add(settings, 'grayscale')
        .onChange(on_grayscale_change)
        .name("Highlight last move")
    hideElement(grayscale_ctrl)
}

function on_get_best_move() {
    fill(220)
    text("Best move", (width-game_size)/4, innerHeight * 1/2)
    redraw()
    monteCarloPlay(true)
    let best = tree.root.children.reduce(function(prev, curr) {
        return prev.trials < curr.trials ? curr : prev
    })
    best.state.drawWithDifference(20+game_size/6, innerHeight * 1/2+20, game_size/3)
}

function on_reset_game() {
    tree = undefined
    initGame()
}

function on_player1_change() {
    if(player === 0 && settings.player1 !== 'human') {
        play()
    }
}

function on_player2_change() {
    if(player === 1 && settings.player2 !== 'human') {
        play()
    }
}

function on_layers_change() {
    settings.show_graph = false
    show_graph_ctrl.setValue(false)
    hideElement(grayscale_ctrl)
    initGame()
}

function on_show_graph_change() {
    if(settings.show_graph && tree === undefined) {
        settings.show_graph = false
        alert('The AI must have made at lease 1 move')
        return
    }

    showElement(grayscale_ctrl, settings.show_graph)

    if(settings.show_graph) {
        tree.draw()
        drawTitle()
    } else {
        drawGame()
    }
}

function on_grayscale_change() {
    tree.draw()
    drawTitle()
}

function showElement(elm, show = true) {
    elm.domElement.parentElement.parentElement.style.display = (show ? 'block' : 'none')
}

function hideElement(elm) {
    elm.domElement.parentElement.parentElement.style.display = 'none'
}