using MachineEmu.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MachineEmulator.Api.Authorization;

namespace MachineEmulator.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = PermissionPolicies.ManageRoles)]
    public class PermissionController : ControllerBase
    {
        private readonly MachineEmuDbContext _db;

        public PermissionController(MachineEmuDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _db.Permissions
                .Select(p => new { p.Id, p.Name })
                .ToListAsync();
            return Ok(permissions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPermission(int id)
        {
            var permission = await _db.Permissions
                .Where(p => p.Id == id)
                .Select(p => new { p.Id, p.Name })
                .FirstOrDefaultAsync();
            if (permission == null) return NotFound();
            return Ok(permission);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePermission([FromBody] CreatePermissionRequest req)
        {
            if (await _db.Permissions.AnyAsync(p => p.Name == req.Name))
                return BadRequest("Permission already exists");

            var permission = new Permission
            {
                Name = req.Name ?? string.Empty
            };
            _db.Permissions.Add(permission);
            await _db.SaveChangesAsync();

            return Ok(new { permission.Id, permission.Name });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePermission(int id, [FromBody] UpdatePermissionRequest req)
        {
            var permission = await _db.Permissions.FindAsync(id);
            if (permission == null) return NotFound();

            if (!string.IsNullOrEmpty(req.Name) && req.Name != permission.Name)
            {
                if (await _db.Permissions.AnyAsync(p => p.Name == req.Name && p.Id != id))
                    return BadRequest("Permission name already exists");
                permission.Name = req.Name;
            }

            await _db.SaveChangesAsync();
            return Ok(new { permission.Id, permission.Name });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePermission(int id)
        {
            var permission = await _db.Permissions.FindAsync(id);
            if (permission == null) return NotFound();

            var rolePerms = await _db.RolePermissions.Where(rp => rp.PermissionId == id).ToListAsync();
            _db.RolePermissions.RemoveRange(rolePerms);
            _db.Permissions.Remove(permission);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }

    public class CreatePermissionRequest
    {
        public string? Name { get; set; }
    }

    public class UpdatePermissionRequest
    {
        public string? Name { get; set; }
    }
}
