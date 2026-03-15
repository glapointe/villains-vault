/**
 * Race result columns that can be used for sorting
 * Matches backend RaceResultColumn enum
 */
export enum RaceResultColumn {
	DivisionPlace = 'DivisionPlace',
	Name = 'Name',
	BibNumber = 'BibNumber',
	Age = 'Age',
	OverallPlace = 'OverallPlace',
	GenderPlace = 'GenderPlace',
    Gender = 'Gender',
	Split1 = 'Split1',
	Split2 = 'Split2',
	Split3 = 'Split3',
	Split4 = 'Split4',
	Split5 = 'Split5',
	Split6 = 'Split6',
	Split7 = 'Split7',
	Split8 = 'Split8',
	Split9 = 'Split9',
	Split10 = 'Split10',
	ClockTime = 'ClockTime',
	NetTime = 'NetTime',
	StartTime = 'StartTime',
	OverallPace = 'OverallPace',
	Hometown = 'Hometown',
	Passes = 'Passes',
	Passers = 'Passers',
    TimeDifference = 'TimeDifference', // Only for compare mode
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';
