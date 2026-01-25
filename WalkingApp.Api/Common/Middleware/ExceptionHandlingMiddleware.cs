using System.Net;
using System.Text.Json;
using WalkingApp.Api.Common.Models;

namespace WalkingApp.Api.Common.Middleware;

/// <summary>
/// Global exception handling middleware to catch unhandled exceptions and return standardized error responses.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        Console.WriteLine($"[Request] {context.Request.Method} {context.Request.Path}");
        try
        {
            await _next(context);
            Console.WriteLine($"[Response] {context.Request.Path} -> {context.Response.StatusCode}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Exception] {context.Request.Path} -> {ex.GetType().Name}: {ex.Message}");
            Console.WriteLine($"[StackTrace] {ex.StackTrace}");
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized access."),
            ArgumentException => (HttpStatusCode.BadRequest, exception.Message),
            InvalidOperationException => (HttpStatusCode.BadRequest, exception.Message),
            HttpRequestException => (HttpStatusCode.BadGateway, "An external service error occurred."),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.ErrorResponse(message);
        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}
