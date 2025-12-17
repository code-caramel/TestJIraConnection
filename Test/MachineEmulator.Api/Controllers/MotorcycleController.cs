using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MachineEmulator;
using MachineEmulator.Api.Authorization;

namespace MachineEmulator.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MotorcycleController : ControllerBase
    {
        private readonly IMotorcycle _motorcycle;
        private readonly MachineEmu.Database.MachineEmuDbContext _db;

        public MotorcycleController(IMotorcycle motorcycle, MachineEmu.Database.MachineEmuDbContext db)
        {
            _motorcycle = motorcycle;
            _db = db;
        }

        [HttpPost("{id}/start")]
        [Authorize(Policy = PermissionPolicies.StartMotorcycle)]
        public IActionResult StartById(int id)
        {
            var motorcycle = _db.Motorcycles.Include(m => m.Status).FirstOrDefault(m => m.Id == id);
            if (motorcycle == null) return NotFound();
            var runningStatus = _db.MotorcycleStatuses.FirstOrDefault(s => s.Status == "Running");
            if (runningStatus == null) return BadRequest("Running status not found");
            motorcycle.StatusId = runningStatus.Id;
            _db.SaveChanges();
            return Ok();
        }

        [HttpPost("{id}/stop")]
        [Authorize(Policy = PermissionPolicies.StopMotorcycle)]
        public IActionResult StopById(int id)
        {
            var motorcycle = _db.Motorcycles.Include(m => m.Status).FirstOrDefault(m => m.Id == id);
            if (motorcycle == null) return NotFound();
            var stoppedStatus = _db.MotorcycleStatuses.FirstOrDefault(s => s.Status == "Stopped");
            if (stoppedStatus == null) return BadRequest("Stopped status not found");
            motorcycle.StatusId = stoppedStatus.Id;
            _db.SaveChanges();
            return Ok();
        }

        [HttpPost("{id}/drive")]
        [Authorize(Policy = PermissionPolicies.DriveMotorcycle)]
        public IActionResult DriveById(int id)
        {
            var motorcycle = _db.Motorcycles.Include(m => m.Status).FirstOrDefault(m => m.Id == id);
            if (motorcycle == null) return NotFound();

            // Motorcycle must be running to drive
            if (motorcycle.Status.Status != "Running")
                return BadRequest("Motorcycle must be running to drive");

            var drivingStatus = _db.MotorcycleStatuses.FirstOrDefault(s => s.Status == "Driving");
            if (drivingStatus == null) return BadRequest("Driving status not found");
            motorcycle.StatusId = drivingStatus.Id;
            _db.SaveChanges();
            return Ok();
        }

        [HttpGet]
        public IActionResult GetMotorcycles()
        {
            var motorcycles = _db.Motorcycles
                .Select(m => new {
                    id = m.Id,
                    name = m.Name,
                    status = new { id = m.Status.Id, status = m.Status.Status }
                })
                .ToList();
            return Ok(motorcycles);
        }

        [HttpGet("{id}")]
        public IActionResult GetMotorcycleById(int id)
        {
            var motorcycle = _db.Motorcycles
                .Where(m => m.Id == id)
                .Select(m => new {
                    id = m.Id,
                    name = m.Name,
                    status = new { id = m.Status.Id, status = m.Status.Status }
                })
                .FirstOrDefault();
            if (motorcycle == null) return NotFound();
            return Ok(motorcycle);
        }

        [HttpGet("statuses")]
        public IActionResult GetMotorcycleStatuses()
        {
            var statuses = _db.MotorcycleStatuses
                .Select(s => new { id = s.Id, status = s.Status })
                .ToList();
            return Ok(statuses);
        }

        [HttpPost]
        public IActionResult CreateMotorcycle([FromBody] CreateMotorcycleRequest req)
        {
            var status = _db.MotorcycleStatuses.FirstOrDefault(s => s.Id == req.StatusId);
            if (status == null)
            {
                status = _db.MotorcycleStatuses.FirstOrDefault(s => s.Status == "Stopped");
            }
            if (status == null) return BadRequest("No valid status found");

            var motorcycle = new MachineEmu.Database.Motorcycle
            {
                Name = req.Name ?? string.Empty,
                StatusId = status.Id
            };
            _db.Motorcycles.Add(motorcycle);
            _db.SaveChanges();

            return Ok(new { id = motorcycle.Id, name = motorcycle.Name, status = new { id = status.Id, status = status.Status } });
        }

        [HttpPut("{id}")]
        public IActionResult UpdateMotorcycle(int id, [FromBody] UpdateMotorcycleRequest req)
        {
            var motorcycle = _db.Motorcycles.Include(m => m.Status).FirstOrDefault(m => m.Id == id);
            if (motorcycle == null) return NotFound();

            if (!string.IsNullOrEmpty(req.Name))
            {
                motorcycle.Name = req.Name;
            }

            if (req.StatusId.HasValue)
            {
                var status = _db.MotorcycleStatuses.FirstOrDefault(s => s.Id == req.StatusId.Value);
                if (status != null)
                {
                    motorcycle.StatusId = status.Id;
                }
            }

            _db.SaveChanges();
            return Ok(new { id = motorcycle.Id, name = motorcycle.Name, status = new { id = motorcycle.Status.Id, status = motorcycle.Status.Status } });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteMotorcycle(int id)
        {
            var motorcycle = _db.Motorcycles.FirstOrDefault(m => m.Id == id);
            if (motorcycle == null) return NotFound();

            _db.Motorcycles.Remove(motorcycle);
            _db.SaveChanges();
            return Ok();
        }

        [HttpGet("status")]
        public IActionResult GetStatus() => Ok(new { gas = _motorcycle.Gas, isRunning = _motorcycle.IsRunning });

        [HttpPost("start")]
        public IActionResult Start()
        {
            _motorcycle.Start();
            return Ok();
        }

        [HttpPost("stop")]
        public IActionResult Stop()
        {
            _motorcycle.Stop();
            return Ok();
        }

        [HttpPost("drive")]
        public IActionResult Drive([FromQuery] double km)
        {
            try
            {
                _motorcycle.Drive(km);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("refuel")]
        public IActionResult Refuel([FromQuery] double amount)
        {
            try
            {
                _motorcycle.Refuel(amount);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("wheelie")]
        public IActionResult Wheelie()
        {
            _motorcycle.Wheelie();
            return Ok();
        }
    }

    public class CreateMotorcycleRequest
    {
        public string? Name { get; set; }
        public int? StatusId { get; set; }
    }

    public class UpdateMotorcycleRequest
    {
        public string? Name { get; set; }
        public int? StatusId { get; set; }
    }
}
