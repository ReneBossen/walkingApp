using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using WalkingApp.Api.Common.Configuration;

namespace WalkingApp.Api.Common.Authentication;

/// <summary>
/// Middleware to validate Supabase JWT tokens and populate the user identity.
/// Supports both HS256 (symmetric) tokens and RS256/ES256 (asymmetric) OAuth tokens via JWKS.
/// </summary>
/// <remarks>
/// This middleware is deprecated. Use <see cref="SupabaseAuthHandler"/> instead,
/// which integrates properly with ASP.NET Core's authentication system and supports
/// the [Authorize] attribute.
/// </remarks>
[Obsolete("Use SupabaseAuthHandler instead for proper ASP.NET Core authentication integration.")]
public class SupabaseAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SupabaseSettings _settings;
    private readonly ILogger<SupabaseAuthMiddleware> _logger;
    private readonly ConfigurationManager<OpenIdConnectConfiguration> _jwksConfigManager;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    /// <summary>
    /// Initializes a new instance of <see cref="SupabaseAuthMiddleware"/>.
    /// </summary>
    /// <param name="next">The next middleware in the pipeline.</param>
    /// <param name="settings">The Supabase settings.</param>
    /// <param name="logger">The logger instance.</param>
    public SupabaseAuthMiddleware(
        RequestDelegate next,
        IOptions<SupabaseSettings> settings,
        ILogger<SupabaseAuthMiddleware> logger)
    {
        _next = next;
        _settings = settings.Value;
        _logger = logger;
        _tokenHandler = new JwtSecurityTokenHandler();
        _jwksConfigManager = CreateJwksConfigManager(_settings.Url);
    }

    /// <summary>
    /// Processes the HTTP request, validating any JWT token in the Authorization header.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    public async Task InvokeAsync(HttpContext context)
    {
        var token = ExtractToken(context);

        if (!string.IsNullOrWhiteSpace(token))
        {
            try
            {
                var claimsPrincipal = await ValidateTokenAsync(token);
                if (claimsPrincipal != null)
                {
                    context.User = claimsPrincipal;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to validate JWT token");
            }
        }

        await _next(context);
    }

    private static ConfigurationManager<OpenIdConnectConfiguration> CreateJwksConfigManager(string supabaseUrl)
    {
        var openIdConfigUri = BuildOpenIdConfigUri(supabaseUrl);

        return new ConfigurationManager<OpenIdConnectConfiguration>(
            openIdConfigUri,
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever());
    }

    private static string BuildOpenIdConfigUri(string supabaseUrl)
    {
        var baseUrl = supabaseUrl.TrimEnd('/');
        return $"{baseUrl}/auth/v1/.well-known/openid-configuration";
    }

    private static string? ExtractToken(HttpContext context)
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(authHeader))
        {
            return null;
        }

        const string bearerPrefix = "Bearer ";
        if (authHeader.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return authHeader[bearerPrefix.Length..].Trim();
        }

        return null;
    }

    private async Task<ClaimsPrincipal?> ValidateTokenAsync(string token)
    {
        var hasKid = TokenHasKid(token);

        return hasKid
            ? await ValidateWithJwksAsync(token)
            : ValidateWithSymmetricKey(token);
    }

    private bool TokenHasKid(string token)
    {
        try
        {
            var jwtToken = _tokenHandler.ReadJwtToken(token);
            return jwtToken.Header.Kid != null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read JWT header");
            return false;
        }
    }

    private async Task<ClaimsPrincipal?> ValidateWithJwksAsync(string token)
    {
        try
        {
            var config = await _jwksConfigManager.GetConfigurationAsync(CancellationToken.None);
            var signingKeys = config.SigningKeys;

            var validationParameters = CreateValidationParameters();
            validationParameters.IssuerSigningKeys = signingKeys;

            var principal = _tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "JWKS token validation failed");
            return null;
        }
    }

    private ClaimsPrincipal? ValidateWithSymmetricKey(string token)
    {
        try
        {
            var key = Encoding.UTF8.GetBytes(_settings.JwtSecret);
            var validationParameters = CreateValidationParameters();
            validationParameters.IssuerSigningKey = new SymmetricSecurityKey(key);

            var principal = _tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "Symmetric key token validation failed");
            return null;
        }
    }

    private TokenValidationParameters CreateValidationParameters()
    {
        return new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidIssuer = _settings.JwtIssuer,
            ValidateAudience = true,
            ValidAudience = _settings.JwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    }
}
