using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Models;

namespace Falchion.Villains.Vault.Api.DTOs
{
    public class RaceWithStatsDto : RaceDto
    {
        public RaceStats? RaceStats { get; set; }

        /// <summary>
        /// Converts a Race entity to a DTO.
        /// </summary>
        public static RaceWithStatsDto FromEntity(Race race)
        {
            var raceDto = RaceDto.FromEntity<RaceWithStatsDto>(race);

            if (!string.IsNullOrEmpty(race.StatisticsJson)) 
            { 
                try
                {
                    raceDto.RaceStats = RaceStats.FromJson(race.StatisticsJson);
                }
                catch (Exception)
                {
                    // Ignore JSON parsing errors
                }
            }
            return raceDto;
        }
    }
}
