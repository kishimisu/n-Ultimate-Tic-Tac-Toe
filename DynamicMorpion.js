const PLAYER_X = 1, PLAYER_O = 2

const win_bitmasks = [
    [0x15, 0x540, 0x15000, 0x1041, 0x4104, 0x10410, 0x10101, 0x1110], 
    [0x2a, 0xa80, 0x2a000, 0x2082, 0x8208, 0x20820, 0x20202, 0x2220]
]

function sliceBits(integer, start, length) {
    return (integer >> start) & ((1 << length) - 1);
}

function getBit(n, i) {
    let mask = 1 << i
    return (n & mask) !== 0
}

function setBit(n, i) {
    let mask = 1 << i
    return n | mask
}

class DynamicMorpion {
    constructor(layer, master=true) {
        if(layer instanceof DynamicMorpion) {
            this.grid = layer.grid

            if(master){
                this.player = layer.player
                this.nextZone = layer.nextZone
            }

            if(layer.children !== undefined) {
                this.children = []

                for(let i = 0; i < 9; i++) {
                    this.children.push(new DynamicMorpion(layer.children[i], false))
                }
            }
        } else {
            this.grid = 0

            if(master) { // master
                this.player = PLAYER_X
                this.nextZone = null
            }

            if(layer > 1) {
                this.children = []

                for(let i = 0; i < 9; i++) {
                    this.children.push(new DynamicMorpion(layer-1, false))
                }
            }
        }
    }

    draw() {
        push()
        translate(width/2-game_size/2,innerHeight/2-game_size/2)
        this.recursiveDraw()
        pop()
    }

    drawStretched(x, y, w=game_size, state) {
        push()
        translate(x,y)
        scale(w/game_size)

        let diff 
        if(state !== undefined && settings.grayscale) {
            diff = {
                path:  this.getDifference(state),
                zone: state.nextZone
            }
        }
        this.recursiveDraw(undefined,undefined,diff)
        pop()
    }

    recursiveDraw(zone, nextZone, difference) {
        zone ||= []
        nextZone ||= this.nextZone

        push()
        scale(1/3)

        for(let y = 0; y < 3; y++) {
            push()

            for(let x = 0; x < 3; x++) {  
                const index = y*3 + x
                const value = this.valueOf(index)

                if(this.children) {
                    this.children[index].recursiveDraw([...zone, index], nextZone, difference) 
                } else {
                    fill(220)
                    rect(0,0,game_size,game_size)
                }

                strokeWeight(25)
                stroke(0)
                noFill()

                let color_attenuation = 1
                if(difference !== undefined) {
                    color_attenuation = 8
                    if(JSON.stringify(difference.path) === JSON.stringify([...zone, index])) {
                        color_attenuation = 1
                    }
                }

                if(value === 1) {
                    line(game_size*0.05, game_size*0.05, game_size*0.95, game_size*0.95)
                    line(game_size*0.95, game_size*0.05, game_size*0.05, game_size*0.95)
                    fill(255 / color_attenuation, 0, 0, 128)
                } else if(value === 2) {
                    ellipse(game_size/2, game_size/2, game_size*0.9)
                    fill(0, 0, 255 / color_attenuation, 128)
                } else if(value === 3) {
                    fill(0, 160)
                }
                if(JSON.stringify(nextZone) === JSON.stringify([...zone, index])) {
                    fill(0, 255 / color_attenuation, 0, 64)
                }

                if(difference !== undefined && JSON.stringify(difference.zone) === JSON.stringify([...zone, index])) {
                    fill(0, 255, 0, 64)
                }

                strokeWeight(12)

                rect(0,0,game_size,game_size)
                
                translate(game_size, 0)
            }

            pop()
            translate(0, game_size)
        }
        pop()

        push()
        noFill()
        strokeWeight(6)
        if(nextZone === null && zone.length === 0) {
            stroke('#00bb00')
        } else {
            stroke(0)
        }
        rect(0,0,game_size,game_size)
        pop()
    }

    clickPlay(path) {
        this.play(path, this.player)
        this.updateNextZone(path)
        this.switchPlayers()
    }

    // optimize
    randomPlay(path) {
        if(path === undefined) { // master
            if(this.nextZone === null) { 
                const validIndexes = this.getValidIndexes()
                const randomIndex = validIndexes[floor(random(validIndexes.length))]
                path = this.children[randomIndex].randomPlay([randomIndex])
            } else {
                path = this.getChild(this.nextZone).randomPlay(this.nextZone)
            }
 
            // print('play',path)
            this.play(path, this.player)
            this.updateNextZone(path)
            this.switchPlayers()
        } else {
            if(this.children !== undefined) { // in-between
                const validIndexes = this.getValidIndexes()
                const randomIndex = validIndexes[floor(random(validIndexes.length))]
                return this.children[randomIndex].randomPlay([...path, randomIndex])
            } else { // atomic
                const validIndexes = this.getValidIndexes()
                const randomIndex = validIndexes[floor(random(validIndexes.length))]

                return [...path, randomIndex]
            }
        }
    }

    play(path, player) {
        if(this.children !== undefined) {
            const status = this.children[path[0]].play(path.slice(1), player) 

            if(status !== 0) {
                return this.playCase(path[0], status === -1 ? undefined : player)
            } else {
                return 0
            }
        } else { // atomic
            return this.playCase(path[0], player)
        }
    }

    playCase(i, player) {
        if(player === undefined && this.valueOf(i) !== 0) {
            print('INVALID',this.valueOf(i))
        }
        if(player === PLAYER_X || player === undefined) {
            this.grid = setBit(this.grid, i*2)
        }
        if(player === PLAYER_O || player === undefined) {
            this.grid = setBit(this.grid, i*2+1)
        }

        if(player) {
            if(this.checkStatus(player)) {
                this.grid = setBit(this.grid, player === PLAYER_X ? 18 : 19)
                return 1
            }
        }  

        let currentCount = sliceBits(this.grid, 20, 4) + 1 // Read 4 bits containing the count and increment it

        if(currentCount === 9) {
            this.grid |= 0xc0000
            return DRAW
        }

        currentCount <<= 20 // Add 20 '0' to the right of the count
        this.grid &= 0x7ffff // Only keep the 20 first bits of the grid
        this.grid |= currentCount // Mix the grid mask with the count mask
        
        return 0
    }

    updateNextZone(path) {
        path = path.slice(1)
        let child = this.children[path[0]]

        if(child.checkStatus() !== 0) {
            this.nextZone = null
        } else {
            this.nextZone = []

            do {
                this.nextZone.push(path[0])

                if(child.children === undefined) {
                    break
                }
                path = path.slice(1)
                child = child.children[path[0]]
            } while(child.checkStatus() === 0 && path.length > 0)
        }
    }

    switchPlayers() {
        this.player = this.player === PLAYER_X ? PLAYER_O : PLAYER_X
    }

    // optimize iterative ?
    getChild(path) {
        if(path.length > 0) {
            return this.children[path[0]].getChild(path.slice(1))
        } else {
            return this
        }
    }

    getChildIteratively(path) {
        let child = this

        while(path.length > 0) {
            child = child.children[path[0]]
            path = path.slice(1)
        }

        return child
    }

    valueOf(i) {
        return sliceBits(this.grid, i*2, 2)
    }

    playedCaseCount() {
        return sliceBits(this.grid, 20, 4)
    }

    checkStatus(player) {
        if(player === undefined) {
            return sliceBits(this.grid, 18, 2)
        } else {
            for(let i = 0; i < 8; i++) {
                if((this.grid & win_bitmasks[player-1][i]) === win_bitmasks[player-1][i] && 
                   (this.grid & win_bitmasks[player===1?1:0][i]) === 0) {
                    return true
                }
            }
            return false
        }
    }

    getValidIndexes() {
        let validIndexes = []

        for(let i = 0; i < 9; i++) {
            if(this.valueOf(i) === EMPTY) {
                validIndexes.push(i)
            }
        }

        return validIndexes
    }

    getNextValidStates(master, path) {
        let validIndexes

        if(master === undefined && this.nextZone !== null) {
            return this.getChild(this.nextZone).getNextValidStates(this, this.nextZone)
        } else {
            master ||= this
            path ||= []

            if(validIndexes === undefined) {
                validIndexes = this.getValidIndexes()
            }
            let validStates = []
            // path ||= []

            if(this.children !== undefined) {
                for(let index of validIndexes) {
                    validStates = [...validStates, ...this.children[index].getNextValidStates(master, [...path, index])]
                }
            } else {
                for(let index of validIndexes) {
                    let validState = new DynamicMorpion(master)
                    let validPath = [...path, index]

                    validState.play(validPath, validState.player)
                    validState.updateNextZone(validPath)
                    validState.switchPlayers()
                    validStates.push({state: validState, path: validPath})
                }
            }

            return validStates
        }
    }

    simulate() {
        while(this.checkStatus() === 0) {
            this.randomPlay()
        }

        return this.checkStatus()
    }

    getDifference(state, path) {
        path ||= []
        if(this.children !== undefined) {
            for(const [index, child] of this.children.entries()) {
                let difference = child.getDifference(state.children[index], [...path, index])

                if(difference !== undefined) {
                    return difference
                }
            }
        } else {
            for(let i = 0; i < 9; i++) {
                if(this.valueOf(i) !== state.valueOf(i)) {
                    return [...path, i]
                }
            }
        }
    }

    print() {
        let str = ''
        for(let j = 0; j < 3; j ++) {
            for(let i = 0; i < 3; i++) {
                const index = i + j*3
                const value = sliceBits(this.grid, index*2, 2)
                str += (value === 0 ? '_' : (value === 1 ? 'X' : (value === 2 ? '0' : 'D'))) + ' '
            }
            
            str += '\n'
        }

        console.log(str)
    }
}

function s(c=1) {
    for(let i = 0; i < c; i++) {
        k.randomPlay();
    }
    background(BACKGROUND_COLOR);
    k.draw();
}