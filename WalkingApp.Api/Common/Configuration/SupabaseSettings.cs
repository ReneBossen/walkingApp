namespace WalkingApp.Api.Common.Configuration;

/// <summary>
/// Strongly-typed configuration settings for Supabase integration.
/// </summary>
public class SupabaseSettings
{
    /// <summary>
    /// The Supabase project URL.
    /// </summary>
    public required string Url { get; init; }

    /// <summary>
    /// The Supabase anonymous API key for client connections.
    /// </summary>
    public required string AnonKey { get; init; }

    /// <summary>
    /// The JWT secret used to validate Supabase authentication tokens.
    /// </summary>
    public required string JwtSecret { get; init; }
}
