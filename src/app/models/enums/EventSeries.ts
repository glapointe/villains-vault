/**
 * Defines the EventSeries enum to categorize different RunDisney event series based on their typical timing and characteristics.
 * This can be used to enhance the agent's understanding of event context and provide more relevant responses.
 */
export enum EventSeries {
    /** The event series cannot be determined from the available data (e.g., missing or unrecognized event label and date). */
    Unknown = 0,

    /** The Disneyland Halloween Weekend event series typically occurs in September. */
    DisneylandHalloween = 1,

    /** The Disneyland Half Marathon Weekend event series typically occurs in late January. */
    DisneylandHalfMarathon = 2,

    /** The Disney World Wine & Dine Weekend event series typically occurs in early November or late October. */
    /// </summary>
    DisneyWorldWineAndDine = 3,

    /** The Disney World Marathon Weekend event series typically occurs in early January. */
    DisneyWorldMarathon = 4,

    /** The Disney World Princess Weekend event series typically occurs in late February. */
    DisneyWorldPrincess = 5,

    /** The Disney World Springtime Surprise / Star Wars Weekend event series typically occurs in early April. */
    DisneyWorldSpringtime = 6
}

/**
 * Get the display label for a given event series.
 * @param series The event series enum value
 * @returns A string label for the event series
 */
export function getEventSeriesLabel(series: EventSeries): string {
	switch (series) {
		case EventSeries.DisneylandHalloween: return 'Disneyland Halloween Weekend';
		case EventSeries.DisneylandHalfMarathon: return 'Disneyland Half Marathon Weekend';
		case EventSeries.DisneyWorldWineAndDine: return 'Disney World Wine & Dine Weekend';
		case EventSeries.DisneyWorldMarathon: return 'Disney World Marathon Weekend';
		case EventSeries.DisneyWorldPrincess: return 'Disney World Princess Weekend';
		case EventSeries.DisneyWorldSpringtime: return 'Disney World Springtime Surprise / Star Wars Weekend';
		default: return 'Unknown';
	}
}
