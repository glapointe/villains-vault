namespace Falchion.Villains.Vault.Api.DTOs;

public class EventPreviewDto
{
	public string Url { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;
	public bool IsExisting { get; set; }
	public int? ExistingId { get; set; }
	public List<RacePreviewDto> Races { get; set; } = new();
}
