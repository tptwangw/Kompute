var expect = require('expect.js');
var Kompute = require("../../../build/Kompute");

describe("JumpBehavior", function(){

  it("should initialize", function(){

    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    steerable.setJumpBehavior(jumpBehavior);

    expect(jumpBehavior.result).to.eql(new Kompute.SteerResult());
    expect(jumpBehavior.steerable).to.equal(steerable);
  });

  it("should not request acceleration if jump is not ready", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    steerable.setJumpBehavior(jumpBehavior);

    expect(jumpBehavior.compute().linear).to.eql(new Kompute.Vector3D());
  });

  it("should not request acceleration if jump taken off", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    steerable.setJumpBehavior(jumpBehavior);

    steerable.isJumpReady = true;
    steerable.isJumpTakenOff = true;

    expect(jumpBehavior.compute().linear).to.eql(new Kompute.Vector3D());
  });

  it("should not request acceleration if equation time is zero", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    steerable.setJumpBehavior(jumpBehavior);
    steerable.jumpDescriptor = {equationResult: {time: 0}};

    steerable.isJumpReady = true;

    expect(jumpBehavior.compute().linear).to.eql(new Kompute.Vector3D());
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

    steerable.setJumpBehavior(jumpBehavior);
    steerable.jumpDescriptor = jumpDescriptor;

    steerable.isJumpReady = true;

    expect(steerable.isJumpTakenOff).to.eql(false);
    var result = jumpBehavior.compute();
    expect(result.linear).to.eql(new Kompute.Vector3D());
    expect(steerable.isJumpTakenOff).to.eql(true);
    expect(steerable.velocity).to.eql(new Kompute.Vector3D(jumpDescriptor.equationResult.vx, 1000, jumpDescriptor.equationResult.vz));
  });

  it("should match velocity", function(){
    var steerable = new Kompute.Steerable("steerable1", new Kompute.Vector3D(), new Kompute.Vector3D(10, 10, 10));
    var jumpBehavior = new Kompute.JumpBehavior();

    jumpBehavior.steerable = steerable;

    steerable.jumpDescriptor = {
      takeoffPosition: new Kompute.Vector3D(0, 0, 0),
      takeoffVelocitySatisfactionRadius: 0,
      takeoffPositionSatisfactionRadius: 10000,
      equationResult: {
        time: 2,
        vx: 30,
        vz: 60
      }
    };

    steerable.isJumpReady = true;

    var result = jumpBehavior.compute();

    expect(result.linear).to.eql(new Kompute.Vector3D(15, 0, 30));
  });
});