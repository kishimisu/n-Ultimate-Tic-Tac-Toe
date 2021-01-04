function debug_mc(str, b){
    if(debug_montecarlo) {
        print(str + ' ' + b)
    }
}

class Tree {
    constructor(state) {
        this.root = new Node(state, null)
        this.selection = []
    }
    
    draw(layers) {
        let nodes = []

        for(let i = 0; i < layers; i++) {
            nodes[i] = []
        }
        
        console.log(nodes)
        this.root.prepareForDraw(nodes, null, layers-1)
        let size = 1/3
        let y = 0

        background(255)

        for(let j = layers-1; j >= 0; j--) {
            for(let i = 0; i < nodes[j].length; i++) {
                const x = (width / nodes[j].length) * i
                let node = nodes[j][i]

                node.position = {
                    x: x + game_size*size/2, 
                    y: y + game_size*size
                }

                // node.current.state.drawStretched(x, y, size, size)
                node.current.state.draw(x, y, size)

                if(node.parent) {
                    line(x + game_size*size/2, y, node.parent.position.x, node.parent.position.y)
                }
                textSize(120 * size)
                strokeWeight(size*5)
                text(`${node.current.name} ${node.current.wins}/${node.current.trials}`, node.position.x, node.position.y)
            }

            y += size * game_size * 1.2
            size /= 2
        }
    }
}

class Node {
    constructor(state, parent) {
        this.wins   = 0
        this.losses = 0
        this.draws  = 0
        this.trials = 0

        this.state = state
        this.parent = parent

        if(!this.parent) {
            this.root = true
        }

        debug_mc('add', this.name)
    }

    draw(path, parent, layer) {
        if(parent === undefined) {
            push()
            background(255)
            noFill()
            parent = {x: GRAPH_WIDTH/2,y: 0}
            this.state.draw(GRAPH_WIDTH/2, 0, NODE_SIZE)
            layer = 1
        }

        if(!this.children || this.children.length === 0) {
            return
        }

        this.children.forEach((child, index) => {
            const x = (GRAPH_WIDTH / this.children.length) * index
            const y = layer * NODE_SIZE*2
            child.state.draw(x, y, NODE_SIZE)
            line(parent.x + NODE_SIZE/2, parent.y+NODE_SIZE+NODE_SIZE/3, x+NODE_SIZE/2, y)

            push()
            if(path.length > 0 && path[0] === child) {
                child.draw(path.slice(1), {x, y}, layer+1)
                stroke('red')
                strokeWeight(4)
                rect(x,y,NODE_SIZE,NODE_SIZE)
            }
            if(layer%2==0) {
                fill(color(0, 50))
                noStroke()
                rect(x,y,NODE_SIZE,NODE_SIZE)
            }
            textSize(NODE_SIZE/6)
            stroke(0)
            strokeWeight(1)
            fill(0)
            text(`${child.wins}/${child.trials}`, x+NODE_SIZE/2,y+NODE_SIZE+NODE_SIZE/6)

            pop()
        })
    }

    chooseChild() {
        if(!this.children) {
            this.children = this.getChildren()
        }

        if(this.children.length === 0) {
            debug_mc('simulated this', this.name)
            this.simulate()
        } else {
            let unexplored = []

			for(let child of this.children) {
                if(child.trials === 0) {
                    unexplored.push(child)
                }
            }

            if(unexplored.length > 0) {
                let node = unexplored[floor(random(unexplored.length))]
                debug_mc('simulated unexplored', node.name)
                node.simulate()
            } else {
                let best = {child: null, potential: Number.NEGATIVE_INFINITY}

                for(const child of this.children) {
                    const potential = child.getPotential()

                    if(potential > best.potential) {
                        best.child = child
                        best.potential = potential
                    }
                }

                if(best.child === null) {
                    best.child = this.children[0]
                }
                
                debug_mc('choose child', best.child.name)
                best.child.chooseChild()
            }
        }
    }

    getPotential() {
        let w = this.losses - this.wins
        let n = this.trials
        var c = sqrt(2)
        var t = this.parent.trials

        return w / n  +  c * sqrt(log(t) / n)
    }

    getChildren() {
        const children = []

        // if(!this.state.gameOver) {
        //     for(const atomic of this.state.getPlayableAtomics()) {
        //         let child = _.cloneDeep(this.state)
        //         child.playPath(atomic.getPathArray())
        //         let newNode = new Node(child, this)
                
        //         if(this.root) {
        //             newNode.move = atomic.getPathArray()
        //         }

        //         children.push(newNode)
        //     }
        // }

        if(this.state.checkStatus() === 0) {
            for(let tuple of this.state.getNextValidStates()) {
                let newNode = new Node(tuple.state, this)

                if(this.root) {
                    newNode.path = tuple.path
                }

                children.push(newNode)
            }
        }

        return children
    }

    simulate() {
        let stateSim

        if(game_version === 'slow') {
            throw new Error("Not implemented!")
        } else if(game_version === 'fast') {
            stateSim = new MainBoard(this.state)
        } else if(game_version === 'dynamic') {
            stateSim = new DynamicMorpion(this.state)
        }
        this.backPropagate(stateSim.simulate())

        // let stateSim = _.cloneDeep(this.state)

        // while (!stateSim.gameOver) {
        //     // stateSim.print()
        //     stateSim.playRandomValidAtomic()
        // } 
        // // stateSim.print()
        // // console.log("###END###")
        // this.backPropagate(stateSim.value)
    }

    backPropagate(result) {
        if(result === this.state.player) {
            this.wins += 1
        } else if (result !== this.state.player && result !== 3) {
            this.losses += 1
        } else if (result === 3) {
            // this.wins += 0.5
            // this.losses += 0.5
            this.draws++
        }

        this.trials++

        if(this.parent) {
            this.parent.backPropagate(result)
        }
    }

    prepareForDraw(arr, parent, layer) {
        arr[layer].push({current: this, parent: parent})

        if(this.children && layer > 0) {
            for(let child of this.children) {
                if(child.trials > 0 || child.state.checkStatus() !== 0) {
                    child.prepareForDraw(arr, arr[layer][arr[layer].length-1], layer - 1)
                }
            }
        }
    }

    getClickedNode(x, selection) {
        if(selection.length === 0) {
            const w = GRAPH_WIDTH / this.children.length

            if(x%(w)<NODE_SIZE) {
                return this.children[floor(x/w)]
            } else {
                return null
            }
        } else {
            let child = this.children.find(child => child === selection[0])

            return child.getClickedNode(x, selection.slice(1))
        }
    }
}

let t 
function nextTree(layers = 5, simulation = 1) {
    if(t === undefined) {
        t = new Tree(b)
    }

    for(let i = 0; i < simulation; i++) {
        t.root.chooseChild()
    } 

    t.draw(layers)
}
