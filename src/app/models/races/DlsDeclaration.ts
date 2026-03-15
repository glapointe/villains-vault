/**
 * DLS Declaration model
 * Represents a user's declaration that they intend to DLS (Dead Last Start) a race
 */
export interface DlsDeclaration {
	/** Declaration ID */
	id: number;
	/** The DLS race this declaration belongs to */
	dlsRaceId: number;
	/** Display name of the DLS race */
	dlsRaceName: string;
	/** The runner's bib number (optional, may be added later) */
	bibNumber: number | null;
	/** The user ID who made this declaration */
	userId: number | null;
	/** Display name of the user */
	userDisplayName: string | null;
	/** Whether this is the user's first DLS */
	isFirstDls: boolean;
	/** Whether the user is going for kills */
	isGoingForKills: boolean;
	/** Optional comments from the user */
	comments: string | null;
	/** When this declaration was created */
	createdAt: string;
}

/**
 * Request to create a new DLS race (admin)
 */
export interface CreateDlsRaceRequest {
	/** Display name for the DLS race */
	name: string;
	/** The date of the race */
	raceDate: string;
}

/**
 * Request to update a DLS race (admin)
 */
export interface UpdateDlsRaceRequest {
	/** Updated name (optional) */
	name?: string;
	/** Updated date (optional) */
	raceDate?: string;
}

/**
 * Request to self-declare for a DLS race
 */
export interface CreateDlsDeclarationRequest {
	/** The DLS race to declare for */
	dlsRaceId: number;
	/** Optional bib number */
	bibNumber?: number;
	/** Whether this is the user's first DLS */
	isFirstDls?: boolean;
	/** Whether the user is going for kills */
	isGoingForKills?: boolean;
	/** Optional comments */
	comments?: string;
}

/**
 * Request to update a declaration
 */
export interface UpdateDlsDeclarationRequest {
	/** Updated bib number */
	bibNumber?: number | null;
	/** Whether this is the user's first DLS */
	isFirstDls?: boolean;
	/** Whether the user is going for kills */
	isGoingForKills?: boolean;
	/** Optional comments */
	comments?: string;
}

export interface ImportDlsDeclarationRequest {
	/** The user's display name (for imported declarations without a user account - attempt to match to an account, otherwise ignored) */
	name?: string;

	/** Bib number is a required field for imports to allow matching to existing declarations and users. Admins can provide this when importing, users can add later if self-declaring without a bib. */
	bibNumber: number;

	/** Whether this is the user's first DLS */
	isFirstDls?: boolean;

	/** Whether the user is going for kills */
	isGoingForKills?: boolean;

	/** Optional user comments */
	comments?: string;
}
