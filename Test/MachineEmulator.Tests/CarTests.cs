using MachineEmulator;

namespace MachineEmulator.Tests;

public class CarTests
{
    [Fact]
    public void Car_Starts_And_Stops()
    {
        ICar car = new Car();
        car.Start();
        Assert.True(car.IsRunning);
        car.Stop();
        Assert.False(car.IsRunning);
    }

    [Fact]
    public void Car_Consumes_Gas_When_Driving()
    {
        ICar car = new Car(10);
        car.Start();
        car.Drive(5);
        Assert.True(car.Gas < 10);
    }

    [Fact]
    public void Car_Throws_When_Not_Enough_Gas()
    {
        ICar car = new Car(0.1);
        car.Start();
        Assert.Throws<InvalidOperationException>(() => car.Drive(10));
    }

    [Fact]
    public void Car_Can_Be_Refueled()
    {
        ICar car = new Car(0);
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

    [Fact]
    public void Car_Implements_IVehicle()
    {
        IVehicle vehicle = new Car();
        Assert.NotNull(vehicle);
        Assert.IsAssignableFrom<IVehicle>(vehicle);
    }
}

public class MotorcycleTests
{
    [Fact]
    public void Motorcycle_Starts_And_Stops()
    {
        IMotorcycle motorcycle = new Motorcycle();
        motorcycle.Start();
        Assert.True(motorcycle.IsRunning);
        motorcycle.Stop();
        Assert.False(motorcycle.IsRunning);
    }

    [Fact]
    public void Motorcycle_Consumes_Gas_When_Driving()
    {
        IMotorcycle motorcycle = new Motorcycle(10);
        motorcycle.Start();
        motorcycle.Drive(5);
        Assert.True(motorcycle.Gas < 10);
    }

    [Fact]
    public void Motorcycle_Throws_When_Not_Enough_Gas()
    {
        IMotorcycle motorcycle = new Motorcycle(0.1);
        motorcycle.Start();
        Assert.Throws<InvalidOperationException>(() => motorcycle.Drive(10));
    }

    [Fact]
    public void Motorcycle_Can_Be_Refueled()
    {
        IMotorcycle motorcycle = new Motorcycle(0);
        motorcycle.Refuel(20);
        Assert.Equal(20, motorcycle.Gas);
    }

    [Fact]
    public void Motorcycle_Wheelie_Does_Not_Throw()
    {
        var motorcycle = new Motorcycle();
        motorcycle.Wheelie();
    }

    [Fact]
    public void Motorcycle_Implements_IVehicle()
    {
        IVehicle vehicle = new Motorcycle();
        Assert.NotNull(vehicle);
        Assert.IsAssignableFrom<IVehicle>(vehicle);
    }

    [Fact]
    public void Motorcycle_Is_More_Fuel_Efficient_Than_Car()
    {
        var car = new Car(100);
        var motorcycle = new Motorcycle(100);

        car.Start();
        motorcycle.Start();

        car.Drive(10);
        motorcycle.Drive(10);

        // Motorcycle should have more gas remaining (more fuel efficient)
        Assert.True(motorcycle.Gas > car.Gas);
    }

    [Fact]
    public void Motorcycle_Throws_When_Not_Started()
    {
        var motorcycle = new Motorcycle(10);
        Assert.Throws<InvalidOperationException>(() => motorcycle.Drive(5));
    }
}
