import '../css/style.scss';

function animate(render) {
    let startTime = null;
    let prevTime = null;
    requestAnimationFrame(function drawFrame(time) {
        if (!startTime) {
            startTime = time;
        }
        if (!prevTime) {
            prevTime = time;
        }
        const elapsed = time - startTime;
        const deltaT = time - prevTime;
        prevTime = time;
        const schedule = render.call(null, elapsed, deltaT);
        if (schedule) {
            requestAnimationFrame(drawFrame);
        }
    });
}

function easeOut(fx) {
    return x => 1 - fx(1 - x);
}

class BallTracker {
    // The ball falls vertically and bounces until it stops.
    constructor() {
        this.xStart = 0; // starting position
        this.vStart = 0; // starting speend. -1 - towards the ground, +1 - aways from the ground
        this.acceleration = -9.825; // Helsinki, m/s^2
        this.collisitionSpeedLossCoef = 0.6;
        this.stopped = false;
    }

    setPosition(xStart, vStart) {
        if (xStart < 0) {
            throw new Error('cannot put the object bellow the ground');
        }
        this.xStart = xStart;
        this.vStart = vStart;
        this.stopped = false;
    }

    calcNextPosition(deltaT) {
        if (this.stopped) {
            return this.xStart;
        }

        const vNext = this.vStart + this.acceleration * deltaT;
        const xNext = this.xStart + deltaT * (this.vStart + vNext) / 2;

        if (xNext === 0) {
            this.xStart = 0;
            this.vStart = -vNext * this.collisitionSpeedLossCoef;
        } else if (xNext < 0) {
            // calculate speed at the ground level
            const groundHitTime = this.findTimeWhenItHitsGround();
            if (groundHitTime === null) {
                this.stopped = true;
                return this.xStart;
            }
            this.xStart = 0;
            this.vStart = -(this.vStart + this.acceleration * groundHitTime) * this.collisitionSpeedLossCoef;
            return this.calcNextPosition(deltaT - groundHitTime);
        } else {
            this.xStart = xNext;
            this.vStart = vNext;
        }

        return this.xStart;
    }

    findTimeWhenItHitsGround() {
        // Using the discriminant formula for a quadratic equation ax^2 + bx + c = 0
        const a = this.acceleration / 2;
        const b = this.vStart;
        const c = this.xStart;
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            // something is wrong. Cannot find out when the object hits the ground.
            return null;
        } else if (discriminant === 0) {
            return -b / (2 * a);
        } else {
            const discSquareRoot = Math.sqrt(discriminant);
            const solution1 = (-b + discSquareRoot) / (2 * a);
            const solution2 = (-b - discSquareRoot) / (2 * a);
            if (solution1 > 0 && solution2 > 0) {
                // Cannot determine the time of hitting the ground because there are two possibilities.
                return null;
            }
            return solution1 > 0 ? solution1 : solution2;
        }
    }
}

class PhysicalViewport {
    // Physical viewport is the first quadrant of conventional coordinates. So,
    // (x,y)==(0,0) is at the bottom left corner.
    // Virtual viewport is a conventional css coordinate system. So,
    // (x,y)==(0,0) is at the top left corner.
    constructor(widthM, heightM, pixelsPerMeter) {
        this.widthM = widthM;
        this.heightM = heightM;
        this.pixelsPerMeter = pixelsPerMeter;

        this.widthVirtual = Math.round(this.widthM * this.pixelsPerMeter);
        this.heightVirtual = Math.round(this.heightM * this.pixelsPerMeter);
    }

    getVirtualViewport() {
        return {
            width: this.widthVirtual,
            height: this.heightVirtual
        };
    }

    meterXToPixel(x) {
        if (x < 0 || x > this.widthM) {
            throw new Error('x is out of bounds');
        }
        return Math.round((x / this.widthM) * this.widthVirtual);
    }

    meterYToPixel(y) {
        if (y < 0 || y > this.heightM) {
            throw new Error('y is out of bounds');
        }
        const flippedY = this.heightM - y;
        return Math.round((flippedY / this.heightM) * this.heightVirtual);
    }
}

const field = document.querySelector('.field');
const physicalViewport = new PhysicalViewport(10, 10, 40);
field.style.width = physicalViewport.getVirtualViewport().width + 'px';
field.style.height = physicalViewport.getVirtualViewport().height + 'px';

const ball = document.querySelector('.ball');
const ballTracker = new BallTracker();

const renderBall = (elapsed, deltaT) => {
    const nextPosM = ballTracker.calcNextPosition(deltaT / 1000);
    const nextPosPx = physicalViewport.meterYToPixel(nextPosM);
    ball.style.top = nextPosPx + 'px';

    return !ballTracker.stopped;
};

ballTracker.setPosition(8, 5);
renderBall(0, 0);

ball.addEventListener('click', e => {
    ballTracker.setPosition(8, 5);
    renderBall(0, 0);

    animate(renderBall);
});
