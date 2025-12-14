using MachineEmulator;

namespace MachineEmulator.Tests;

public class CarTests
{
    [Fact]
    public void Car_Starts_And_Stops()
    {
        var car = new Car();
        car.Start();
        Assert.True(car.IsRunning);
        car.Stop();
        Assert.False(car.IsRunning);
    }

    [Fact]
    public void Car_Consumes_Gas_When_Driving()
    {
        var car = new Car(10);
        car.Start();
        car.Drive(5);
        Assert.True(car.Gas < 10);
    }

    [Fact]
    public void Car_Throws_When_Not_Enough_Gas()
    {
        var car = new Car(0.1);
        car.Start();
        Assert.Throws<InvalidOperationException>(() => car.Drive(10));
    }

    [Fact]
    public void Car_Can_Be_Refueled()
    {
        var car = new Car(0);
        car.Refuel(20);
        Assert.Equal(20, car.Gas);
    }

    [Fact]
    public void Car_Turn_And_Brake_Does_Not_Throw()
    {
        var car = new Car();
        car.Turn("left");
        car.Turn("right");
        car.Brake();
    }
}
