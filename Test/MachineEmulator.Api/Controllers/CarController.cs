using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MachineEmulator;

namespace MachineEmulator.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarController : ControllerBase
    {
        private readonly ICar _car;
        private readonly MachineEmu.Database.MachineEmuDbContext _db;

        public CarController(ICar car, MachineEmu.Database.MachineEmuDbContext db)
        {
            _car = car;
            _db = db;
        }

        [HttpPost("{id}/start")]
        public IActionResult StartById(int id)
        {
            var car = _db.Cars.Include(c => c.Status).FirstOrDefault(c => c.Id == id);
            if (car == null) return NotFound();
            var runningStatus = _db.CarStatuses.FirstOrDefault(s => s.Status == "Running");
            if (runningStatus == null) return BadRequest("Running status not found");
            car.StatusId = runningStatus.Id;
            _db.SaveChanges();
            return Ok();
        }

        [HttpPost("{id}/stop")]
        public IActionResult StopById(int id)
        {
            var car = _db.Cars.Include(c => c.Status).FirstOrDefault(c => c.Id == id);
            if (car == null) return NotFound();
            var stoppedStatus = _db.CarStatuses.FirstOrDefault(s => s.Status == "Stopped");
            if (stoppedStatus == null) return BadRequest("Stopped status not found");
            car.StatusId = stoppedStatus.Id;
            _db.SaveChanges();
            return Ok();
        }
        [HttpGet]
        public IActionResult GetCars()
        {
            var cars = _db.Cars
                .Select(c => new {
                    id = c.Id,
                    name = c.Name,
                    status = new { id = c.Status.Id, status = c.Status.Status }
                })
                .ToList();
            return Ok(cars);
        }

        [HttpGet("{id}")]
        public IActionResult GetCarById(int id)
        {
            var car = _db.Cars
                .Where(c => c.Id == id)
                .Select(c => new {
                    id = c.Id,
                    name = c.Name,
                    status = new { id = c.Status.Id, status = c.Status.Status }
                })
                .FirstOrDefault();
            if (car == null) return NotFound();
            return Ok(car);
        }

        [HttpGet("statuses")]
        public IActionResult GetCarStatuses()
        {
            var statuses = _db.CarStatuses
                .Select(s => new { id = s.Id, status = s.Status })
                .ToList();
            return Ok(statuses);
        }

        [HttpPost]
        public IActionResult CreateCar([FromBody] CreateCarRequest req)
        {
            var status = _db.CarStatuses.FirstOrDefault(s => s.Id == req.StatusId);
            if (status == null)
            {
                status = _db.CarStatuses.FirstOrDefault(s => s.Status == "Stopped");
            }
            if (status == null) return BadRequest("No valid status found");

            var car = new MachineEmu.Database.Car
            {
                Name = req.Name ?? string.Empty,
                StatusId = status.Id
            };
            _db.Cars.Add(car);
            _db.SaveChanges();

            return Ok(new { id = car.Id, name = car.Name, status = new { id = status.Id, status = status.Status } });
        }

        [HttpPut("{id}")]
        public IActionResult UpdateCar(int id, [FromBody] UpdateCarRequest req)
        {
            var car = _db.Cars.Include(c => c.Status).FirstOrDefault(c => c.Id == id);
            if (car == null) return NotFound();

            if (!string.IsNullOrEmpty(req.Name))
            {
                car.Name = req.Name;
            }

            if (req.StatusId.HasValue)
            {
                var status = _db.CarStatuses.FirstOrDefault(s => s.Id == req.StatusId.Value);
                if (status != null)
                {
                    car.StatusId = status.Id;
                }
            }

            _db.SaveChanges();
            return Ok(new { id = car.Id, name = car.Name, status = new { id = car.Status.Id, status = car.Status.Status } });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCar(int id)
        {
            var car = _db.Cars.FirstOrDefault(c => c.Id == id);
            if (car == null) return NotFound();

            _db.Cars.Remove(car);
            _db.SaveChanges();
            return Ok();
        }

        [HttpGet("status")]
        public IActionResult GetStatus() => Ok(new { gas = _car.Gas, isRunning = _car.IsRunning });

        [HttpPost("start")]
        public IActionResult Start()
        {
            _car.Start();
            return Ok();
        }

        [HttpPost("stop")]
        public IActionResult Stop()
        {
            _car.Stop();
            return Ok();
        }

        [HttpPost("drive")]
        public IActionResult Drive([FromQuery] double km)
        {
            try
            {
                _car.Drive(km);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("brake")]
        public IActionResult Brake()
        {
            _car.Brake();
            return Ok();
        }

        [HttpPost("turn")]
        public IActionResult Turn([FromQuery] string direction)
        {
            _car.Turn(direction);
            return Ok();
        }

        [HttpPost("refuel")]
        public IActionResult Refuel([FromQuery] double amount)
        {
            try
            {
                _car.Refuel(amount);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }

    public class CreateCarRequest
    {
        public string? Name { get; set; }
        public int? StatusId { get; set; }
    }

    public class UpdateCarRequest
    {
        public string? Name { get; set; }
        public int? StatusId { get; set; }
    }
}
