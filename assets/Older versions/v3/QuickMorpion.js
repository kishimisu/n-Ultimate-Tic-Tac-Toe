class MainBoard {
    constructor(copy_from) {
        this.grid = []

        if(copy_from instanceof MainBoard) {
            this.player = copy_from.player
            this.nextZone = copy_from.nextZone

            for(let i = 0; i < 9; i++) {
                this.grid.push(new Board(copy_from.grid[i]))
            }
        } else {
            this.player = 1
            this.nextZone = null

            for(let i = 0; i < 9; i++) {
                this.grid.push(new Board())
            }
        }
    }

    draw(x, y, w) {
        const thirdGameSize = game_size / 3
        const ninthGameSize = game_size / 9
        push()
        if(x!==undefined) {
            console.log(x,y,w)
            translate(x,y)
            scale(w)
        }
        strokeWeight(1)

        for(let j = 0; j < 3; j++) {
            for(let i = 0; i < 3; i++) {
                const masterIndex = j*3 + i

                for(let y = 0; y < 3; y++) {
                    for(let x = 0; x < 3; x++) {
                        const startX = thirdGameSize * i + ninthGameSize * x
                        const startY = thirdGameSize * j + ninthGameSize * y
                        const atomicIndex = y*3 + x
                        const value = this.grid[masterIndex].valueOf(atomicIndex)

                        push()
                        if(value === 1) {
                            fill('red')
                            rect(startX, startY, ninthGameSize, ninthGameSize)
                            stroke(0)
                            strokeWeight(2)
                            line(startX+ninthGameSize*0.1, startY+ninthGameSize*0.1, startX+ninthGameSize*0.9, startY+ninthGameSize*0.9)
                            line(startX+ninthGameSize*0.9, startY+ninthGameSize*0.1, startX+ninthGameSize*0.1, startY+ninthGameSize*0.9)
      
                        } else if(value === 2) {
                            fill('blue')
                            rect(startX, startY, ninthGameSize, ninthGameSize)
                            strokeWeight(2)
                            stroke(0)
                            ellipse(startX+ninthGameSize/2, startY+ninthGameSize/2, ninthGameSize*0.9)
                        } else {
                            fill('white')
                            rect(startX, startY, ninthGameSize, ninthGameSize)
                        }
                        pop()
                    }
                }

                push()
                strokeWeight(5)
                if(masterIndex === this.nextZone) {
                    fill('#00ff0040')
                    rect(thirdGameSize * i, thirdGameSize * j, thirdGameSize, thirdGameSize)
                } else if(this.grid[masterIndex].isFinished()) {
                    if(this.grid[masterIndex].checkStatus(PLAYER_X)) {
                        fill('#ff000080')
                        rect(thirdGameSize * i, thirdGameSize * j, thirdGameSize, thirdGameSize)
                        line(thirdGameSize*i+thirdGameSize*0.1, thirdGameSize*j+thirdGameSize*0.1, thirdGameSize*(i+1)-thirdGameSize*0.1, thirdGameSize*(j+1)-thirdGameSize*0.1)
                        line(thirdGameSize*(i+1)-thirdGameSize*0.1, thirdGameSize*j+thirdGameSize*0.1, thirdGameSize*i+thirdGameSize*0.1, thirdGameSize*(j+1)-thirdGameSize*0.1)
      
                    } else if(this.grid[masterIndex].checkStatus(PLAYER_O)) {
                        fill('#0000ff80')
                        rect(thirdGameSize * i, thirdGameSize * j, thirdGameSize, thirdGameSize)
                        ellipse(thirdGameSize * i +thirdGameSize/2, thirdGameSize * j +thirdGameSize/2, thirdGameSize*0.9)
                    } else {
                        fill('#000000a0')
                        rect(thirdGameSize * i, thirdGameSize * j, thirdGameSize, thirdGameSize)
                    }
                } else {
                    noFill()
                    rect(thirdGameSize * i, thirdGameSize * j, thirdGameSize, thirdGameSize)
                }

                pop()
            }
        }
        pop()
    }

    switchPlayers() {
        this.player++

        if(this.player > 2) {
            this.player = 1
        }
    }

    randomPlay() {
        if(this.nextZone === null) {
            const validZones = this.getValidZones()
            if(validZones.length===0){print(this)}
            this.nextZone = validZones[floor(random(validZones.length))]
        }

        const validIndexes = this.grid[this.nextZone].getValidIndexes()
        const randomIndex = validIndexes[floor(random(validIndexes.length))]
       
        return this.play(this.nextZone, randomIndex)
    }

    play(i1, i2) {
        const value = this.grid[i1].playCase(i2, this.player)
        this.nextZone = i2

        if(this.grid[this.nextZone].isFinished()) {
            this.nextZone = null
        }
        if(value !== 0) {
            const status = this.checkStatus()
            
            if(status !== 0) {
                return status
            }
        }

        this.switchPlayers()
        return 0
    }

    getValidZones() {
        let validZones = []

        for(let i = 0; i < 9; i++) {
            if(this.grid[i].isFinished() === 0) {
                validZones.push(i)
            }
        }

        return validZones
    }

    checkStatus() {
        let bits = 0
        let finishedCount = 0

        for(let i = 0; i < 9; i++) {
            let value = this.grid[i].isFinished()
            
            if(value !== 0) {
                value <<= (2*i)
                bits |= value
                finishedCount++
            }
        }
        
        let i = 0
        for(let mask of win_bitmasks[this.player-1]) {
            if((bits & mask) === mask && (bits & win_bitmasks[this.player===1?1:0][i]) === 0) {
                return this.player
            }
            i++
        }

        if(finishedCount === 9) {
            return -1
        }

        return 0
    }

    simulate() {
        let gameOver = this.checkStatus()

        while(gameOver === 0) {
            gameOver = this.randomPlay()
        }

        return gameOver
    }

    getNextValidStates() {
        let states = []

        const pushValidMoves = (zoneIndex) => {
            for(let index of this.grid[zoneIndex].getValidIndexes()) {
                let copyBoard = new MainBoard(this)
                copyBoard.play(zoneIndex, index)
                states.push({state: copyBoard, path: [zoneIndex, index]})
            }
        }

        if(this.nextZone === null) {
            for(let zoneIndex of this.getValidZones()) {
                pushValidMoves(zoneIndex)
            }
        } else {
            pushValidMoves(this.nextZone)
        }
        
        return states
    }
}

class Board {
    constructor(copy_from) {
        if(copy_from instanceof Board) {
            this.grid = copy_from.grid
        } else {
            this.grid = 0
        }
    }

    playCase(i, player) {
        if(player === PLAYER_X) {
            this.grid = setBit(this.grid, i*2)
        } else {
            this.grid = setBit(this.grid, i*2+1)
        }

        if(this.checkStatus(player)) {
            this.grid = setBit(this.grid, player === PLAYER_X ? 18 : 19)

            return 1
        } else {
            let currentCount = sliceBits(this.grid, 20, 4) + 1 // Read 4 bits containing the count and increment it

            if(currentCount === 9) {
                this.grid |= 0xc0000

                return 3
            }

            currentCount <<= 20 // Add 20 '0' to the right of the count
            this.grid &= 0x7ffff // Only keep the 20 first bits of the grid
            this.grid |= currentCount // Mix the grid mask with the count mask
        }

        return 0
    }

    valueOf(i) {
        return sliceBits(this.grid, i*2, 2)
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

    checkStatus(player) {
        for(let mask of win_bitmasks[player-1]) {
            if((this.grid & mask) === mask) {
                return true
            }
        }

        return false
    }

    isFinished() {
        return sliceBits(this.grid, 18, 2)
    }

    print() {
        let str = ''
        for(let j = 0; j < 3; j ++) {
            for(let i = 0; i < 3; i++) {
                const index = i + j*3
                const value = sliceBits(this.grid, index*2, 2)
                str += (value === 0 ? '_' : (value === 1 ? 'X' : '0')) + ' '
            }
            
            str += '\n'
        }

        console.log(str)
    }
}