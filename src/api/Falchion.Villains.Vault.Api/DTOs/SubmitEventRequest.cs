namespace Falchion.Villains.Vault.Api.DTOs;

public class SubmitEventRequest
{
	public string Url { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;
	public List<SubmitRaceDto> Races { get; set; } = new();
}
