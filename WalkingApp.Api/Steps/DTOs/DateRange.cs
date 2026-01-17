namespace WalkingApp.Api.Steps.DTOs;

/// <summary>
/// Value object representing a date range for queries.
/// </summary>
public class DateRange
{
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
}
