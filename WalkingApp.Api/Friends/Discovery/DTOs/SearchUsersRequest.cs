using System.ComponentModel.DataAnnotations;

namespace WalkingApp.Api.Friends.Discovery.DTOs;

/// <summary>
/// Request DTO for searching users by display name.
/// </summary>
public class SearchUsersRequest
{
    /// <summary>
    /// Search query string.
    /// </summary>
    [Required]
    [MinLength(1)]
    [MaxLength(100)]
    public string Query { get; set; } = string.Empty;
}
