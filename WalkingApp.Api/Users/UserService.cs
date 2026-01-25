using WalkingApp.Api.Common.Database;
using WalkingApp.Api.Users.DTOs;

namespace WalkingApp.Api.Users;

/// <summary>
/// Service implementation for user business logic.
/// </summary>
public class UserService : IUserService
{
    private const string DefaultDisplayNamePrefix = "User_";
    private const int DefaultDisplayNameMaxLength = 20;
    private const int MinDailyStepGoal = 100;
    private const int MaxDailyStepGoal = 100000;
    private const int DefaultDailyStepGoal = 10000;
    private const long MaxAvatarFileSizeBytes = 5 * 1024 * 1024; // 5MB
    private const string AvatarsBucketName = "avatars";

    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp"
    };

    private static readonly HashSet<string> ValidDistanceUnits = new(StringComparer.OrdinalIgnoreCase)
    {
        "metric",
        "imperial"
    };

    private readonly IUserRepository _userRepository;
    private readonly ISupabaseClientFactory _clientFactory;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserService(
        IUserRepository userRepository,
        ISupabaseClientFactory clientFactory,
        IHttpContextAccessor httpContextAccessor)
    {
        ArgumentNullException.ThrowIfNull(userRepository);
        ArgumentNullException.ThrowIfNull(clientFactory);
        ArgumentNullException.ThrowIfNull(httpContextAccessor);

        _userRepository = userRepository;
        _clientFactory = clientFactory;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <inheritdoc />
    public async Task<GetProfileResponse> GetProfileAsync(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User ID cannot be empty.", nameof(userId));
        }

        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            throw new KeyNotFoundException($"User profile not found for user ID: {userId}");
        }

        return MapToGetProfileResponse(user);
    }

    /// <inheritdoc />
    public async Task<GetProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User ID cannot be empty.", nameof(userId));
        }

        ArgumentNullException.ThrowIfNull(request);

        ValidateUpdateProfileRequest(request);

        var existingUser = await _userRepository.GetByIdAsync(userId);

        if (existingUser == null)
        {
            throw new KeyNotFoundException($"User profile not found for user ID: {userId}");
        }

        existingUser.DisplayName = request.DisplayName;
        existingUser.AvatarUrl = request.AvatarUrl;

        if (request.Preferences != null)
        {
            existingUser.Preferences = request.Preferences;
        }

        if (request.OnboardingCompleted.HasValue)
        {
            existingUser.OnboardingCompleted = request.OnboardingCompleted.Value;
        }

        // Note: UpdatedAt is automatically set by the database trigger (update_users_updated_at)
        // No need to set it manually here

        var updatedUser = await _userRepository.UpdateAsync(existingUser);

        return MapToGetProfileResponse(updatedUser);
    }

    /// <inheritdoc />
    public async Task<GetProfileResponse> EnsureProfileExistsAsync(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User ID cannot be empty.", nameof(userId));
        }

        var existingUser = await _userRepository.GetByIdAsync(userId);

        if (existingUser != null)
        {
            return MapToGetProfileResponse(existingUser);
        }

        var defaultName = $"{DefaultDisplayNamePrefix}{userId:N}";
        var newUser = new User
        {
            Id = userId,
            DisplayName = defaultName.Length > DefaultDisplayNameMaxLength
                ? defaultName.Substring(0, DefaultDisplayNameMaxLength)
                : defaultName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Preferences = new UserPreferences()
        };

        var createdUser = await _userRepository.CreateAsync(newUser);

        return MapToGetProfileResponse(createdUser);
    }

    /// <summary>
    /// Validates the update profile request.
    /// </summary>
    /// <remarks>
    /// Future considerations:
    /// - Add rate limiting to prevent abuse of profile updates (e.g., max 10 updates per hour)
    /// - Add profanity filter for display name validation to prevent inappropriate content
    /// </remarks>
    private static void ValidateUpdateProfileRequest(UpdateProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            throw new ArgumentException("Display name cannot be empty.");
        }

        if (request.DisplayName.Length < 2)
        {
            throw new ArgumentException("Display name must be at least 2 characters long.");
        }

        if (request.DisplayName.Length > 50)
        {
            throw new ArgumentException("Display name must not exceed 50 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            if (!Uri.TryCreate(request.AvatarUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                throw new ArgumentException("Avatar URL must be a valid HTTP or HTTPS URL.");
            }
        }

        if (request.Preferences != null)
        {
            if (!string.IsNullOrEmpty(request.Preferences.Units) &&
                request.Preferences.Units != "metric" && request.Preferences.Units != "imperial")
            {
                throw new ArgumentException("Units must be either 'metric' or 'imperial'.");
            }
        }
    }

    /// <inheritdoc />
    public async Task<UserPreferencesResponse> GetPreferencesAsync(Guid userId)
    {
        ValidateUserId(userId);

        var user = await GetUserOrThrowAsync(userId);

        return MapToPreferencesResponse(user.Preferences);
    }

    /// <inheritdoc />
    public async Task<UserPreferencesResponse> UpdatePreferencesAsync(Guid userId, UpdateUserPreferencesRequest request)
    {
        ValidateUserId(userId);
        ArgumentNullException.ThrowIfNull(request);
        ValidateUpdatePreferencesRequest(request);

        var user = await GetUserOrThrowAsync(userId);
        ApplyPreferencesUpdate(user.Preferences, request);

        await _userRepository.UpdateAsync(user);

        return MapToPreferencesResponse(user.Preferences);
    }

    /// <inheritdoc />
    public async Task<AvatarUploadResponse> UploadAvatarAsync(Guid userId, Stream fileStream, string fileName, string contentType)
    {
        ValidateUserId(userId);
        ValidateAvatarFile(fileStream, fileName, contentType);

        var user = await GetUserOrThrowAsync(userId);
        var avatarUrl = await UploadAvatarToStorageAsync(userId, fileStream, fileName, contentType);

        user.AvatarUrl = avatarUrl;
        await _userRepository.UpdateAsync(user);

        return new AvatarUploadResponse(avatarUrl);
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User ID cannot be empty.", nameof(userId));
        }
    }

    private async Task<User> GetUserOrThrowAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            throw new KeyNotFoundException($"User profile not found for user ID: {userId}");
        }

        return user;
    }

    private static void ValidateUpdatePreferencesRequest(UpdateUserPreferencesRequest request)
    {
        if (request.DailyStepGoal.HasValue)
        {
            ValidateDailyStepGoal(request.DailyStepGoal.Value);
        }

        if (!string.IsNullOrEmpty(request.DistanceUnit))
        {
            ValidateDistanceUnit(request.DistanceUnit);
        }
    }

    private static void ValidateDailyStepGoal(int stepGoal)
    {
        if (stepGoal < MinDailyStepGoal || stepGoal > MaxDailyStepGoal)
        {
            throw new ArgumentException(
                $"Daily step goal must be between {MinDailyStepGoal} and {MaxDailyStepGoal}.");
        }
    }

    private static void ValidateDistanceUnit(string unit)
    {
        if (!ValidDistanceUnits.Contains(unit))
        {
            throw new ArgumentException("Distance unit must be either 'metric' or 'imperial'.");
        }
    }

    private static void ApplyPreferencesUpdate(UserPreferences preferences, UpdateUserPreferencesRequest request)
    {
        if (request.NotificationsEnabled.HasValue)
        {
            preferences.Notifications.DailyReminder = request.NotificationsEnabled.Value;
        }

        if (request.DailyStepGoal.HasValue)
        {
            preferences.DailyStepGoal = request.DailyStepGoal.Value;
        }

        if (!string.IsNullOrEmpty(request.DistanceUnit))
        {
            preferences.Units = request.DistanceUnit;
        }

        if (request.PrivateProfile.HasValue)
        {
            preferences.Privacy.PrivateProfile = request.PrivateProfile.Value;
        }
    }

    private static void ValidateAvatarFile(Stream fileStream, string fileName, string contentType)
    {
        ArgumentNullException.ThrowIfNull(fileStream);

        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("File name cannot be empty.", nameof(fileName));
        }

        if (string.IsNullOrWhiteSpace(contentType))
        {
            throw new ArgumentException("Content type cannot be empty.", nameof(contentType));
        }

        ValidateContentType(contentType);
        ValidateFileExtension(fileName);
        ValidateFileSize(fileStream);
    }

    private static void ValidateContentType(string contentType)
    {
        if (!AllowedImageContentTypes.Contains(contentType))
        {
            throw new ArgumentException(
                $"Invalid file type. Allowed types: {string.Join(", ", AllowedImageContentTypes)}");
        }
    }

    private static void ValidateFileExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);

        if (string.IsNullOrEmpty(extension) || !AllowedImageExtensions.Contains(extension))
        {
            throw new ArgumentException(
                $"Invalid file extension. Allowed extensions: {string.Join(", ", AllowedImageExtensions)}");
        }
    }

    private static void ValidateFileSize(Stream fileStream)
    {
        if (fileStream.Length > MaxAvatarFileSizeBytes)
        {
            throw new ArgumentException(
                $"File size exceeds maximum allowed size of {MaxAvatarFileSizeBytes / (1024 * 1024)}MB.");
        }
    }

    private async Task<string> UploadAvatarToStorageAsync(Guid userId, Stream fileStream, string fileName, string contentType)
    {
        var client = await GetAuthenticatedClientAsync();
        var extension = Path.GetExtension(fileName);
        var storagePath = $"{userId}{extension}";

        var fileBytes = await ReadStreamToBytesAsync(fileStream);

        await client.Storage
            .From(AvatarsBucketName)
            .Upload(fileBytes, storagePath, new Supabase.Storage.FileOptions
            {
                ContentType = contentType,
                Upsert = true
            });

        var publicUrl = client.Storage
            .From(AvatarsBucketName)
            .GetPublicUrl(storagePath);

        return publicUrl;
    }

    private static async Task<byte[]> ReadStreamToBytesAsync(Stream stream)
    {
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        return memoryStream.ToArray();
    }

    private async Task<Supabase.Client> GetAuthenticatedClientAsync()
    {
        if (_httpContextAccessor.HttpContext?.Items.TryGetValue("SupabaseToken", out var tokenObj) != true)
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }

        var token = tokenObj as string;
        if (string.IsNullOrEmpty(token))
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }

        return await _clientFactory.CreateClientAsync(token);
    }

    private static UserPreferencesResponse MapToPreferencesResponse(UserPreferences preferences)
    {
        return new UserPreferencesResponse(
            NotificationsEnabled: preferences.Notifications.DailyReminder,
            DailyStepGoal: preferences.DailyStepGoal,
            DistanceUnit: preferences.Units,
            PrivateProfile: preferences.Privacy.PrivateProfile
        );
    }

    private static GetProfileResponse MapToGetProfileResponse(User user)
    {
        return new GetProfileResponse
        {
            Id = user.Id,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Preferences = user.Preferences,
            CreatedAt = user.CreatedAt,
            OnboardingCompleted = user.OnboardingCompleted
        };
    }
}
