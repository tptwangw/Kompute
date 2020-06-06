import { SteeringBehavior } from "./SteeringBehavior";
import { VectorPool } from "../../core/VectorPool";
import { logger } from "../../debug/Logger";

var vectorPool = new VectorPool(10);

var LOGGER_COMPONENT_NAME = "ArriveBehavior";
var LOG_ARRIVED = "Arrived.";
var LOG_SLOWING_DOWN = "Slowing down.";
var LOG_NO_TARGET_POSITION = "Steerable has no target position.";

var ArriveBehavior = function(options){
  SteeringBehavior.call(this);

  this.satisfactionRadius = options.satisfactionRadius;
  this.slowDownRadius = options.slowDownRadius;
}

ArriveBehavior.prototype = Object.create(SteeringBehavior.prototype);

ArriveBehavior.prototype.compute = function(steerable){

  this.result.linear.set(0, 0, 0);

  if (!steerable.hasTargetPosition){
    logger.log(LOGGER_COMPONENT_NAME, LOG_NO_TARGET_POSITION);
    return this.result;
  }

  var toTarget = vectorPool.get().copy(steerable.targetPosition).sub(steerable.position);
  var distance = toTarget.getLength();

  var targetVelocity = vectorPool.get().set(0, 0, 0);

  if (distance <= this.satisfactionRadius){
    logger.log(LOGGER_COMPONENT_NAME, LOG_ARRIVED);
    return this.result;
  }else{
    targetVelocity.copy(toTarget).normalize().multiplyScalar(steerable.maxSpeed);
  }

  if (distance <= this.slowDownRadius){
    logger.log(LOGGER_COMPONENT_NAME, LOG_SLOWING_DOWN);
    targetVelocity.multiplyScalar(distance / this.slowDownRadius);
  }

  this.result.linear.copy(targetVelocity).sub(steerable.velocity);

  return this.result;
}

Object.defineProperty(ArriveBehavior.prototype, 'constructor', { value: ArriveBehavior,  enumerable: false, writable: true });
export { ArriveBehavior };
