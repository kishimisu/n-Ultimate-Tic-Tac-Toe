function Morpion(layer, index = 0, parent) {
    this.atomic = (layer === 0) // last layer
    this.master = (parent === undefined) // first layer
    this.parent = parent // parent morpion (if not master layer)

    this.layer = layer // layer value (0 -> max layer) / (atomic layer -> master layer)
    this.index = index // index in parent (0-9)
    this.value = 0 // current value (0: unclaimed, 1/2: player)
    this.win_cases = []

    // If not in atomic layer
    if (!this.atomic) {
        this.grid = []

        // Create and populate grid with 9 Morpion child objects
        for(let i in [...Array(9).keys()]) {
            this.grid.push(new Morpion(layer - 1, Number(i), this))
        }
    } else {
        atomics.push(this) // Reference this case as atomic
    }

    // Draws a morpion and all its childs recursively
    this.draw = function() {
        /// RECURSIVE PART ///
        if(!this.atomic) { // If not in atomic layer
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

        /// DRAWING PART ///
        if(!this.master) { // If not in master layer
            // Calculate background alpha value
            const alpha = this.parent.win_cases.length > 0 && this.parent.win_cases.includes(this.index) ? 140 : 40
            
            // Calculate background color
            if(this.value === 1) {
                fill(255, 0, 0, alpha) // player "red"
            } else if(this.value === 2) {
                fill(0, 0, 255, alpha) // player "blue"
            } else if(this.value === 3) {
                fill(255, 255, 0, alpha)
            } else if (this.value === -1) { // Draw game.
                this.parent.master === false ?
                    fill(0, 0, 0, 140)
                :
                    fill(255, 255, 255, 160)
                //fill(0, 0, 0, (this.parent.master === false) ? 140 : 180 )
            } else { // no player
                const index = this.parent ? this.parent.index : 0

                if(!this.atomic && gray_checker && (this.index%2===0 && index%2===0 || this.index%2===1 && index%2===1)) {
                    fill(0, 0, 0, 40) // grey case
                } else {
                    noFill() // white case
                }
            }
    
            strokeWeight(12)
            rect(0,0,width-1,height-1) // fill with background color

            // Playable zone
            if(layer === 1 && last_zone && this.getPath() === last_zone) {
                if(this.value !== 0) {
                    last_zone = null
                } else {
                    fill(100,255,100,100)
                    rect(0,0,width-1,height-1) // fill with background color
                }
            }

            strokeWeight(25)

            if(this.value === 0 && show_numbers) { // Draw number (if enabled)
                fill(0)
                text(this.index, width/2,height/2)
            } else if(draw_shapes) {
                if(this.value === 1) { // Draw cross
                    line(width*0.05, height*0.05, width*0.95, height*0.95)
                    line(width*0.95, height*0.05, width*0.05, height*0.95)
                } else if(this.value === 2) { // Draw circle
                    noFill()
                    ellipse(width/2, height/2, width*0.9)
                } else if(this.value === 3) {
                    triangle(width/2,height*0.05,width*0.05,height*0.95,width*0.95,height*0.95)
                }
            }
        }

        if(this.master && last_zone === null) {
            fill(100,255,100,100)
            rect(0,0,width-1,height-1) // fill with background color
        }
    }

    // Clicks on an atomic case, return 1 if the move if valid, 0 otherwise
    this.click = function() {
        if(this.value === 0) {
            const path = this.getPath()

            if(last_zone !== null) {
                if(path.slice(0, -5) !== last_zone) {
                    return 0
                }
            }

            this.value = player
            last_zone = path.slice(5)
            this.debugPath("clicked")

            this.parent.update()
            return 1
        } else {
            return 0
        }
    }

    // Recursively detect which atomic case is clicked. Return 1 if the case is valid, 0 otherwise
    this.isClicked = function(x_start, y_start, offset) {
        if(this.value !== 0) {
            return 0
        }

        if(this.atomic) {
            if(mouseX > x_start && mouseX < x_start + offset && 
               mouseY > y_start && mouseY < y_start + offset) {

                return this.click()
            }
        } else {
            offset /= 3

            for(let y = 0; y < 3; y++) {
                for(let x = 0; x < 3; x++) {
                    const index = y*3 + x
                    if(this.grid[index].isClicked(x_start + x * offset, y_start + y * offset, offset) === 1) {
                        return 1
                    }
                }
            }
        }

        return 0
    }

    // Recursively checks for win conditions and updates parents objects
    this.update = function() {
        const win_checks = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ]
        
        for(let win_check of win_checks) {
            const winner = this.checkWin(win_check)

            if(winner !== 0) {
                this.value = winner
                this.win_cases = win_check
                this.debugPath("updated: " + this.value)

                if(autoplay) {
                    this.removeFromAtomicsCollection()
                }

                if(this.master) {
                    gameOver(winner)
                } else {
                    this.parent.update()
                }

                return
            }
        }

        if(this.getEmptyCases() === 0 && !this.master) {
            this.value = -1

            this.debugPath("updated: " + this.value)
            
            this.parent.update()
        }
    }

    // Check if three cases are in win condition
    this.checkWin = function(check) {
        const [a, b, c] = check

        if (this.grid[a].value > 0 &&
            this.grid[a].value === this.grid[b].value && 
            this.grid[a].value === this.grid[c].value) {
            return this.grid[a].value
        } else {
            return 0
        }
    }

    // Remove a case from atomic collection recursively (used when automatic mode is playing)
    this.removeFromAtomicsCollection = function() {
        if(this.atomic) {
            const index_in_collection = atomics.indexOf(this)

            if(index_in_collection !== -1) {
                this.debugPath("removed")
                atomics.splice(index_in_collection, 1)
            }
        } else {
            for(let child of this.grid) {
                child.removeFromAtomicsCollection()
            }
        }
    }

    // Return an array of indexes representing playables cases from a path (last_zone)
    this.getPlayables = function(path) {
        if(layer === 1) {
            const playables = []

            for(let atomic of this.grid) {
                if(atomic.value === 0) {
                    playables.push(atomics.indexOf(atomic))
                }
            }

            return playables
        } else {
            const index = Number(path[0])

            if(this.grid[index].value !== 0 || this.getEmptyCases() === 0) {
                return null
            } else {
                return this.grid[index].getPlayables(path.slice(5))
            }
        }
    }

    // Returns the number of playable cases
    this.getEmptyCases = function() {
        let count = 0

        for(let element of this.grid) {
            if(element.value === 0) {
                count++
            }
        }

        return count
    }

    // prints the path along with the debug message if debug mode is enabled
    this.debugPath = function(action) {
        if(debug_logs) {
            print(this.getPath() + ': ' + action)
        }
    }

    // Gets path from each parent until the master layer as a string
    this.getPath = function() {
        return this.parent ? (this.parent.master ? this.index : (parent.getPath() + ' -> ' + this.index)) : 'master'
    }

    // this.getPathArray = function() {
    //     if(!this.parent.master) {
    //         return [...this.parent.getPathArray(), this.index]
    //     } else {
    //         return [this.index]
    //     }
    // }
}