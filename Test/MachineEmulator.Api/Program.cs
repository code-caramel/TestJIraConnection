using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using MachineEmu.Database;
using MachineEmulator.Api.Authorization;

var builder = WebApplication.CreateBuilder(args);
// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

// Add services to the container.
builder.Services.AddScoped<MachineEmulator.ICar, MachineEmulator.Car>();
builder.Services.AddScoped<MachineEmulator.IMotorcycle, MachineEmulator.Motorcycle>();
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Add DbContext
builder.Services.AddDbContext<MachineEmuDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"] ?? throw new InvalidOperationException("Jwt:Key is missing in configuration");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PermissionPolicies.ManageUsers, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.ManageUsers)));
    options.AddPolicy(PermissionPolicies.ManageRoles, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.ManageRoles)));
    options.AddPolicy(PermissionPolicies.ManageCars, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.ManageCars)));
    options.AddPolicy(PermissionPolicies.StartCar, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.StartCar)));
    options.AddPolicy(PermissionPolicies.StopCar, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.StopCar)));
    options.AddPolicy(PermissionPolicies.GetCarStatus, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.GetCarStatus)));
    options.AddPolicy(PermissionPolicies.ManageMotorcycles, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.ManageMotorcycles)));
    options.AddPolicy(PermissionPolicies.StartMotorcycle, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.StartMotorcycle)));
    options.AddPolicy(PermissionPolicies.StopMotorcycle, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.StopMotorcycle)));
    options.AddPolicy(PermissionPolicies.DriveMotorcycle, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionPolicies.DriveMotorcycle)));
});

builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();


var app = builder.Build();
// Use CORS
app.UseCors("AllowFrontend");

// Seed database with test data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MachineEmuDbContext>();
    db.Database.Migrate(); // Apply pending migrations
    DbSeeder.Seed(db);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
