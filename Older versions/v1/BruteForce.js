
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

    // Calculate player's points before the simulation of his turn.
    const pts_before = calculatePointsBruteForce(m.getStats())

    // console.log("Try brute force")

    // Loop through the possible moves of the player.
    for (let elm of valid_atomics) {
        // Cloning the selected atomic and the game board to not affect the real board.
        const atomic = _.cloneDeep(elm)
        let game_save = _.cloneDeep(m)
        let ok = true // Is the move no too bad (opponent doesn't win ?)

        game_save.playPath(atomic.getPathArray(), player)
        
        // This move makes the player win.
        if (game_over) {
            game_over = false // Cancel global end of game variable.
            m.playPath(atomic.getPathArray(), player) // Play the move on the real board.
            return true // Indicates that a move has been made.
        }

        // Calculate player's points after the move has been made.
        const pts = calculatePointsBruteForce(game_save.getStats())

        // Switch players before considering the opponent's possible responses.
        switchPlayers()
        const opp_valid_zone = game_save.getChild(game_save.nextZone)
        const opp_valid_atomics = opp_valid_zone.getValidAtomics()

        // Calculate opponent's points before the simulation of his turn.
        const opp_pts_before = calculatePointsBruteForce(game_save.getStats())

        // Loop through possible responses of the opponent.
        for (let opp_elm of opp_valid_atomics) {
            // Saving stuff before simulating the move of the opponent.
            const opp_atomic = _.cloneDeep(opp_elm)
            let opp_game_save = _.cloneDeep(game_save)

            // Playing the move on the simulated board.
            opp_game_save.playPath(opp_atomic.getPathArray(), player)

            // If the opponent plays a winning move.
            if (game_over) {
                game_over = false // Cancel global end of game variable.
                ok = false // Forbidden move.
                // console.log("Forbidden move")
                break // No need to consider other responses to player's move ==> forbidden move.
            }

            opp_pts = calculatePointsBruteForce(opp_game_save.getStats())

            // If opponent's points are greated than the player's, don't play the move ?
            if (opp_pts > pts) {
                ok = false
                break
            }
        }

        // Switch players back to original player.
        switchPlayers()

        if (ok === false) { // If move is forbidden.
            continue // Go to check on another move.
        }

        // Keep this move with the delta player's points and opponent's points.
        arr.push([atomic.getPathArray(), pts - pts_before, opp_pts - opp_pts_before])
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

// Calculaing the points of a given position based on game's stats.
// This function is way too rudimentary.
function calculatePointsBruteForce(stats) {
    return stats[1][player - 1] * 2 + (stats[2] === undefined ? 0 : stats[2][player - 1])
}