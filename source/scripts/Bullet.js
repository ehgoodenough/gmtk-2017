import * as Pixi from "pixi.js"
Pixi.settings.SCALE_MODE = Pixi.SCALE_MODES.NEAREST

const FRICTION = 0.9
const GRAB_DISTANCE = 15
const HARM_RADIUS = 20
const GRAVITATE_DISTANCE = 40
const HOOVER_SPEED = 3

const SHOOT_SOUND = new Audio(require("sounds/shoot.wav"))
const GRAB_SOUND = new Audio(require("sounds/pickup.wav"))
const HURT_SOUND = new Audio(require("sounds/hit.wav"))

const HEART_TEXTURE = Pixi.Texture.from(require("images/heart.png"))
const HEART_COLOR = 0xF86795
const HEART_SLOWDOWN_DISTANCE = 100

import {getDistance,getVectorLength} from "scripts/Geometry.js"
import Jukebox from "scripts/Jukebox.js"
import Baddie from "scripts/Baddie.js"

export default class Bullet extends Pixi.Sprite {
    constructor(protobullet) {
        super(HEART_TEXTURE)

        this.position.x = protobullet.position.x
        this.position.y = protobullet.position.y

        this.anchor.x = 0.5
        this.anchor.y = 0.5

        this.direction = protobullet.direction || 0
        this.distance = protobullet.distance || 0

        this.speed = protobullet.speed || 5

        this.rotation = (protobullet.direction - Math.PI/2) || 0 //Math.PI * 2 * Math.random()
        this.spinaway = 50+Math.random()*50

        this.tint = 0x0FFB5CD
        this.power = protobullet.power || false
        if(this.power){
            this.tint = 0x942F4F
            this.spinaway = 100
            this.harm = 3
            this.scale.x = 1.5
            this.scale.y = 1.5
        }

        // The duration of time
        // that this bullet has
        // been alive, in ms.
        this.time = 0

        SHOOT_SOUND.volume = 0.1
        SHOOT_SOUND.currentTime = 0
        SHOOT_SOUND.playbackRate = Math.random() * 0.5 + 0.5
        SHOOT_SOUND.play()

        this.velocity = new Pixi.Point()
        this.velocity.r = 0
    }
    update(delta) {
        this.time += delta.ms

        if(this.speed > 0) {
            this.move(delta)
            this.collideWithBaddies()
        } else {
            this.pulse(delta)
            this.gravitateTowardsPlayer()
        }

        this.position.x += this.velocity.x * delta.f || 0
        this.position.y += this.velocity.y * delta.f || 0
        this.rotation += this.velocity.r * delta.f || 0

        /*

        this.velocity.x *= FRICTION
        if(this.velocity.x <= 0.05) {
            this.velocity.x = 0
        }

        this.velocity.y *= FRICTION
        if(this.velocity.y <= 0.05) {
            this.velocity.y = 0
        }

        */
        this.velocity.r *= FRICTION
        if(this.velocity.r <= 0.0005) {
            this.velocity.r = 0
        }
    }
    move(delta) {
        // After a bullet has
        // passed a given distance,
        // we begin to slow it down.
        if(this.speed > 0) {
            if(this.distance >= HEART_SLOWDOWN_DISTANCE) {
                this.speed *= FRICTION
            }
        }

        // Since speed would
        // otherwise approach
        // zero but never reach
        // it, we help it along.
        if(this.speed <= 0.1) {
            this.speed = 0
        }

        this.distance += this.speed * delta.f

        //this.velocity.r += (Math.PI/180) * (-1+Math.random()*2)

        this.velocity.x = Math.cos(this.direction) * this.speed
        this.velocity.y = Math.sin(this.direction) * this.speed
        if(this.distance > this.spinaway){
            this.velocity.r = (Math.PI / 32) * this.speed
        }

        if(this.parent && this.parent.map) {
            this.parent.map.handlePotentialCollisions(this.position, this.velocity)
        }
    }
    collideWithBaddies() {
        if(this.parent != undefined) {
            this.parent.children.forEach((child) => {
                if(child instanceof Baddie) {
                    if(child.hearts > 0) {
                        if(getDistance(child.position, this.position) < HARM_RADIUS) {
                            child.loseHeart(this.harm)
                            HURT_SOUND.currentTime = 0
                            HURT_SOUND.volume = 0.1
                            HURT_SOUND.play()

                            if(child.isDead != true) {
                                this.velocity.x = 0
                                this.velocity.y = 0
                                this.speed = 0
                            }
                        }
                    }
                }
            })
        }
    }
    pulse(delta) {
        this.tint = HEART_COLOR
        // TODO: https://github.com/ehgoodenough/gmtk-2017/issues/3

        if(!!Jukebox.currentMusic) {
            var scale = this.getMusicalPulse(Jukebox.currentMusic.currentTime * 1000 % 2000)
            this.scale.x = scale
            this.scale.y = scale
        }
    }
    getMusicalPulse(time) {
        return 1 - (time <= 500 ? 0.2 * Math.sin(time * (6.283/500)) : 0)
    }
    gravitateTowardsPlayer() {
        if(this.parent != undefined
        && this.parent.player != undefined) {
            var distance = getDistance(this.position, this.parent.player.position)

            if(distance < GRAVITATE_DISTANCE) {
                // Get the offset vector and normalize it into a unit vector
                var movement = {x: this.parent.player.position.x - this.position.x, y: this.parent.player.position.y - this.position.y}
                var norm = getVectorLength(movement.x, movement.y)
                if(norm > 0) {
                    movement.x /= norm
                    movement.y /= norm
                }
                // Move towards the player
                this.velocity.x = movement.x * HOOVER_SPEED
                this.velocity.y = movement.y * HOOVER_SPEED
            }

            if(distance < GRAB_DISTANCE) {
                this.parent.player.gainHeart()
                this.parent.removeChild(this)

                GRAB_SOUND.currentTime = 0
                GRAB_SOUND.volume = 0.1
                GRAB_SOUND.play()
            }
        }
    }
    get stack() {
        return -1
    }
}
