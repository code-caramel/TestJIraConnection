var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddScoped<ICar, Car>();
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();
