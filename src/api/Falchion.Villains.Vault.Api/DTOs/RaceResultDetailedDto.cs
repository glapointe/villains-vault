using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO for an individual race result returned to the frontend.
/// </summary>
public class RaceResultDetailedDto : RaceResultDto
{
	public int RaceRunners { get; set; }
	public int DivisionRunners { get; set; }

    /// <summary>
    /// Converts a RaceResult entity to a DTO.
    /// </summary>
    public static RaceResultDetailedDto FromEntity(RaceResult result)
	{
		var raceResultDto = RaceResultDto.FromEntity<RaceResultDetailedDto>(result);
        return raceResultDto;
	}
}
