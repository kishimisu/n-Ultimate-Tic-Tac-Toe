const colors = [[255,0,0],[0,0,255]]
const win_checks = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ]
const EMPTY = 0, DRAW = -1, DISABLED = -2

function getPlayerColor(player) {
    return colors[player-1]
}

class Morpion {
    // layer: current layer
    // index: index in parent's grid (0-8)
    // parent: reference to parent object
    // masterParent: reference to master object
    constructor(layer, index, parent, masterParent) {
        this.atomic = (layer === 0)
        this.master = (parent === undefined)
        this.parent = parent
        this.masterParent = masterParent || this

        if(masterParent) {
            this.atomics = masterParent.atomics
            this.nextZone = masterParent.nextZone
        }

        this.layer = layer
        this.index = index

        this.initialize()
    }

    // Recursively initalize a Morpion object
    initialize() {
        this.value = EMPTY
        this.win_highlight = false

        if(this.master) {
            this.atomics = []
            this.nextZone = []
            this.gameOver = false
            this.player = 1
        }

        if (!this.atomic) {
            this.grid = []
    
            for(let i in [...Array(9).keys()]) {
                this.grid.push(
                    new Morpion(
                        this.layer - 1, 
                        Number(i), 
                        this, 
                        this.masterParent
                    ))
            }
        } else {
            this.atomics.push(this)
        }
    }

    // Draws the master object at (x,y) with a size of (w,h)
    drawStretched(x, y, w) {
        if(!this.master) {
            throw new Error("You can only call drawStretched from the master object")
        }

        push()
            translate(x,y)
            scale(w/game_size)
            this.draw()
        pop()
    }

    // Recursively draw the object and its childs
    draw() {
        if(!this.atomic) {
            this.drawChilds()
        }

        push()
        if(!this.master) {
            const alpha = (this.win_highlight ? 150 : 70) + this.layer * 20

            if(this.value === EMPTY || this.value === DISABLED) {
                noFill()
            } else if(this.value === DRAW) {
                this.parent.master ? fill(255, 160) : fill(0, 140)
            } else {
                fill([...getPlayerColor(this.value), alpha])
            }

            strokeWeight(12)
            rect(0, 0, game_size-1, game_size-1)
            strokeWeight(25)

            if(debug_attribute !== 'none') {
                fill(0)
                text(debug_attribute === 'value' ? this.value : this.index, game_size/2,game_size/2)
            } else if(this.value === 1) { // Draw cross
                line(game_size*0.05, game_size*0.05, game_size*0.95, game_size*0.95)
                line(game_size*0.95, game_size*0.05, game_size*0.05, game_size*0.95)
            } else if(this.value === 2) { // Draw circle
                noFill()
                ellipse(game_size/2, game_size/2, game_size*0.9)
            } else if(this.value === 3) { // Draw triangle
                noFill()
                triangle(game_size/2,game_size*0.05,game_size*0.05,game_size*0.95,game_size*0.95,game_size*0.95)
            }

            if(JSON.stringify(this.getPathArray()) === JSON.stringify(this.nextZone)) {
                strokeWeight(1)
                fill(100,255,100,100)
                rect(0,0,game_size-1,game_size-1) // fill with background color
            }
        } else if(this.nextZone.length === 0) {
            noFill()
            stroke(100,255,100)
            strokeWeight(10)
            rect(0,0,game_size-1,game_size-1) 
        }
        pop()
    }

    // Do not call this function yourself
    // Recursively translate and scale the drawing area
    // Used in draw()
    drawChilds() {
        if(this.atomic) {
            throw new Error("Trying to draw childs of an atomic object")
        }

        push()
        scale(1/3)

        for(let y = 0; y < 3; y++) {
            push()

            for(let x = 0; x < 3; x++) {  
                this.grid[y*3 + x].draw() 
                translate(game_size, 0)
            }

            pop()
            translate(0, game_size)
        }
        pop()
    }

    // Plays the atomic object at a specific path from the current Morpion object
    // path: the path to the atomic child represented as an array of integers (ex. [3,2,5])
    playPath(path) {
        if(this.atomic) {
            this.play()
        } else if(path.length === 0) {
            throw new Error("Invalid path")
        } else {
            this.grid[path[0]].playPath(path.slice(1))
        }
    }

    // Plays a random valid atomic that is a child of the current object
    playRandomValidAtomic() {
        if(!this.master) {
            throw new Error("You can only play a valid atomic from the master object")
        }

        const validZone = this.getChild(this.nextZone)
        const validAtomics = validZone.getValidAtomics()

        if(validAtomics.length === 0) {
            throw new Error("Could not find any valid atomic for " + this.getPath())
        }

        const randomAtomic = validAtomics[floor(random(validAtomics.length))]

        randomAtomic.play()
    }

    // Returns an array containing all the valid atomics that are childs of the current object
    getValidAtomics() {
        if(this.atomic) {
            throw new Error("This function cannot be called on an atomic object")
        }

        const atomics = []

        this.grid.forEach(elm => {
            if(elm.value === EMPTY) {
                if(this.layer === 1) {
                    atomics.push(elm)
                } else {
                    atomics.push(...elm.getValidAtomics())
                }
            }
        })

        return atomics
    }

    // Returns an array containing all the playanle atomics that are childs of the current object
    getPlayableAtomics() {
        if(!this.master) {
            throw new Error("This function cannot only be called on the master object")
        }

        return this.getChild(this.nextZone).getValidAtomics()
    }

    // Base function to play a move
    // Throws an error if :
    // - The object is not atomic
    // - The object is not in the next playable zone 
    // - The object already has a value
    play() {
        if(!this.atomic) {
            throw new Error("Trying to play on a non-atomic object: " + this.getPath())
        } else if(!this.isInNextZone()) {
            throw new Error("This atomic is not inside the next valid zone: " + this.getPath())
        } else if(this.value !== EMPTY) {
            throw new Error("Trying to play on " + this.getPath() + " which already has a value of " + this.value)
        }

        let has_win = true

        this.debug("Play: " + this.getPath())

        this.value = this.masterParent.player
        this.removeFromAtomics()

        if(!this.parent.winUpdate()) {
            this.parent.drawUpdate()
            has_win = false
        }

        this.updateNextZone()

        if(this.masterParent.value !== EMPTY) {
            this.masterParent.gameOver = true
        }

        this.switchPlayers()

        return has_win
    }

    // Do not call this function yourself
    // Recursively check for win conditions after a win update
    winUpdate() {
        for(let win of win_checks) {
            if(this.checkWin(win)) {
                for(let i of win) {
                    this.grid[i].win_highlight = true
                }

                if(this.master){
                    this.value = this.masterParent.player
                    this.gameOver = true
                    return
                }

                this.disableChilds(true)
                this.parent.drawUpdate()

                this.debug(this.getPath() + ': set win (' + this.masterParent.player + ')')
                this.value = this.masterParent.player

                if(!this.parent.winUpdate()) {
                    this.parent.drawUpdate()
                }
                return true
            }
        }
        
        return false
    }

    // Do not call this function yourself
    // Recursively check for draw conditions after a draw update
    drawUpdate() {
        if(this.checkDraw()) {
            this.debug(this.getPath() + ': set draw')

            if(this.master){
                this.gameOver = true
                this.value = DRAW
                return
            }

            this.disableChilds(true)
            this.value = DRAW
            this.parent.drawUpdate()
            return true
        }

        return false
    }

    // Return true if three cases are in win condition
    // check: an array of 3 indexes (ex: [0,1,2])
    checkWin(check) {
        const [a, b, c] = check

        if (this.grid[a].value > EMPTY &&
            this.grid[a].value === this.grid[b].value && 
            this.grid[a].value === this.grid[c].value) {
            return this.grid[a].value
        } else {
            return 0
        }
    }

    // Return true if the object's grid is in draw condition
    checkDraw() {
        if(this.atomic) {
            throw new Error("Trying to check for draw on an atomic object")
        }

        for(let child of this.grid) {
            if(child.value === EMPTY) {
                return false
            }
        }

        return true
    }

    // Recursively disable all the childs objects (atomcis and non-atomics)
    // first: call this function with true to ignore the first object and keep 
    // its current value instead of setting it to DISABLED
    disableChilds(first = false) {
        if(!first) {
            this.debug(this.getPath() + ': set disabled')
            this.value = DISABLED
        }

        if(!this.atomic) {
            for(let child of this.grid) {
                if(child.value === EMPTY) {
                    child.disableChilds()
                }
            }
        } else {
            this.removeFromAtomics()
        }
    }

    // Remove the object from the master's atomics array
    // Must be called on an atomic object
    removeFromAtomics() {
        if(!this.atomic) {
            throw new Error("Trying to remove a non-atomic object from the atomic collection: " + this.getPath())
        }
        const index = this.atomics.indexOf(this)

        if(index === -1) {
            throw new Error("Trying to remove an already removed atomic from the atomic collection: " + this.getPath())
        }

        this.atomics.splice(index, 1)
    }

    switchPlayers() {
        let master = this.master ? this : this.masterParent

        master.player++

        if(master.player > max_player) {
            master.player = 1
        }
    }

    // Return true if the object is located in the next valid zone
    isInNextZone() {
        const path = this.getPathArray()

        let i = 0
        for(let elm of this.nextZone) {
            if(elm !== path[i]) {
                return false
            }
            i++
        }

        return true
    }

    // Update the nextZone attribute based on the current object's path
    updateNextZone() {
        const nextZone = this.getPathArray().slice(1)
        const nextValidZone = this.masterParent.getNextValidZone(nextZone)

        this.nextZone.length = 0
        this.nextZone.push(...nextValidZone)
    }

    // Returns the smallest zone containing valid atomics, starting from nextZone
    getNextValidZone(nextZone) {
        if(nextZone.length === 0 || this.grid[nextZone[0]].value !== EMPTY) {
            return this.getPathArray()
        } else {
            return this.grid[nextZone[0]].getNextValidZone(nextZone.slice(1))
        }
    }

    // Get the child of the current object from a path
    // path: the path to the atomic child represented as an array of integers (ex. [3,2,5])
    getChild(path) {
        if(path.length === 0) {
            return this
        } else {
            return this.grid[path[0]].getChild(path.slice(1))
        }
    }

    // Equivalent to print(), but activated only when the global variable
    // debug_logs is true
    debug(str) {
        if (debug_logs) {
            print(str)
        }
    }
 
    // Returns the path of the current object from the master object as a string (ex: 2 -> 3 -> 5)
    getPath() {
        return this.parent ? (this.parent.master ? this.index.toString() : (this.parent.getPath() + ' -> ' + this.index)) : 'master'
    }

    // Returns the path of the current object from the master object as an array of integers (ex: [2,3,5])
    getPathArray() {
        if(this.master) {
            return []
        }

        if(!this.parent.master) {
            return [...this.parent.getPathArray(), this.index]
        } else {
            return [this.index]
        }
    }

    // Print in a console-friendly format the current disposition of the object
    print() {
        let str = ''
        for(let j = 0; j < 3; j ++) {
            for(let i = 0; i < 3; i++) {
                const index = i + j*3
                str += (this.grid[index].value === 0 ? '_' : (this.grid[index].value === 1 ? 'X' : '0')) + ' '
            }
            
            str += '\n'
        }

        console.log(str)
    }

    // Returns an array containing the number of cases for each player at each layer, excluding the atomic layer
    getStats(stats) {
        if(stats === undefined)  {
            stats = []
        }
        if(stats[this.layer] === undefined) {
            stats[this.layer] = []
        }
        
        if(stats[this.layer][this.value] === undefined) {
            stats[this.layer][this.value] = 1
        } else {
            stats[this.layer][this.value]++
        }
        

        if(this.layer !== 1) {
            this.grid.forEach(child => {
                child.getStats(stats)
            })
        }

        return stats
    }

    // evaluate(player) {
    //     const stats = this.masterParent.getStats()
    //     let score = 0
    //     let enemy = player === 1 ? 2 : 1

    //     for(let i = 1; i < stats.length; i++) {
    //         score += (stats[i][player] ? stats[i][player] : 0) * i * 2
    //         score -= (stats[i][enemy] ? stats[i][enemy] : 0) * i
    //     }

    //     return score
    // }

    // bestMove(depth, player) {
    //     let maxScore = Number.NEGATIVE_INFINITY
    //     let move = null

    //     for(let child of this.getValidAtomics()) {
    //         const score = child.minimax(depth, false, player)

    //         if(score > maxScore) {
    //             maxScore = score
    //             move = child.getPathArray()
    //         }
    //     }

    //     return move
    // }

    // minimax(depth, maximizingPlayer, player) {
    //     let game_state = _.cloneDeep(this)
    //     const enemy = (player === 1 ? 2 : 1)

    //     game_state.play(maximizingPlayer ? enemy : player)
    //     const score = game_state.evaluate(player) * (depth+1)
    //     // console.log('depth: ' + depth + '(' + (maximizingPlayer ? 'maximizing' : 'minimizing') + '):\n' + game_state.masterParent.printAtomic())

    //     if(depth === 0 || game_state.masterParent.value !== EMPTY) {
    //         // console.log(game_state.getPath() + ': ' + score)
    //         return score
    //     }

    //     if(maximizingPlayer) {
    //         let maxEval = Number.NEGATIVE_INFINITY

    //         for(let atomic of game_state.masterParent.getChild(game_state.nextZone).getValidAtomics()) {
    //             const childEval = atomic.minimax(depth-1, false, player)
    //             maxEval = max(childEval, maxEval)
    //         }

    //         return maxEval
    //     } else {
    //         let minEval = Number.POSITIVE_INFINITY

    //         for(let atomic of game_state.masterParent.getChild(game_state.nextZone).getValidAtomics()) {
    //             const childEval = atomic.minimax(depth-1, true, player)
    //             minEval = min(childEval, minEval)
    //         }

    //         return minEval
    //     }
    // }
}