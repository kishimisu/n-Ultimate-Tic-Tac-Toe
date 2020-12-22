const debug_logs = true

let m = new Morpion(4)

function setup() {
    createCanvas(500, 500)
    background(255)
    textAlign(CENTER, CENTER)
    textSize(200)
    strokeWeight(4)
    noFill()
    stroke(0)
    // noLoop()
}

let speed = 20
function draw() {
    background(255)
    for(let i = 0; i < speed;i++) {
        if(m.value!==0 || m.atomics.length===0) {
            m.draw()
            return
        }
    m.playRandomValidAtomic(pl)
    pl=pl===1?2:1
    }
    m.draw()
}

let pl = 1
function mouseClicked() {
    // m.playRandomValidAtomic(pl)
    // pl=pl===1?2:1
    // redraw()
    // if(mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    //     return
    // }

    // let x2 = floor(map(mouseX, 0, width, 0, 27))%3
    // let y2 = floor(map(mouseY, 0, height, 0, 27))%3
    // let x1 = floor(map(mouseX, 0, width, 0, 9))%3
    // let y1 = floor(map(mouseY, 0, height, 0, 9))%3
    // let x0 = floor(map(mouseX, 0, width, 0, 3))
    // let y0 = floor(map(mouseY, 0, height, 0, 3))

    // const path = [x0+y0*3,x1+y1*3,x2+y2*3]
    // console.log(path)

    //     m.playPath(path, pl)
    //     pl=pl===1?2:1
}