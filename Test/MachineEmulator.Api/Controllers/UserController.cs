using MachineEmu.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MachineEmulator.Api.Authorization;

namespace MachineEmulator.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = PermissionPolicies.ManageUsers)]
    public class UserController : ControllerBase
    {
        private readonly MachineEmuDbContext _db;

        public UserController(MachineEmuDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.Users
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    Roles = u.UserRoles.Select(ur => new { ur.Role.Id, ur.Role.Name }).ToList()
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _db.Users
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    Roles = u.UserRoles.Select(ur => new { ur.Role.Id, ur.Role.Name }).ToList()
                })
                .FirstOrDefaultAsync();
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest req)
        {
            if (await _db.Users.AnyAsync(u => u.UserName == req.UserName))
                return BadRequest("Username already exists");

            var user = new User
            {
                UserName = req.UserName ?? string.Empty,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Add roles if specified
            if (req.RoleIds != null && req.RoleIds.Any())
            {
                foreach (var roleId in req.RoleIds)
                {
                    _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId });
                }
                await _db.SaveChangesAsync();
            }

            return Ok(new { user.Id, user.UserName });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest req)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(req.UserName) && req.UserName != user.UserName)
            {
                if (await _db.Users.AnyAsync(u => u.UserName == req.UserName && u.Id != id))
                    return BadRequest("Username already exists");
                user.UserName = req.UserName;
            }

            if (!string.IsNullOrEmpty(req.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            }

            // Update roles if specified
            if (req.RoleIds != null)
            {
                var existingRoles = await _db.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
                _db.UserRoles.RemoveRange(existingRoles);
                foreach (var roleId in req.RoleIds)
                {
                    _db.UserRoles.Add(new UserRole { UserId = id, RoleId = roleId });
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { user.Id, user.UserName });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            var userRoles = await _db.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
            _db.UserRoles.RemoveRange(userRoles);
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }

    public class CreateUserRequest
    {
        public string? UserName { get; set; }
        public string? Password { get; set; }
        public List<int>? RoleIds { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? UserName { get; set; }
        public string? Password { get; set; }
        public List<int>? RoleIds { get; set; }
    }
}
