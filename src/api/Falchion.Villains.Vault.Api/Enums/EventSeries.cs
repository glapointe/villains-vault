namespace Falchion.Villains.Vault.Api.Enums
{
    /// <summary>
    /// Enumeration representing the different event series for Disney running events. This enum is used to categorize events based on their series, which can be determined from event labels and dates. The values include specific series such as Disneyland Halloween, Disneyland Half Marathon, Disney World Wine & Dine, Disney World Marathon, Disney World Princess, and Disney World Springtime Surprise (Star Wars) Weekend, as well as an Unknown category for cases where the series cannot be determined.
    /// </summary>
    public enum EventSeries
    {
        /// <summary>
        /// The event series cannot be determined from the available data (e.g., missing or unrecognized event label and date).
        /// </summary>
        Unknown = 0,

        /// <summary>
        /// The Disneyland Halloween Weekend event series typically occurs in September.
        /// </summary>
        DisneylandHalloween = 1,

        /// <summary>
        /// The Disneyland Half Marathon Weekend event series typically occurs in late January.
        /// </summary>
        DisneylandHalfMarathon = 2,

        /// <summary>
        /// The Disney World Wine & Dine Weekend event series typically occurs in early November or late October.
        /// </summary>
        DisneyWorldWineAndDine = 3,

        /// <summary>
        /// The Disney World Marathon Weekend event series typically occurs in early January.
        /// </summary>
        DisneyWorldMarathon = 4,

        /// <summary>
        /// The Disney World Princess Weekend event series typically occurs in late February.
        /// </summary>
        DisneyWorldPrincess = 5,

        /// <summary>
        /// The Disney World Springtime Surprise (also the Star Wars) Weekend event series typically occurs in early April.
        /// </summary>
        DisneyWorldSpringtime = 6
    }

    /// <summary>
    /// Provides helper methods for determining the event series based on event labels and dates.
    /// </summary>
    /// <remarks>This static class contains utility functions for mapping event information, such as labels
    /// and dates, to corresponding event series values. It is intended for use in scenarios where event categorization
    /// is required based on user input or event metadata.</remarks>
    public static class EventSeriesHelpers
    {
        /// <summary>
        /// Parses the event series from the given event label and date. The method uses a combination of keyword matching in the label and the month of the date to determine the most likely event series. If both the label and date are missing or unrecognized, it returns EventSeries.Unknown.
        /// </summary>
        /// <param name="label"></param>
        /// <param name="date"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentNullException"></exception>
        public static EventSeries ParseFromEventLabelDate(string? label, DateTime? date)
        {
            if (string.IsNullOrWhiteSpace(label) && date == null)
            {
                throw new ArgumentNullException(nameof(label));
            }

            if (!string.IsNullOrWhiteSpace(label))
            {
                if (label.Contains("halloween", StringComparison.OrdinalIgnoreCase))
                {
                    return EventSeries.DisneylandHalloween;
                }

                if (label.Contains("disneyland", StringComparison.OrdinalIgnoreCase) && label.Contains("half", StringComparison.OrdinalIgnoreCase))
                {
                    return EventSeries.DisneylandHalfMarathon;
                }

                if (label.Contains("wine", StringComparison.OrdinalIgnoreCase))
                {
                    return EventSeries.DisneyWorldWineAndDine;
                }

                if (label.Contains("princess", StringComparison.OrdinalIgnoreCase))
                {
                    return EventSeries.DisneyWorldPrincess;
                }

                if (label.Contains("springtime", StringComparison.OrdinalIgnoreCase)
                    || label.Contains("star wars", StringComparison.OrdinalIgnoreCase))
                {
                    return EventSeries.DisneyWorldSpringtime;
                }

                if (label.Contains("marathon", StringComparison.OrdinalIgnoreCase))
                {
                    return EventSeries.DisneyWorldMarathon;
                }
            }

            if (date == null)
            {
                return EventSeries.Unknown;
            }

            return date.Value.Month switch
            {
                9 => EventSeries.DisneylandHalloween,
                10 or 11 => EventSeries.DisneyWorldWineAndDine,
                2 or 3 => EventSeries.DisneyWorldPrincess,
                4 or 5 => EventSeries.DisneyWorldSpringtime,
                1 => date.Value.Day <= 14 ? EventSeries.DisneyWorldMarathon : EventSeries.DisneylandHalfMarathon,
                _ => EventSeries.Unknown
            };
        }
    }
}
