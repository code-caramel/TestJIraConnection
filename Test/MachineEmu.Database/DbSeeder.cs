using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

	namespace MachineEmu.Database
	{
		public static class DbSeeder
		{
			public static void Seed(MachineEmuDbContext db)
			{
				if (!db.Roles.Any())
				{
					var adminRole = new Role { Name = "Admin" };
					var userRole = new Role { Name = "User" };
					db.Roles.AddRange(adminRole, userRole);
					db.SaveChanges();
				}

				if (!db.Permissions.Any())
				{
					var perms = new[] {
						new Permission { Name = "ManageUsers" },
						new Permission { Name = "ManageRoles" },
						new Permission { Name = "ManageCars" },
						new Permission { Name = "StartCar" },
						new Permission { Name = "StopCar" },
						new Permission { Name = "GetCarStatus" },
						new Permission { Name = "ManageMotorcycles" },
						new Permission { Name = "StartMotorcycle" },
						new Permission { Name = "StopMotorcycle" },
						new Permission { Name = "DriveMotorcycle" }
					};
					db.Permissions.AddRange(perms);
					db.SaveChanges();
				}
				else
				{
					// Add new motorcycle permissions if they don't exist
					var existingPerms = db.Permissions.Select(p => p.Name).ToList();
					var newPerms = new[] { "ManageMotorcycles", "StartMotorcycle", "StopMotorcycle", "DriveMotorcycle" };
					foreach (var permName in newPerms)
					{
						if (!existingPerms.Contains(permName))
						{
							db.Permissions.Add(new Permission { Name = permName });
						}
					}
					db.SaveChanges();
				}

				// Always reset RolePermissions to ensure correct permission assignments
				{
					// Remove existing RolePermissions
					db.RolePermissions.RemoveRange(db.RolePermissions.ToList());
					db.SaveChanges();

					var admin = db.Roles.First(r => r.Name == "Admin");
					var user = db.Roles.First(r => r.Name == "User");
					var perms = db.Permissions.ToList();
					// Admin gets only management permissions (NOT StartCar/StopCar/GetCarStatus)
					var adminPerms = perms.Where(p => p.Name == "ManageUsers" || p.Name == "ManageRoles" || p.Name == "ManageCars" || p.Name == "ManageMotorcycles")
						.Select(p => new RolePermission { RoleId = admin.Id, PermissionId = p.Id });
					// User gets only car and motorcycle operation permissions
					var userPerms = perms.Where(p => p.Name == "StartCar" || p.Name == "StopCar" || p.Name == "GetCarStatus" ||
						p.Name == "StartMotorcycle" || p.Name == "StopMotorcycle" || p.Name == "DriveMotorcycle")
						.Select(p => new RolePermission { RoleId = user.Id, PermissionId = p.Id });
					db.RolePermissions.AddRange(adminPerms.Concat(userPerms));
					db.SaveChanges();
				}

				if (!db.Users.Any())
				{
					var admin = new User { UserName = "admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123") };
					var user = new User { UserName = "user", PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123") };
					db.Users.AddRange(admin, user);
					db.SaveChanges();
					var adminRole = db.Roles.First(r => r.Name == "Admin");
					var userRole = db.Roles.First(r => r.Name == "User" );
					db.UserRoles.AddRange(
						new UserRole { UserId = admin.Id, RoleId = adminRole.Id },
						new UserRole { UserId = user.Id, RoleId = userRole.Id }
					);
					db.SaveChanges();
				}

				if (!db.CarStatuses.Any())
				{
					var statuses = new[] {
						new CarStatus { Status = "Stopped" },
						new CarStatus { Status = "Running" }
					};
					db.CarStatuses.AddRange(statuses);
					db.SaveChanges();
				}

				if (!db.Cars.Any())
				{
					var stopped = db.CarStatuses.First(s => s.Status == "Stopped");
					db.Cars.AddRange(
						new Car { Name = "Car A", StatusId = stopped.Id },
						new Car { Name = "Car B", StatusId = stopped.Id }
					);
					db.SaveChanges();
				}

				// Seed motorcycle statuses
				if (!db.MotorcycleStatuses.Any())
				{
					var statuses = new[] {
						new MotorcycleStatus { Status = "Stopped" },
						new MotorcycleStatus { Status = "Running" },
						new MotorcycleStatus { Status = "Driving" }
					};
					db.MotorcycleStatuses.AddRange(statuses);
					db.SaveChanges();
				}

				// Seed motorcycles
				if (!db.Motorcycles.Any())
				{
					var stopped = db.MotorcycleStatuses.First(s => s.Status == "Stopped");
					db.Motorcycles.AddRange(
						new Motorcycle { Name = "Motorcycle A", StatusId = stopped.Id },
						new Motorcycle { Name = "Motorcycle B", StatusId = stopped.Id }
					);
					db.SaveChanges();
				}
			}
		}

		public class MachineEmuDbContext : DbContext
		{
			public MachineEmuDbContext(DbContextOptions<MachineEmuDbContext> options) : base(options) { }

			public DbSet<User> Users { get; set; }
			public DbSet<Role> Roles { get; set; }
			public DbSet<UserRole> UserRoles { get; set; }
			public DbSet<Permission> Permissions { get; set; }
			public DbSet<RolePermission> RolePermissions { get; set; }
			public DbSet<Car> Cars { get; set; }
			public DbSet<CarStatus> CarStatuses { get; set; }
			public DbSet<Motorcycle> Motorcycles { get; set; }
			public DbSet<MotorcycleStatus> MotorcycleStatuses { get; set; }

			protected override void OnModelCreating(ModelBuilder modelBuilder)
			{
				modelBuilder.Entity<UserRole>()
					.HasKey(ur => new { ur.UserId, ur.RoleId });
				modelBuilder.Entity<RolePermission>()
					.HasKey(rp => new { rp.RoleId, rp.PermissionId });
			}
		}

		public class User
		{
			public int Id { get; set; }
			public string UserName { get; set; }
			public string PasswordHash { get; set; }
			public ICollection<UserRole> UserRoles { get; set; }
		}

		public class Role
		{
			public int Id { get; set; }
			public string Name { get; set; }
			public ICollection<UserRole> UserRoles { get; set; }
			public ICollection<RolePermission> RolePermissions { get; set; }
		}

		public class UserRole
		{
			public int UserId { get; set; }
			public User User { get; set; }
			public int RoleId { get; set; }
			public Role Role { get; set; }
		}

		public class Permission
		{
			public int Id { get; set; }
			public string Name { get; set; }
			public ICollection<RolePermission> RolePermissions { get; set; }
		}

		public class RolePermission
		{
			public int RoleId { get; set; }
			public Role Role { get; set; }
			public int PermissionId { get; set; }
			public Permission Permission { get; set; }
		}

		public class Car
		{
			public int Id { get; set; }
			public string Name { get; set; }
			public int StatusId { get; set; }
			public CarStatus Status { get; set; }
		}

		public class CarStatus
		{
			public int Id { get; set; }
			public string Status { get; set; }
			public ICollection<Car> Cars { get; set; }
		}

		public class Motorcycle
		{
			public int Id { get; set; }
			public string Name { get; set; }
			public int StatusId { get; set; }
			public MotorcycleStatus Status { get; set; }
		}

		public class MotorcycleStatus
		{
			public int Id { get; set; }
			public string Status { get; set; }
			public ICollection<Motorcycle> Motorcycles { get; set; }
		}
	}
