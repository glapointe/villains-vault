using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

public class SubmitRaceDto
{
	public string Url { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;
	public DateTime RaceDate { get; set; }
	public RaceDistance Distance { get; set; }
	public string? Notes { get; set; }
	public bool ShouldProcess { get; set; }
}
