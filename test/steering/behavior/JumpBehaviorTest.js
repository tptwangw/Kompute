var expect = require('expect.js');
var Kompute = require("../../../build/Kompute");

describe("JumpBehavior", function(){

  it("should initialize", function(){
    var jumpBehavior = new Kompute.JumpBehavior();

    expect(jumpBehavior.result).to.eql(new Kompute.SteerResult());
  });

  it("should not request acceleration if jump is not ready", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    expect(jumpBehavior.compute(steerable).linear).to.eql(new Kompute.Vector3D());
  });

  it("should not request acceleration if jump taken off", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    steerable.isJumpReady = true;
    steerable.isJumpTakenOff = true;

    expect(jumpBehavior.compute(steerable).linear).to.eql(new Kompute.Vector3D());
  });

  it("should not request acceleration if equation time is zero", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    steerable.jumpDescriptor = {
      getEquationResult: function(){
        return {time: 0};
      }
    };

    steerable.isJumpReady = true;

    expect(jumpBehavior.compute(steerable).linear).to.eql(new Kompute.Vector3D());
  });

  it("should take off", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    steerable.maxSpeed = 1000;
    steerable.jumpSpeed = 1000;

    var jumpDescriptor = new Kompute.JumpDescriptor({
      takeoffPosition: new Kompute.Vector3D(10, 0, 10),
      landingPosition: new Kompute.Vector3D(150, 100, 0),
      runupSatisfactionRadius: 50,
      takeoffPositionSatisfactionRadius: 35,
      takeoffVelocitySatisfactionRadius: 10
    });

    var world = new Kompute.World(1000, 1000, 1000, 10);
    world.insertEntity(steerable);
    world.setGravity(-50);

    jumpDescriptor.solveQuadraticEquation(steerable);

    steerable.jumpDescriptor = jumpDescriptor;

    steerable.isJumpReady = true;

    expect(steerable.isJumpTakenOff).to.eql(false);
    var result = jumpBehavior.compute(steerable);
    expect(result.linear).to.eql(new Kompute.Vector3D());
    expect(steerable.isJumpTakenOff).to.eql(true);
    expect(steerable.velocity).to.eql(new Kompute.Vector3D(jumpDescriptor.getEquationResult(steerable).vx, 1000, jumpDescriptor.getEquationResult(steerable).vz));
  });

  it("should match velocity", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    jumpBehavior.steerable = steerable;

    steerable.jumpDescriptor = {
      takeoffPosition: new Kompute.Vector3D(0, 0, 0),
      takeoffVelocitySatisfactionRadius: 0,
      takeoffPositionSatisfactionRadius: 10000,
      getEquationResult: function(){
        return { time: 2, vx: 30, vz: 60 };
      }
    };

    steerable.isJumpReady = true;

    var result = jumpBehavior.compute(steerable);

    expect(result.linear).to.eql(new Kompute.Vector3D(15, 0, 30));
  });
});
