using MachineEmu.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MachineEmulator.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly MachineEmuDbContext _db;

        public RoleController(MachineEmuDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _db.Roles
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    Permissions = r.RolePermissions.Select(rp => new { rp.Permission.Id, rp.Permission.Name }).ToList()
                })
                .ToListAsync();
            return Ok(roles);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRole(int id)
        {
            var role = await _db.Roles
                .Where(r => r.Id == id)
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    Permissions = r.RolePermissions.Select(rp => new { rp.Permission.Id, rp.Permission.Name }).ToList()
                })
                .FirstOrDefaultAsync();
            if (role == null) return NotFound();
            return Ok(role);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest req)
        {
            if (await _db.Roles.AnyAsync(r => r.Name == req.Name))
                return BadRequest("Role already exists");

            var role = new Role
            {
                Name = req.Name ?? string.Empty
            };
            _db.Roles.Add(role);
            await _db.SaveChangesAsync();

            // Add permissions if specified
            if (req.PermissionIds != null && req.PermissionIds.Any())
            {
                foreach (var permId in req.PermissionIds)
                {
                    _db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permId });
                }
                await _db.SaveChangesAsync();
            }

            return Ok(new { role.Id, role.Name });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest req)
        {
            var role = await _db.Roles.FindAsync(id);
            if (role == null) return NotFound();

            if (!string.IsNullOrEmpty(req.Name) && req.Name != role.Name)
            {
                if (await _db.Roles.AnyAsync(r => r.Name == req.Name && r.Id != id))
                    return BadRequest("Role name already exists");
                role.Name = req.Name;
            }

            // Update permissions if specified
            if (req.PermissionIds != null)
            {
                var existingPerms = await _db.RolePermissions.Where(rp => rp.RoleId == id).ToListAsync();
                _db.RolePermissions.RemoveRange(existingPerms);
                foreach (var permId in req.PermissionIds)
                {
                    _db.RolePermissions.Add(new RolePermission { RoleId = id, PermissionId = permId });
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { role.Id, role.Name });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _db.Roles.FindAsync(id);
            if (role == null) return NotFound();

            var rolePerms = await _db.RolePermissions.Where(rp => rp.RoleId == id).ToListAsync();
            var userRoles = await _db.UserRoles.Where(ur => ur.RoleId == id).ToListAsync();
            _db.RolePermissions.RemoveRange(rolePerms);
            _db.UserRoles.RemoveRange(userRoles);
            _db.Roles.Remove(role);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }

    public class CreateRoleRequest
    {
        public string? Name { get; set; }
        public List<int>? PermissionIds { get; set; }
    }

    public class UpdateRoleRequest
    {
        public string? Name { get; set; }
        public List<int>? PermissionIds { get; set; }
    }
}
