using WalkingApp.Api.Activity.DTOs;

namespace WalkingApp.Api.Activity;

/// <summary>
/// Service interface for activity feed business logic.
/// </summary>
public interface IActivityService
{
    /// <summary>
    /// Gets the activity feed for a user, including their own activities and their friends' activities.
    /// </summary>
    /// <param name="userId">The ID of the user requesting the feed.</param>
    /// <param name="limit">Maximum number of items to return (default: 20).</param>
    /// <param name="offset">Number of items to skip for pagination (default: 0).</param>
    /// <returns>The paginated activity feed response.</returns>
    Task<ActivityFeedResponse> GetFeedAsync(Guid userId, int limit = 20, int offset = 0);
}
