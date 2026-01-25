using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using WalkingApp.Api.Users.DTOs;
using System.Text.Json;

namespace WalkingApp.Api.Users;

/// <summary>
/// Entity model for Supabase users table.
/// </summary>
[Table("users")]
internal class UserEntity : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("display_name")]
    public string DisplayName { get; set; } = string.Empty;

    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("qr_code_id")]
    public string QrCodeId { get; set; } = string.Empty;

    [Column("preferences")]
    public object? PreferencesJson { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("onboarding_completed")]
    public bool OnboardingCompleted { get; set; }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public User ToUser()
    {
        UserPreferences preferences;

        try
        {
            if (PreferencesJson == null)
            {
                preferences = new UserPreferences();
            }
            else if (PreferencesJson is JsonElement jsonElement)
            {
                preferences = JsonSerializer.Deserialize<UserPreferences>(jsonElement.GetRawText(), JsonOptions) ?? new UserPreferences();
            }
            else if (PreferencesJson is string jsonString)
            {
                preferences = string.IsNullOrWhiteSpace(jsonString)
                    ? new UserPreferences()
                    : JsonSerializer.Deserialize<UserPreferences>(jsonString, JsonOptions) ?? new UserPreferences();
            }
            else
            {
                // Try to serialize and deserialize the object
                var json = JsonSerializer.Serialize(PreferencesJson, JsonOptions);
                preferences = JsonSerializer.Deserialize<UserPreferences>(json, JsonOptions) ?? new UserPreferences();
            }
        }
        catch (JsonException)
        {
            // If parsing fails, use defaults
            preferences = new UserPreferences();
        }

        return new User
        {
            Id = Id,
            DisplayName = DisplayName,
            AvatarUrl = AvatarUrl,
            QrCodeId = QrCodeId,
            Preferences = preferences,
            CreatedAt = CreatedAt,
            UpdatedAt = UpdatedAt,
            OnboardingCompleted = OnboardingCompleted
        };
    }

    public static UserEntity FromUser(User user)
    {
        // Serialize preferences to a JsonElement for proper JSONB storage
        var preferencesJson = JsonSerializer.SerializeToElement(user.Preferences, JsonOptions);

        return new UserEntity
        {
            Id = user.Id,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            QrCodeId = user.QrCodeId,
            PreferencesJson = preferencesJson,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            OnboardingCompleted = user.OnboardingCompleted
        };
    }
}
