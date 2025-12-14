namespace MachineEmulator;

public interface ICar
{
	double Gas { get; }
	bool IsRunning { get; }
	double GasConsumptionPerKm { get; set; }
	void Start();
	void Stop();
	void Drive(double km);
	void Brake();
	void Turn(string direction);
	void Refuel(double amount);
}

public class Car : ICar
{
	public double Gas { get; private set; }
	public bool IsRunning { get; private set; }
	public double GasConsumptionPerKm { get; set; } = 0.1;
	public Car(double initialGas = 50)
	{
		Gas = initialGas;
		IsRunning = false;
	}
	public void Start() => IsRunning = true;
	public void Stop() => IsRunning = false;
	public void Drive(double km)
	{
		if (!IsRunning) throw new InvalidOperationException("Car must be started to drive.");
		double neededGas = km * GasConsumptionPerKm;
		if (Gas < neededGas) throw new InvalidOperationException("Not enough gas to drive.");
		Gas -= neededGas;
	}
	public void Brake() { /* Simulate braking */ }
	public void Turn(string direction) { /* Simulate turning left/right */ }
	public void Refuel(double amount)
	{
		if (amount <= 0) throw new ArgumentException("Amount must be positive.");
		Gas += amount;
	}
}
