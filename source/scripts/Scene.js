import * as Pixi from "pixi.js"

import Game from "scripts/Game.js"
import Map from "scripts/Map.js"
import Player from "scripts/Player.js"
import {FRAME, STAGE} from "scripts/Constants.js"

export default class Scene extends Pixi.Container {
    constructor() {
        super()

        this.addChild(this.map = new Map())
        this.addChild(this.player = new Player())

        this.map.baddies.forEach((baddie) => {
            this.addChild(baddie)
        })

        // // For debugging just one baddie:
        // this.addChild(this.map.baddies[0])
        // this.player.position.x = 288
        // this.player.position.y = 177

        this.addChild(this.map.raisedLayer)
    }
    addChild(child) {
        super.addChild(child)
        this.children.sort(function(a, b) {
            if(a.stack < b.stack) {
                return -1
            } else if(a.stack > b.stack) {
                return +1
            } else {
                return 0
            }
        })
    }
    update(delta) {
        // mutate delta to do slow-mo during animations
        /*
        if(this.player.ripHeart > 0){
            delta = delta * 0.2
        }
        */

        this.children.forEach((child) => {
            if(child.update instanceof Function) {
                child.update(delta)
            }
        })

        this.moveCamera()
    }
    moveCamera() {
        var targetposition = new Pixi.Point()

        targetposition.x = this.player.position.x - (FRAME.WIDTH * (1/2))
        targetposition.y = this.player.position.y - (FRAME.HEIGHT * (1/2))

        // We're going to move
        // the entire scene in
        // the OPPOSITE direction
        // so as to keep the player
        // in the frame of the camera.
        targetposition.x *= -1
        targetposition.y *= -1

        // Interpolate to that position.
        this.position.x += (targetposition.x - this.position.x) / 10
        this.position.y += (targetposition.y - this.position.y) / 10

        if(this.position.x - targetposition.x < 0.1) {
            this.position.x = targetposition.x
        }
        if(this.position.y - targetposition.y < 0.1) {
            this.position.y = targetposition.y
        }

        this.position.x = Math.round(this.position.x)
        this.position.y = Math.round(this.position.y)
    }
    restartScene() {
        if(this.parent instanceof Game) {
            this.parent.scene = new Scene({
                // pass this the same
                // parameters that were
                // passed into this scene.
            })

            this.parent.addChildAt(this.parent.scene, 0)
            this.parent.removeChild(this)
        }
    }
}
