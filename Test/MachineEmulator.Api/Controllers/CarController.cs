using Microsoft.AspNetCore.Mvc;
using MachineEmulator;

namespace MachineEmulator.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarController : ControllerBase
    {
        private readonly ICar _car;

        public CarController(ICar car)
        {
            _car = car;
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
