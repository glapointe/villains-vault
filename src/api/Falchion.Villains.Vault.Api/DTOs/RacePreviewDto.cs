using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

public class RacePreviewDto
{
	public string Url { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;
	public DateTime RaceDate { get; set; }
	public RaceDistance? Distance { get; set; }
	public string? Notes { get; set; }
	public bool IsExisting { get; set; }
	public int? ExistingId { get; set; }
	public int ResultCount { get; set; }
}
