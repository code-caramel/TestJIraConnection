using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace MachineEmu.Database
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<MachineEmuDbContext>
    {
        public MachineEmuDbContext CreateDbContext(string[] args)
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<MachineEmuDbContext>();
            optionsBuilder.UseNpgsql(config.GetConnectionString("DefaultConnection"));

            return new MachineEmuDbContext(optionsBuilder.Options);
        }
    }
}
