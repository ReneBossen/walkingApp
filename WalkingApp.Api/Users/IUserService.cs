using WalkingApp.Api.Users.DTOs;

namespace WalkingApp.Api.Users;

/// <summary>
/// Service interface for user business logic.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Gets the user profile for the specified user.
    /// </summary>
    /// <param name="userId">The user ID.</param>
    /// <returns>The user profile response.</returns>
    Task<GetProfileResponse> GetProfileAsync(Guid userId);

    /// <summary>
    /// Updates the user profile.
    /// </summary>
    /// <param name="userId">The user ID.</param>
    /// <param name="request">The update profile request.</param>
    /// <returns>The updated user profile response.</returns>
    Task<GetProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);

    /// <summary>
    /// Ensures a user profile exists, creating it if necessary.
    /// </summary>
    /// <param name="userId">The user ID.</param>
    /// <returns>The user profile response.</returns>
    Task<GetProfileResponse> EnsureProfileExistsAsync(Guid userId);

    /// <summary>
    /// Gets the user preferences for the specified user.
    /// </summary>
    /// <param name="userId">The user ID.</param>
    /// <returns>The user preferences response.</returns>
    Task<UserPreferencesResponse> GetPreferencesAsync(Guid userId);

    /// <summary>
    /// Updates the user preferences.
    /// </summary>
    /// <param name="userId">The user ID.</param>
    /// <param name="request">The update preferences request.</param>
    /// <returns>The updated user preferences response.</returns>
    Task<UserPreferencesResponse> UpdatePreferencesAsync(Guid userId, UpdateUserPreferencesRequest request);

    /// <summary>
    /// Uploads a new avatar image for the user.
    /// </summary>
    /// <param name="userId">The user ID.</param>
    /// <param name="fileStream">The file stream containing the image data.</param>
    /// <param name="fileName">The original file name.</param>
    /// <param name="contentType">The MIME content type of the file.</param>
    /// <returns>The avatar upload response containing the new URL.</returns>
    Task<AvatarUploadResponse> UploadAvatarAsync(Guid userId, Stream fileStream, string fileName, string contentType);
}
