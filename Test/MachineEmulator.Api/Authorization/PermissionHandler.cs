using Microsoft.AspNetCore.Authorization;

namespace MachineEmulator.Api.Authorization
{
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }

    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            var permissionClaims = context.User.FindAll("permission");

            if (permissionClaims.Any(c => c.Value == requirement.Permission))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }

    public static class PermissionPolicies
    {
        public const string ManageUsers = "ManageUsers";
        public const string ManageRoles = "ManageRoles";
        public const string ManageCars = "ManageCars";
        public const string StartCar = "StartCar";
        public const string StopCar = "StopCar";
        public const string GetCarStatus = "GetCarStatus";
        public const string ManageMotorcycles = "ManageMotorcycles";
        public const string StartMotorcycle = "StartMotorcycle";
        public const string StopMotorcycle = "StopMotorcycle";
        public const string DriveMotorcycle = "DriveMotorcycle";
    }
}
