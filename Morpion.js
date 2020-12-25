const colors = [[255,0,0],[0,0,255]]
const win_checks = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ]
const EMPTY = 0, DRAW = -1, DISABLED = -2

function getPlayerColor(player) {
    return colors[player-1]
}

class Morpion {
    constructor(layer, index, parent, masterParent) {
        this.atomic = (layer === 0)
        this.master = (parent === undefined)
        this.parent = parent
        this.masterParent = masterParent

        if(masterParent) {
            this.atomics = masterParent.atomics
            this.nextZone = masterParent.nextZone
        }

        this.layer = layer
        this.index = index

        this.initialize()
    }

    initialize() {
        this.value = EMPTY
        this.win_highlight = false

        if(this.master) {
            this.atomics = []
            this.nextZone = []
        }

        if (!this.atomic) {
            this.grid = []
    
            for(let i in [...Array(9).keys()]) {
                this.grid.push(
                    new Morpion(
                        this.layer - 1, 
                        Number(i), 
                        this, 
                        this.masterParent || this
                    ))
            }
        } else {
            this.atomics.push(this)
        }
    }

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
            rect(0, 0, width-1, height-1)
            strokeWeight(25)

            if(debug_attribute !== 'none') {
                fill(0)
                text(debug_attribute === 'value' ? this.value : this.index, width/2,height/2)
            } else if(this.value === 1) { // Draw cross
                line(width*0.05, height*0.05, width*0.95, height*0.95)
                line(width*0.95, height*0.05, width*0.05, height*0.95)
            } else if(this.value === 2) { // Draw circle
                noFill()
                ellipse(width/2, height/2, width*0.9)
            } else if(this.value === 3) { // Draw triangle
                noFill()
                triangle(width/2,height*0.05,width*0.05,height*0.95,width*0.95,height*0.95)
            }

            if(JSON.stringify(this.getPathArray()) === JSON.stringify(this.nextZone)) {
                strokeWeight(1)
                fill(100,255,100,100)
                rect(0,0,width-1,height-1) // fill with background color
            }
        } else if(this.nextZone.length === 0) {
            noFill()
            stroke(100,255,100)
            strokeWeight(20)
            rect(0,0,width-1,height-1) 
        }
        pop()
    }

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
                translate(width, 0)
            }

            pop()
            translate(0, height)
        }
        pop()
    }

    playPath(path, player) {
        if(this.atomic) {
            this.play(player)
        } else if(path.length === 0) {
            throw new Error("Invalid path")
        } else {
            this.grid[path[0]].playPath(path.slice(1), player)
        }
    }

    playRandomValidAtomic(player) {
        if(!player) {
            throw new Error("Invalid player: " + player)
        } else if(!this.master) {
            throw new Error("You can only play a valid atomic from the master object")
        }

        const validZone = this.getChild(this.nextZone)
        const validAtomics = validZone.getValidAtomics()

        if(validAtomics.length === 0) {
            throw new Error("Could not find any valid atomic for " + this.getPath())
        }

        const randomAtomic = validAtomics[floor(random(validAtomics.length))]

        randomAtomic.play(player)
    }

    // getRandomValidAtomicChild() {
    //     const valid_childs = this.grid.filter(child => child.value === EMPTY)

    //     if(valid_childs.length === 0) {
    //         throw new Error("No valid child for object " + this.getPath())
    //     }

    //     if(this.layer === 1) {
    //         return valid_childs[floor(random(valid_childs.length))]
    //     } else {
    //         return valid_childs[floor(random(valid_childs.length))].getRandomValidAtomicChild()
    //     }
    // }

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

    //     if(this.layer === 1) {
    //         const valid_atomics = []

    //         this.grid.forEach(elm => {
    //             if(elm.value === EMPTY) {
    //                 valid_atomics.add(elm)
    //             }
    //         })

    //         return valid_atomics
    //     } else {
    //         const valid_atomics = []

    //         this.grid.forEach(elm => {
    //             if(elm.value === EMPTY) {
    //                 return
    //             }
    //         })
    //     }
    // }

    play(player) {
        if(!this.atomic) {
            throw new Error("Trying to play on a non-atomic object: " + this.getPath())
        } else if(!this.isInNextZone()) {
            throw new Error("This atomic is not inside the next valid zone: " + this.getPath())
        } else if(this.value !== EMPTY) {
            throw new Error("Trying to play on " + this.getPath() + " which already has a value of " + this.value)
        }

        let has_win = true

        this.debug("Play: " + this.getPath())

        this.value = player
        this.removeFromAtomics()

        if(!this.parent.winUpdate(player)) {
            this.parent.drawUpdate()
            has_win = false
        }

        this.updateNextZone()

        return has_win
    }

    winUpdate(player) {
        for(let win of win_checks) {
            if(this.checkWin(win)) {
                for(let i of win) {
                    this.grid[i].win_highlight = true
                }

                if(this.master){
                    this.value = player
                    gameOver()
                    return
                }

                this.disableChilds(true)
                this.parent.drawUpdate()

                this.debug(this.getPath() + ': set win (' + player + ')')
                this.value = player

                if(!this.parent.winUpdate(player)) {
                    this.parent.drawUpdate()
                }
                return true
            }
        }
        
        return false
    }

    drawUpdate() {
        if(this.checkDraw()) {
            this.debug(this.getPath() + ': set draw')

            if(this.master){
                gameOver()
                return
            }

            this.disableChilds(true)
            this.value = DRAW
            if(!this.master){
                this.parent.drawUpdate()
            }
            return true
        }

        return false
    }

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

    // Check if three cases are in win condition
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

    updateNextZone() {
        const nextZone = this.getPathArray().slice(1)
        const nextValidZone = this.masterParent.getNextValidZone(nextZone)

        this.nextZone.length = 0
        this.nextZone.push(...nextValidZone)
    }

    getNextValidZone(nextZone) {
        if(nextZone.length === 0 || this.grid[nextZone[0]].value !== EMPTY) {
            return this.getPathArray()
        } else {
            return this.grid[nextZone[0]].getNextValidZone(nextZone.slice(1))
        }
    }

    getChild(path) {
        if(path.length === 0) {
            return this
        } else {
            return this.grid[path[0]].getChild(path.slice(1))
        }
    }

    debug(str) {
        if (debug_logs) {
            print(str)
        }
    }

    getPath() {
        return this.parent ? (this.parent.master ? this.index.toString() : (this.parent.getPath() + ' -> ' + this.index)) : 'master'
    }

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

    getStats(stats) {
        if(this.master) {
            stats = []
        } else { 
            if(stats[this.layer] === undefined) {
                stats[this.layer] = []
            }
            
            if(stats[this.layer][this.value] === undefined) {
                stats[this.layer][this.value] = 1
            } else {
                stats[this.layer][this.value]++
            }
        }

        if(this.layer !== 1) {
            this.grid.forEach(child => {
                child.getStats(stats)
            })
        }

        return stats
    }
}