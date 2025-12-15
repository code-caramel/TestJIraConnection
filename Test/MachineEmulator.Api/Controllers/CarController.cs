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
                    status = new { status = c.Status.Status }
                })
                .ToList();
            return Ok(cars);
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
}
