namespace Falchion.Villains.Vault.Api.DTOs;

public class SubmitEventResponseDto
{
	public EventDto Event { get; set; } = null!;
	public List<RaceDto> Races { get; set; } = new();
	public List<int> JobIds { get; set; } = new();
	public List<string> Errors { get; set; } = new();
}
